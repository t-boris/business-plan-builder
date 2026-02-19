import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { useAtomValue } from "jotai";
import { authStatusAtom } from "@/store/auth-atoms";
import { getInvite, acceptInvite, getBusiness } from "@/lib/business-firestore";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader2, Briefcase, AlertCircle } from "lucide-react";
import type { BusinessInvite } from "@/types";

type InvitePageStatus =
  | "loading"
  | "invalid"
  | "ready"
  | "already-member"
  | "accepting"
  | "error";

export function AcceptInvite() {
  const { inviteId } = useParams<{ inviteId: string }>();
  const navigate = useNavigate();
  const authStatus = useAtomValue(authStatusAtom);
  const { user, signInWithGoogle } = useAuth();

  const [pageStatus, setPageStatus] = useState<InvitePageStatus>("loading");
  const [invite, setInvite] = useState<BusinessInvite | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [signingIn, setSigningIn] = useState(false);

  // Fetch invite data (does NOT require auth — invite ID is the token)
  useEffect(() => {
    if (!inviteId) {
      setPageStatus("invalid");
      return;
    }

    let cancelled = false;

    async function fetchInvite() {
      try {
        const inv = await getInvite(inviteId!);
        if (cancelled) return;
        if (!inv || inv.status !== "active") {
          setPageStatus("invalid");
          return;
        }
        setInvite(inv);
        setPageStatus("ready");
      } catch {
        if (!cancelled) {
          setPageStatus("error");
          setErrorMessage("Failed to load invite details.");
        }
      }
    }

    fetchInvite();

    return () => {
      cancelled = true;
    };
  }, [inviteId]);

  // Check if already a member once authenticated
  useEffect(() => {
    if (!invite || authStatus !== "authenticated" || !user) return;

    let cancelled = false;

    async function checkMembership() {
      try {
        const biz = await getBusiness(invite!.businessId);
        if (cancelled) return;
        if (biz && biz.roles[user!.uid]) {
          setPageStatus("already-member");
        }
      } catch {
        // User can't read business = not a member. That's fine — stay on "ready".
      }
    }

    checkMembership();

    return () => {
      cancelled = true;
    };
  }, [invite, authStatus, user]);

  // Redirect already-member after brief delay
  useEffect(() => {
    if (pageStatus === "already-member" && invite) {
      const timer = setTimeout(() => {
        navigate(`/business/${invite.businessId}`, { replace: true });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [pageStatus, invite, navigate]);

  async function handleJoin() {
    if (!invite || !user) return;
    setPageStatus("accepting");
    try {
      await acceptInvite(invite.id, invite.businessId, invite.role, user.uid);
      navigate(`/business/${invite.businessId}`, { replace: true });
    } catch {
      setPageStatus("error");
      setErrorMessage("Failed to join the business. Please try again.");
    }
  }

  async function handleSignIn() {
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } catch {
      setErrorMessage("Sign-in failed. Please try again.");
    } finally {
      setSigningIn(false);
    }
  }

  const businessName = invite?.businessName || "this business";
  const roleLabel = invite?.role === "editor" ? "an editor" : "a viewer";

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        {/* Loading state */}
        {pageStatus === "loading" && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Briefcase className="size-5" />
              </div>
              <CardTitle>Loading invite...</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center py-4">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </CardContent>
          </>
        )}

        {/* Invalid invite */}
        {pageStatus === "invalid" && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-lg bg-destructive text-destructive-foreground">
                <AlertCircle className="size-5" />
              </div>
              <CardTitle>Invalid or Expired Invite</CardTitle>
              <CardDescription>
                This invite link is no longer valid. It may have been revoked or
                the link is incorrect.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button asChild variant="outline">
                <Link to="/">Go to Home</Link>
              </Button>
            </CardContent>
          </>
        )}

        {/* Ready - not signed in */}
        {pageStatus === "ready" && authStatus !== "authenticated" && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Briefcase className="size-5" />
              </div>
              <CardTitle>Join {businessName}</CardTitle>
              <CardDescription>
                You have been invited as {roleLabel}. Sign in to accept the
                invitation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {errorMessage && (
                <p className="text-sm text-destructive text-center">
                  {errorMessage}
                </p>
              )}
              <Button
                className="w-full"
                onClick={handleSignIn}
                disabled={signingIn || authStatus === "loading"}
              >
                {signingIn ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in with Google"
                )}
              </Button>
            </CardContent>
          </>
        )}

        {/* Ready - signed in */}
        {pageStatus === "ready" && authStatus === "authenticated" && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Briefcase className="size-5" />
              </div>
              <CardTitle>Join {businessName}</CardTitle>
              <CardDescription>
                You have been invited as {roleLabel}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                Signed in as {user?.email}
              </p>
              <Button className="w-full" onClick={handleJoin}>
                Join Business
              </Button>
            </CardContent>
          </>
        )}

        {/* Already a member */}
        {pageStatus === "already-member" && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Briefcase className="size-5" />
              </div>
              <CardTitle>Already a Member</CardTitle>
              <CardDescription>
                You already have access to {businessName}.
                Redirecting...
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-4">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </CardContent>
          </>
        )}

        {/* Accepting state */}
        {pageStatus === "accepting" && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Briefcase className="size-5" />
              </div>
              <CardTitle>Joining {businessName}...</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center py-4">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </CardContent>
          </>
        )}

        {/* Error state */}
        {pageStatus === "error" && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-lg bg-destructive text-destructive-foreground">
                <AlertCircle className="size-5" />
              </div>
              <CardTitle>Something went wrong</CardTitle>
              <CardDescription>
                {errorMessage || "An unexpected error occurred."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button asChild variant="outline">
                <Link to="/">Go to Home</Link>
              </Button>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
