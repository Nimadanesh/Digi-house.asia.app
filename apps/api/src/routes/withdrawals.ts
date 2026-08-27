import { Hono } from "hono";
import type { MiddlewareHandler } from "hono";
import type { AuditStore } from "../audit/audit-store.js";
import { writeAuditEvent } from "../audit/write-audit.js";
import { requireSession } from "../auth/require-session.js";
import type { SessionConfig } from "../auth/session.js";
import type { UserStore } from "../auth/user-store.js";
import type { TxStore } from "../buys/tx-store.js";
import type { Logger } from "../logger.js";
import type { BalanceStore } from "../money/balance-store.js";
import { sendTelegramMessage } from "../notify/telegram-notify.js";
import { slidingWindowRateLimit } from "../lib/rate-limit.js";
import type {
  WithdrawalInstallmentRecord,
  WithdrawalInstallmentStore,
} from "../withdrawals/installment-store.js";
import type { WithdrawalRecord, WithdrawalStore } from "../withdrawals/withdrawal-store.js";
import { requestWithdrawal } from "../withdrawals/withdrawal-service.js";

export type WithdrawalInstallmentPublic = {
  seq: number;
  amountUsd: number;
  status: WithdrawalInstallmentRecord["status"];
  dueAt: string;
  paidAt: string | null;
  txHash: string | null;
};

export type WithdrawalPublic = {
  id: string;
  amountUsd: number;
  /** 1% withdrawal fee (FractionalLuxe revenue), integer cents. */
  feeUsd: number;
  /** gross − fee, integer cents. */
  netUsd: number;
  address: string;
  status: WithdrawalRecord["status"];
  txHash: string | null;
  installments: WithdrawalInstallmentPublic[];
  createdAt: string;
  updatedAt: string;
};

export type WithdrawalRouteDeps = {
  session: SessionConfig;
  users: UserStore;
  balances: BalanceStore;
  transactions: TxStore;
  withdrawals: WithdrawalStore;
  installments: WithdrawalInstallmentStore;
  log?: Logger;
  audit?: AuditStore | null;
  rateLimiter?: MiddlewareHandler;
  /** Optional Telegram notify on request (fail-open). */
  notify?: { botToken: string } | null;
};

function isPositiveInt(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= 1;
}

export function installmentToPublic(
  i: WithdrawalInstallmentRecord,
): WithdrawalInstallmentPublic {
  return {
    seq: i.seq,
    amountUsd: i.amountUsd,
    status: i.status,
    dueAt: i.dueAt.toISOString(),
    paidAt: i.paidAt?.toISOString() ?? null,
    txHash: i.txHash,
  };
}

export function withdrawalToPublic(
  w: WithdrawalRecord,
  installments: WithdrawalInstallmentRecord[] = [],
): WithdrawalPublic {
  return {
    id: w.id,
    amountUsd: w.amountUsd,
    feeUsd: w.feeUsd,
    netUsd: w.amountUsd - w.feeUsd,
    address: w.address,
    status: w.status,
    txHash: w.txHash,
    installments: installments.map(installmentToPublic),
    createdAt: w.createdAt.toISOString(),
    updatedAt: w.updatedAt.toISOString(),
  };
}

/**
 * POST /v1/withdrawals (PE-02, locked model) — request a USDT payout from the withdrawable
 * balance; debits the gross atomically, charges the 1% fee, and pays the net in 4 weekly
 * installments. GET /v1/withdrawals — the caller's requests with installment progress.
 */
export function createWithdrawalRoutes(deps: WithdrawalRouteDeps) {
  const app = new Hono();

  const sessionMw = requireSession({ session: deps.session, users: deps.users });
  const rateLimit =
    deps.rateLimiter ??
    slidingWindowRateLimit({
      windowMs: 60_000,
      max: 10,
      key: (c) => c.get("userId"),
    });

  app.get("/v1/withdrawals", sessionMw, async (c) => {
    const userId = c.get("userId");
    const rows = await deps.withdrawals.listByUser(userId);
    const installments = await deps.installments.listByWithdrawals(
      rows.map((r) => r.id),
    );
    return c.json({
      withdrawals: rows.map((w) =>
        withdrawalToPublic(
          w,
          installments.filter((i) => i.withdrawalId === w.id),
        ),
      ),
    });
  });

  app.post("/v1/withdrawals", sessionMw, rateLimit, async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ code: "validation_error", message: "Invalid JSON body" }, 400);
    }
    const b = (body ?? {}) as Record<string, unknown>;
    const amountUsd = b.amountUsd;

    if (!isPositiveInt(amountUsd)) {
      return c.json(
        {
          code: "validation_error",
          message: "amountUsd must be an integer >= 1 (cents)",
        },
        400,
      );
    }

    const userId = c.get("userId");
    const result = await requestWithdrawal(
      {
        users: deps.users,
        balances: deps.balances,
        transactions: deps.transactions,
        withdrawals: deps.withdrawals,
        installments: deps.installments,
      },
      { userId, amountUsd },
    );

    if (!result.ok) {
      switch (result.code) {
        case "no_withdrawal_address":
          return c.json(
            {
              code: "no_withdrawal_address",
              message: "Set a USDT withdrawal address in Settings first",
            },
            400,
          );
        case "insufficient_balance":
          return c.json(
            {
              code: "insufficient_balance",
              message: "Withdrawable balance is too low for this amount",
            },
            409,
          );
        default:
          return c.json({ code: "not_found", message: "User not found" }, 404);
      }
    }

    if (deps.audit) {
      await writeAuditEvent(deps.audit, {
        action: "withdraw.request",
        actorType: "user",
        actorUserId: userId,
        resourceType: "withdrawal",
        resourceId: result.withdrawal.id,
        summary: `Withdrawal requested: $${(amountUsd / 100).toFixed(2)} to ${result.withdrawal.address} (1% fee, 4 weekly installments)`,
        payload: {
          withdrawalId: result.withdrawal.id,
          amountUsd,
          feeUsd: result.feeUsd,
          netUsd: result.netUsd,
          address: result.withdrawal.address,
        },
        requestId: (c.var as { requestId?: string }).requestId ?? null,
      });
    }

    if (deps.notify) {
      try {
        await sendTelegramMessage({
          botToken: deps.notify.botToken,
          chatId: userId,
          text:
            `💸 Withdrawal requested\n` +
            `$${(amountUsd / 100).toFixed(2)} USDT — 1% fee, paid in 4 weekly installments.`,
        });
      } catch {
        // fail-open: notification must never block the withdrawal request
      }
    }

    return c.json(
      {
        withdrawal: withdrawalToPublic(
          result.withdrawal,
          result.installments,
        ),
      },
      201,
    );
  });

  return app;
}
