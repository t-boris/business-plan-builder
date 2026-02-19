import { useAtomValue, useSetAtom } from 'jotai';
import { useAuth } from '@/hooks/use-auth';
import {
  businessListAtom,
  activeBusinessAtom,
  businessesLoadedAtom,
  businessesLoadingAtom,
} from '@/store/business-atoms';
import {
  getUserBusinesses,
  createBusiness,
  deleteBusiness,
  updateBusiness,
  saveBusinessVariables,
} from '@/lib/business-firestore';
import { BUSINESS_TYPE_TEMPLATES } from '@/lib/business-templates';
import { getDefaultVariables } from '@/lib/variable-templates';
import { createLogger } from '@/lib/logger';
import { updateSyncAtom } from '@/store/sync-atoms';
import type { BusinessType, BusinessProfile } from '@/types';

const log = createLogger('business');

export function useBusinesses() {
  // State access
  const businesses = useAtomValue(businessListAtom);
  const activeBusiness = useAtomValue(activeBusinessAtom);
  const isLoading = useAtomValue(businessesLoadingAtom);
  const setBusinessList = useSetAtom(businessListAtom);
  const setBusinessesLoaded = useSetAtom(businessesLoadedAtom);
  const setSyncStatus = useSetAtom(updateSyncAtom);
  const { user } = useAuth();

  // Load businesses for current user from Firestore
  // Note: Does NOT set activeBusinessIdAtom — that is now the router's job
  // via BusinessContextLayout syncing URL param → atom
  async function loadBusinesses() {
    if (!user) return;
    try {
      const list = await getUserBusinesses(user.uid);

      // Migrate: ensure growth-timeline is in enabledSections for existing businesses
      for (const biz of list) {
        if (!biz.enabledSections.includes('growth-timeline')) {
          const idx = biz.enabledSections.indexOf('financial-projections');
          if (idx !== -1) {
            biz.enabledSections.splice(idx + 1, 0, 'growth-timeline');
          } else {
            biz.enabledSections.push('growth-timeline');
          }
          updateBusiness(biz.id, { enabledSections: biz.enabledSections }).catch(() => {});
        }
      }

      setBusinessList(list);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.warn('load.failed', { userId: user.uid, error: message });
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

    // Auto-populate variables from business type template
    const defaultVars = getDefaultVariables(type);
    await saveBusinessVariables(businessId, defaultVars);

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

  // Update profile fields on the active business
  // Optimistic local update + background Firestore persistence
  function updateProfile(fields: Partial<BusinessProfile>) {
    if (!activeBusiness) return;
    const updatedProfile = { ...activeBusiness.profile, ...fields };
    setBusinessList((prev) =>
      prev.map((b) =>
        b.id === activeBusiness.id
          ? { ...b, profile: updatedProfile, updatedAt: new Date().toISOString() }
          : b
      )
    );
    setSyncStatus({ domain: 'profile', state: 'saving' });
    updateBusiness(activeBusiness.id, { profile: updatedProfile })
      .then(() => {
        setSyncStatus({ domain: 'profile', state: 'saved', lastSaved: Date.now() });
        log.info('profile.saved', { businessId: activeBusiness.id });
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'Profile save failed';
        setSyncStatus({ domain: 'profile', state: 'error', error: message });
        log.error('profile.save.failed', { businessId: activeBusiness.id, error: message });
      });
  }

  // Toggle a section slug on/off for the active business
  // Optimistic local update + immediate Firestore persistence
  function toggleSection(slug: string) {
    if (!activeBusiness) return;
    const current = activeBusiness.enabledSections;
    const newSections = current.includes(slug)
      ? current.filter((s) => s !== slug)
      : [...current, slug];
    setBusinessList((prev) =>
      prev.map((b) =>
        b.id === activeBusiness.id
          ? { ...b, enabledSections: newSections, updatedAt: new Date().toISOString() }
          : b
      )
    );
    setSyncStatus({ domain: 'sections', state: 'saving' });
    updateBusiness(activeBusiness.id, { enabledSections: newSections })
      .then(() => {
        setSyncStatus({ domain: 'sections', state: 'saved', lastSaved: Date.now() });
        log.info('sections.saved', { businessId: activeBusiness.id, slug });
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'Section toggle failed';
        setSyncStatus({ domain: 'sections', state: 'error', error: message });
        log.error('sections.save.failed', { businessId: activeBusiness.id, slug, error: message });
      });
  }

  return {
    businesses,
    activeBusiness,
    isLoading,
    loadBusinesses,
    switchBusiness,
    createNewBusiness,
    removeBusiness,
    updateProfile,
    toggleSection,
  };
}
