"use client";

import { motion, type Variants } from "motion/react";
import type { ReactNode, ElementType } from "react";

const EASE = [0.16, 1, 0.3, 1] as const;

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

/** Fades + slides an element in, either once on page load or once when it scrolls into view. */
export function Reveal({
  children,
  className,
  delay = 0,
  mode = "scroll",
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  mode?: "scroll" | "load";
  as?: ElementType;
}) {
  const Comp = motion[as as "div"];
  const shared = {
    className,
    variants: fadeUpVariants,
    initial: "hidden",
    transition: { duration: 0.6, ease: EASE, delay },
  };
  if (mode === "load") {
    return (
      <Comp {...shared} animate="show">
        {children}
      </Comp>
    );
  }
  return (
    <Comp {...shared} whileInView="show" viewport={{ once: true, margin: "-60px" }}>
      {children}
    </Comp>
  );
}

const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.04 } },
};

/** Wraps a group of StaggerItem children so they reveal in sequence rather than all at once. */
export function Stagger({
  children,
  className,
  mode = "scroll",
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  mode?: "scroll" | "load";
  as?: ElementType;
}) {
  const Comp = motion[as as "div"];
  const shared = { className, variants: staggerContainer, initial: "hidden" };
  if (mode === "load") {
    return (
      <Comp {...shared} animate="show">
        {children}
      </Comp>
    );
  }
  return (
    <Comp {...shared} whileInView="show" viewport={{ once: true, margin: "-60px" }}>
      {children}
    </Comp>
  );
}

export function StaggerItem({
  children,
  className,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}) {
  const Comp = motion[as as "div"];
  return (
    <Comp className={className} variants={fadeUpVariants}>
      {children}
    </Comp>
  );
}

/** A StaggerItem that's also a link, with its own spring hover-lift and tap-down layered on top of the stagger-in. */
export function StaggerLinkItem({
  href,
  children,
  className,
  target,
  rel,
  lift = 4,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  target?: string;
  rel?: string;
  lift?: number;
}) {
  return (
    <motion.a
      href={href}
      target={target}
      rel={rel}
      className={className}
      variants={fadeUpVariants}
      whileHover={{ y: -lift }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 420, damping: 24 }}
    >
      {children}
    </motion.a>
  );
}

/** An <a> with a spring hover-lift and tap-down — swap in anywhere a CSS-only hover transform used to live. */
export function MotionLink({
  href,
  className,
  children,
  target,
  rel,
  lift = 3,
}: {
  href: string;
  className?: string;
  children: ReactNode;
  target?: string;
  rel?: string;
  lift?: number;
}) {
  return (
    <motion.a
      href={href}
      className={className}
      target={target}
      rel={rel}
      whileHover={{ y: -lift }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 420, damping: 24 }}
    >
      {children}
    </motion.a>
  );
}
