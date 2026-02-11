import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Business } from "@/types";

interface DeleteBusinessDialogProps {
  business: Business | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}

export function DeleteBusinessDialog({
  business,
  open,
  onOpenChange,
  onConfirm,
}: DeleteBusinessDialogProps) {
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const isMatch = confirmText === business?.profile.name;

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setConfirmText("");
      setIsDeleting(false);
    }
  }, [open]);

  async function handleDelete() {
    if (!isMatch) return;
    setIsDeleting(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setIsDeleting(false);
      setConfirmText("");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Business</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the
            business{" "}
            <span className="font-semibold text-foreground">
              &ldquo;{business?.profile.name}&rdquo;
            </span>{" "}
            and all associated data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">
            To confirm, type{" "}
            <span className="font-semibold text-foreground">
              {business?.profile.name}
            </span>{" "}
            below:
          </label>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={business?.profile.name}
            autoComplete="off"
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!isMatch || isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Business"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
