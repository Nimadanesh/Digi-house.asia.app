// File responsibility: Luxe Circle data contract — the private ownership
// network shapes. Prototype-safe: counts stay consistent with record arrays,
// and the UI contract never changes when a real source replaces the prototype.

export type CircleMemberStatus = "owner" | "exploring" | "invited";

export interface CircleMember {
  id: string;
  displayName: string;
  status: CircleMemberStatus;
  joinedAt: string;
}

export type CirclePropertyRelation = "shared" | "exploring";

export interface CircleProperty {
  estateId: string;
  relation: CirclePropertyRelation;
  memberCount: number;
}

export interface LuxeCircleSummary {
  memberCount: number;
  sharedPropertyCount: number;
  members: CircleMember[];
  sharedProperties: CircleProperty[];
  /** True while no real Circle backend exists; UI must render honest empty states. */
  isPrototype: boolean;
}
