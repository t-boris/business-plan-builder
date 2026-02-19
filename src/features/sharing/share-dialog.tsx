import { useState, useEffect, useCallback } from "react";
import { useAtomValue } from "jotai";
import { activeBusinessAtom } from "@/store/business-atoms";
import { useAuth } from "@/hooks/use-auth";
import {
  createInvite,
  listBusinessInvites,
  revokeInvite,
  removeBusinessRole,
} from "@/lib/business-firestore";
import type { BusinessInvite, BusinessRole } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Share2, Copy, Check, Trash2, Link as LinkIcon, Loader2, UserMinus } from "lucide-react";

export function ShareDialog({ children }: { children?: React.ReactNode }) {
  const business = useAtomValue(activeBusinessAtom);
  const { user } = useAuth();
  const [invites, setInvites] = useState<BusinessInvite[]>([]);
  const [role, setRole] = useState<BusinessRole>("editor");
  const [copied, setCopied] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [loadingInvites, setLoadingInvites] = useState(false);

  // Check if current user is owner
  const isOwner =
    business && user ? business.roles[user.uid] === "owner" : false;

  const loadInvites = useCallback(async () => {
    if (!business) return;
    setLoadingInvites(true);
    try {
      const list = await listBusinessInvites(business.id);
      setInvites(list);
    } catch (err) {
      console.error("Failed to load invites:", err);
    } finally {
      setLoadingInvites(false);
    }
  }, [business]);

  // Load invites when dialog opens
  useEffect(() => {
    if (open && business) {
      loadInvites();
    }
  }, [open, business, loadInvites]);

  async function handleCreateInvite() {
    if (!business || !user) return;
    setCreating(true);
    try {
      await createInvite(business.id, role, user.uid, business.profile.name || 'Business');
      await loadInvites();
    } catch (err) {
      console.error("Failed to create invite:", err);
    } finally {
      setCreating(false);
    }
  }

  async function handleRevokeInvite(inviteId: string) {
    try {
      await revokeInvite(inviteId);
      setInvites((prev) => prev.filter((inv) => inv.id !== inviteId));
    } catch (err) {
      console.error("Failed to revoke invite:", err);
    }
  }

  async function handleRemoveMember(uid: string) {
    if (!business) return;
    try {
      await removeBusinessRole(business.id, uid);
      // Note: optimistic removal from local display is not possible here since
      // business.roles is from the atom. The user would need to reload to see the change.
      // For now, close and re-open dialog to refresh.
    } catch (err) {
      console.error("Failed to remove member:", err);
    }
  }

  function handleCopyLink(inviteId: string) {
    const url = `${window.location.origin}/invite/${inviteId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(inviteId);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  function formatRole(r: BusinessRole): string {
    return r.charAt(0).toUpperCase() + r.slice(1);
  }

  const members = business ? Object.entries(business.roles) : [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="size-5" />
            Share {business?.profile.name ?? "Business"}
          </DialogTitle>
          <DialogDescription>
            Manage access to this business plan
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create invite link (owner only) */}
          {isOwner && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Create invite link</h3>
              <div className="flex items-center gap-2">
                <Select
                  value={role}
                  onValueChange={(v) => setRole(v as BusinessRole)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleCreateInvite}
                  disabled={creating}
                  size="sm"
                >
                  {creating ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <LinkIcon className="size-4" />
                      Create Link
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Active invite links (owner only) */}
          {isOwner && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Active invite links</h3>
              {loadingInvites ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="size-4 animate-spin" />
                  Loading...
                </div>
              ) : invites.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  No active invite links
                </p>
              ) : (
                <div className="space-y-2">
                  {invites.map((invite) => (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <LinkIcon className="size-4 text-muted-foreground" />
                        <span className="text-xs font-mono text-muted-foreground truncate max-w-[120px]">
                          {invite.id.slice(0, 8)}...
                        </span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                          {formatRole(invite.role)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyLink(invite.id)}
                          className="h-8 w-8 p-0"
                        >
                          {copied === invite.id ? (
                            <Check className="size-4 text-green-600" />
                          ) : (
                            <Copy className="size-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevokeInvite(invite.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* People with access */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">People with access</h3>
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                No members yet
              </p>
            ) : (
              <div className="space-y-2">
                {members.map(([uid, memberRole]) => {
                  const isCurrentUser = user?.uid === uid;
                  const isOwnerRole = memberRole === "owner";
                  return (
                    <div
                      key={uid}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                          {uid.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm truncate">
                            {uid}
                            {isCurrentUser && (
                              <span className="ml-1 text-muted-foreground">
                                (You)
                              </span>
                            )}
                          </p>
                        </div>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium shrink-0">
                          {formatRole(memberRole)}
                        </span>
                      </div>
                      {isOwner && !isOwnerRole && !isCurrentUser && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(uid)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive shrink-0"
                        >
                          <UserMinus className="size-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
