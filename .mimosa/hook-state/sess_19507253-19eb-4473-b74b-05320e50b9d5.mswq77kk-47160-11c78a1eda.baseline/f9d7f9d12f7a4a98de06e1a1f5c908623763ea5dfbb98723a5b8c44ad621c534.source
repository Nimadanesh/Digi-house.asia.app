// File responsibility: a thin skeleton for future on-chain smart-contract interactions.
// MVP: NOT wired into the app. Phase 6+ subclasses this for the real Distribution
// jetton / property contracts. Components never touch this — only lib/ton services
// build messages through useTonConnect's send().
import { Address, beginCell, type Cell } from "@ton/core";
import type { GetterCall, GetterReturn, SendMessageBody } from "./types";

export abstract class ContractBase {
  /** The on-chain address this wrapper talks to. */
  protected readonly address: Address;

  constructor(address: Address) {
    this.address = address;
  }

  /** Wrap a getter descriptor (read-side). Future impl runs getMethod via TonApiClient. */
  protected getter<T extends GetterReturn>(call: GetterCall<T>): GetterCall<T> {
    return call;
  }

  /**
   * Encode an outbound message body: a 32-bit op-code followed by the payload slice.
   * The resulting cell is attached as a TonConnect message body (see lib/ton/sendTx).
   */
  protected buildMessage(msg: SendMessageBody): Cell {
    const body = typeof msg.body === "function" ? msg.body() : msg.body;
    return beginCell()
      .storeUint(msg.opCode, 32)
      .storeSlice(body.beginParse())
      .endCell();
  }

  /**
   * Subclasses declare their read API (GET-methods). The future real repo calls these
   * through TonApiClient and decodes via each GetterCall.decode.
   */
  abstract listGetters(): readonly GetterCall[];
}