"use client";

import { useIsParent } from "@/lib/auth-client";

/**
 * Renders children only when the signed-in user is a parent.
 *
 * When the signed-in user is Winter (child), renders a friendly
 * "parents only" panel instead. Use this at the top level of parent-
 * only views (ChestPoolView, Custom Quests editor, etc.) and around
 * individual parent-only sections inside mixed views (SettingsView).
 */
export default function ParentOnly({
  children,
  fallback,
  message = "This page is for parents only.",
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  message?: string;
}) {
  const isParent = useIsParent();
  if (isParent) return <>{children}</>;
  if (fallback !== undefined) return <>{fallback}</>;
  return (
    <div className="panel space-y-2">
      <div className="h3">🔒 PARENTS ONLY</div>
      <div className="text-sm muted">{message}</div>
    </div>
  );
}
