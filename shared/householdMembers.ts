export const HOUSEHOLD_MEMBERS = [
  {
    id: "abhinav",
    name: "Abhinav",
    email: "abhinav@family.local",
  },
  {
    id: "kanika",
    name: "Kanika",
    email: "kanika@family.local",
  },
] as const;

export type HouseholdMember = (typeof HOUSEHOLD_MEMBERS)[number];
export type HouseholdMemberId = HouseholdMember["id"];

export function isHouseholdMemberId(value: string): value is HouseholdMemberId {
  return (HOUSEHOLD_MEMBERS as ReadonlyArray<HouseholdMember>).some(
    (member) => member.id === value
  );
}

export function getHouseholdMemberById(id: HouseholdMemberId) {
  const match = HOUSEHOLD_MEMBERS.find((member) => member.id === id);
  if (!match) {
    throw new Error(`Unknown household member: ${id}`);
  }
  return match;
}
