"use client";
// File responsibility: route gate — incomplete profile → /profile-setup (mock + api).
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { useApiAuth } from "@/hooks/useApiAuth";
import { env } from "@/lib/env";
import { ROUTES } from "@/lib/constants";
import { Skeleton } from "@/components/common/Skeleton";

const ALLOWED = new Set<string>([
  ROUTES.profileSetup,
  ROUTES.onboarding,
  ROUTES.recoveryLogin,
]);

export function ProfileGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { status } = useApiAuth();

  // In mock mode the AuthProvider seeds the store user synchronously (status
  // "authenticated"). In api mode we only gate once an authenticated session is known.
  const authReady =
    env.dataSource === "mock" ? user != null : status === "authenticated";

  const needsProfile =
    authReady &&
    user != null &&
    user.onboarded === true &&
    user.profileCompleted === false;

  useEffect(() => {
    if (env.dataSource === "api" && status === "loading") return;
    if (!needsProfile) {
      if (
        pathname === ROUTES.profileSetup &&
        user?.profileCompleted === true &&
        user?.onboarded === true
      ) {
        router.replace(ROUTES.home);
      }
      return;
    }
    if (!ALLOWED.has(pathname)) {
      router.replace(ROUTES.profileSetup);
    }
  }, [needsProfile, pathname, router, status, user?.profileCompleted, user?.onboarded]);

  if (status === "loading" && env.dataSource === "api") {
    return (
      <div
        className="flex flex-1 flex-col items-center justify-center gap-3 py-24"
        data-testid="profile-gate-loading"
      >
        <Skeleton className="h-4 w-40" />
      </div>
    );
  }

  if (needsProfile && !ALLOWED.has(pathname)) {
    return (
      <div
        className="flex flex-1 flex-col items-center justify-center gap-3 py-24"
        data-testid="profile-gate-redirect"
      >
        <Skeleton className="h-4 w-32" />
      </div>
    );
  }

  return <>{children}</>;
}
