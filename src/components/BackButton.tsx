"use client";

import { useRouter } from "next/navigation";

/**
 * A ghost-styled back button that uses browser history (go back one
 * page). Falls back to navigating to "/" if there's no history (e.g.
 * direct URL load). Mounted at the bottom of every non-dashboard
 * view for consistent back-navigation.
 */
export default function BackButton({
  label = "← Dashboard",
}: {
  label?: string;
}) {
  const router = useRouter();
  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };
  return (
    <button
      type="button"
      className="block-btn ghost w-full"
      onClick={handleBack}
    >
      {label}
    </button>
  );
}
