// File responsibility: Invite-to-Co-Own link builder — estate-scoped share
// context (inviter + estate) for FUTURE attribution only. Prototype: builds
// the link string; no parser, ledger, settlement, or backend lives here.
// Format: https://t.me/<bot>?startapp=coown_<estateId>_ref_<inviterId>

export interface CoOwnLinkInput {
  botUsername: string;
  estateId: string;
  inviterId: string;
}

/**
 * Build the co-own share link, or null when any input is missing/blank.
 * Never returns a malformed URL.
 */
export function buildCoOwnLink({ botUsername, estateId, inviterId }: CoOwnLinkInput): string | null {
  const bot = botUsername.trim();
  const estate = estateId.trim();
  const inviter = inviterId.trim();
  if (!bot || !estate || !inviter) return null;
  return `https://t.me/${bot}?startapp=coown_${estate}_ref_${inviter}`;
}
