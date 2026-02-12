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
import type { BusinessInvite, Business } from "@/types";

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
  const status = useAtomValue(authStatusAtom);
  const { user, signInWithGoogle } = useAuth();

  const [pageStatus, setPageStatus] = useState<InvitePageStatus>("loading");
  const [invite, setInvite] = useState<BusinessInvite | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [signingIn, setSigningIn] = useState(false);

  // Fetch invite and business data
  useEffect(() => {
    if (!inviteId) {
      setPageStatus("invalid");
      return;
    }

    // Wait for auth to resolve before fetching
    if (status === "loading") return;

    async function fetchInviteData() {
      try {
        const inv = await getInvite(inviteId!);
        if (!inv || inv.status !== "active") {
          setPageStatus("invalid");
          return;
        }
        setInvite(inv);

        const biz = await getBusiness(inv.businessId);
        if (!biz) {
          setPageStatus("invalid");
          return;
        }
        setBusiness(biz);

        // If user is authenticated, check if already a member
        if (user && biz.roles[user.uid]) {
          setPageStatus("already-member");
          return;
        }

        setPageStatus("ready");
      } catch {
        setPageStatus("error");
        setErrorMessage("Failed to load invite details.");
      }
    }

    fetchInviteData();
  }, [inviteId, status, user]);

  // Redirect already-member after brief delay
  useEffect(() => {
    if (pageStatus === "already-member" && business) {
      const timer = setTimeout(() => {
        navigate(`/business/${business.id}`, { replace: true });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [pageStatus, business, navigate]);

  async function handleJoin() {
    if (!invite || !business || !user) return;
    setPageStatus("accepting");
    try {
      await acceptInvite(invite.id, business.id, invite.role, user.uid);
      navigate(`/business/${business.id}`, { replace: true });
    } catch {
      setPageStatus("error");
      setErrorMessage("Failed to join the business. Please try again.");
    }
  }

  async function handleSignIn() {
    setSigningIn(true);
    try {
      await signInWithGoogle();
      // After sign-in, the auth status change will trigger a re-render
      // and the useEffect will re-fetch invite data with the new user
    } catch {
      setErrorMessage("Sign-in failed. Please try again.");
    } finally {
      setSigningIn(false);
    }
  }

  const roleLabel =
    invite?.role === "editor" ? "an editor" : "a viewer";

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        {/* Loading state */}
        {(pageStatus === "loading" || status === "loading") && (
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
        {pageStatus === "invalid" && status !== "loading" && (
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
        {pageStatus === "ready" && status === "unauthenticated" && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Briefcase className="size-5" />
              </div>
              <CardTitle>Join {business?.profile.name}</CardTitle>
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
                disabled={signingIn}
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
        {pageStatus === "ready" && status === "authenticated" && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Briefcase className="size-5" />
              </div>
              <CardTitle>Join {business?.profile.name}</CardTitle>
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
                You already have access to {business?.profile.name}.
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
              <CardTitle>Joining {business?.profile.name}...</CardTitle>
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
