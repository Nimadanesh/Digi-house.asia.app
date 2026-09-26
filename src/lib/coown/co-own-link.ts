// File responsibility: Estate-scoped share link builder — share context
// (inviter + estate) for FUTURE attribution only. Prototype: builds the link
// string; no parser, ledger, settlement, or backend lives here.
// One generator, two explicit contexts (never a second system):
//   co-own invitation:  https://t.me/<bot>?startapp=coown_<estateId>_ref_<inviterId>
//   ownership share:    https://t.me/<bot>?startapp=own_<estateId>_ref_<inviterId>

export type ShareLinkContext = "coown" | "ownership";

const CONTEXT_PREFIX: Record<ShareLinkContext, string> = {
  coown: "coown",
  ownership: "own",
};

export interface CoOwnLinkInput {
  botUsername: string;
  estateId: string;
  inviterId: string;
  /** Share context; defaults to "coown" for backward compatibility. */
  context?: ShareLinkContext;
}

/**
 * Build the estate-scoped share link, or null when any input is missing/blank.
 * Never returns a malformed URL.
 */
export function buildCoOwnLink({
  botUsername,
  estateId,
  inviterId,
  context = "coown",
}: CoOwnLinkInput): string | null {
  const bot = botUsername.trim();
  const estate = estateId.trim();
  const inviter = inviterId.trim();
  if (!bot || !estate || !inviter) return null;
  return `https://t.me/${bot}?startapp=${CONTEXT_PREFIX[context]}_${estate}_ref_${inviter}`;
}
