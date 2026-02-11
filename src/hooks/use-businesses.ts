import { useAtomValue, useSetAtom } from 'jotai';
import { useAuth } from '@/hooks/use-auth';
import {
  businessListAtom,
  activeBusinessAtom,
  activeBusinessIdAtom,
  businessesLoadedAtom,
  businessesLoadingAtom,
} from '@/store/business-atoms';
import {
  getUserBusinesses,
  createBusiness,
  deleteBusiness,
} from '@/lib/business-firestore';
import { BUSINESS_TYPE_TEMPLATES } from '@/lib/business-templates';
import type { BusinessType } from '@/types';

export function useBusinesses() {
  // State access
  const businesses = useAtomValue(businessListAtom);
  const activeBusiness = useAtomValue(activeBusinessAtom);
  const isLoading = useAtomValue(businessesLoadingAtom);
  const setBusinessList = useSetAtom(businessListAtom);
  const setActiveBusinessId = useSetAtom(activeBusinessIdAtom);
  const setBusinessesLoaded = useSetAtom(businessesLoadedAtom);
  const { user } = useAuth();

  // Load businesses for current user from Firestore
  async function loadBusinesses() {
    if (!user) return;
    try {
      const list = await getUserBusinesses(user.uid);
      setBusinessList(list);

      // Restore active business from localStorage
      const storedId = localStorage.getItem("active-business-id");
      if (storedId && list.some((b) => b.id === storedId)) {
        setActiveBusinessId(storedId);
      } else if (list.length > 0) {
        setActiveBusinessId(list[0].id);
      }
    } catch {
      /* silent - app works without businesses loaded */
    } finally {
      setBusinessesLoaded(true);
    }
  }

  // Switch active business
  function switchBusiness(businessId: string) {
    setActiveBusinessId(businessId);
    localStorage.setItem("active-business-id", businessId);
  }

  // Create a new business
  async function createNewBusiness(
    name: string,
    type: BusinessType,
    description: string
  ): Promise<string> {
    if (!user) throw new Error("Not authenticated");

    const now = new Date().toISOString();
    const template = BUSINESS_TYPE_TEMPLATES.find((t) => t.type === type);

    const businessId = await createBusiness({
      ownerId: user.uid,
      templateId: "",
      templateVersion: 0,
      roles: { [user.uid]: "owner" },
      enabledSections: template?.defaultSections ?? [],
      profile: {
        name,
        type,
        industry: "",
        location: "",
        description,
        currency: "USD",
      },
      createdAt: now,
      updatedAt: now,
    });

    // Refresh list and switch to new business
    const updatedList = await getUserBusinesses(user.uid);
    setBusinessList(updatedList);
    switchBusiness(businessId);

    return businessId;
  }

  // Delete a business
  async function removeBusiness(businessId: string) {
    await deleteBusiness(businessId);
    // Remove from local list
    setBusinessList((prev) => prev.filter((b) => b.id !== businessId));
    // If deleted the active business, switch to first remaining
    const remaining = businesses.filter((b) => b.id !== businessId);
    if (remaining.length > 0) {
      switchBusiness(remaining[0].id);
    } else {
      setActiveBusinessId(null);
      localStorage.removeItem("active-business-id");
    }
  }

  return {
    businesses,
    activeBusiness,
    isLoading,
    loadBusinesses,
    switchBusiness,
    createNewBusiness,
    removeBusiness,
  };
}
