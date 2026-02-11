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
  // Note: Does NOT set activeBusinessIdAtom — that is now the router's job
  // via BusinessContextLayout syncing URL param → atom
  async function loadBusinesses() {
    if (!user) return;
    try {
      const list = await getUserBusinesses(user.uid);
      setBusinessList(list);
    } catch {
      /* silent - app works without businesses loaded */
    } finally {
      setBusinessesLoaded(true);
    }
  }

  // Switch active business — only updates localStorage
  // The URL change + BusinessContextLayout handles atom sync
  function switchBusiness(businessId: string) {
    localStorage.setItem("active-business-id", businessId);
  }

  // Create a new business — returns the new business ID
  // Caller handles navigation to /business/${newId}
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

    // Refresh list (caller navigates to /business/${businessId})
    const updatedList = await getUserBusinesses(user.uid);
    setBusinessList(updatedList);

    return businessId;
  }

  // Delete a business — handles data operations only
  // Caller handles navigation after deletion
  async function removeBusiness(businessId: string) {
    await deleteBusiness(businessId);
    // Remove from local list
    setBusinessList((prev) => prev.filter((b) => b.id !== businessId));
    // Clear localStorage if deleted the stored business
    const storedId = localStorage.getItem("active-business-id");
    if (storedId === businessId) {
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
