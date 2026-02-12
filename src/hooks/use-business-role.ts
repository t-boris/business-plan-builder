import { useAtomValue } from "jotai";
import { activeBusinessAtom } from "@/store/business-atoms";
import { useAuth } from "@/hooks/use-auth";
import type { BusinessRole } from "@/types";

/**
 * Returns the current user's role on the active business.
 * Returns null if no business is active or user has no role.
 */
export function useBusinessRole(): BusinessRole | null {
  const business = useAtomValue(activeBusinessAtom);
  const { user } = useAuth();
  if (!business || !user) return null;
  return business.roles[user.uid] ?? null;
}

/**
 * Returns true if the current user can edit the active business.
 * Only owners and editors can edit. Viewers and unauthenticated users cannot.
 */
export function useCanEdit(): boolean {
  const role = useBusinessRole();
  return role === "owner" || role === "editor";
}
