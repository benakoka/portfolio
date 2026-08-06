"use client";

import { useState } from "react";
import { motion } from "motion/react";

export default function ShareButton({ name }: { name: string }) {
  const [copied, setCopied] = useState(false);
  const slug = name.toLowerCase();

  async function handleShare() {
    const url = `${window.location.origin}/names/name/${slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${name} — name profile`, url });
        return;
      } catch {
        // user cancelled or share failed -- fall through to clipboard copy
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="flex gap-3">
      <motion.button
        onClick={handleShare}
        className="px-5 py-2.5 rounded-lg bg-signal text-paper font-semibold text-sm"
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: "spring", stiffness: 420, damping: 24 }}
      >
        {copied ? "Link copied!" : "Share this profile"}
      </motion.button>
    </div>
  );
}
