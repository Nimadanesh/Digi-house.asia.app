// File responsibility: referral progress state (prototype). No ledger, no
// backend, no persistence: the prototype reports zero recorded qualified
// referrals, so the Club shows the locked ladder honestly. Swap the return
// value (never the shape) when a real referral source exists.
export function useReferralProgress(): { successfulReferrals: number; isPrototype: boolean } {
  return { successfulReferrals: 0, isPrototype: true };
}
