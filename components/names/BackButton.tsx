"use client";

import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();

  function handleClick() {
    router.back();
  }

  return (
    <button
      onClick={handleClick}
      className="mb-6 inline-flex items-center gap-1.5 font-mono text-xs sm:text-sm text-data hover:text-paper transition-colors"
    >
      ← Back
    </button>
  );
}
