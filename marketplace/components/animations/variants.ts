/**
 * Framer Motion variants - reusable animation definitions
 * These are extracted from components to be code-split
 */

export const expandVariants = {
  collapsed: { height: 0, opacity: 0 },
  expanded: { height: 'auto', opacity: 1 },
}

export const collapseVariants = {
  collapsed: { height: 0, opacity: 0, overflow: 'hidden' },
  expanded: { height: 'auto', opacity: 1, overflow: 'visible' },
}

export const fadeInVariant = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

export const slideInVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export const slideInFromLeftVariant = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0 },
}

export const slideInFromRightVariant = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0 },
}

export const scaleInVariant = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: { opacity: 1, scale: 1 },
}

export const sectionVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

export const lightStagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

export const lightItem = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
}

export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

export const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export const modalBackdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
}

export const modalDialogVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 12, scale: 0.98 },
}

export const slideUpVariants = {
  hidden: { y: 80, opacity: 0 },
  visible: { y: 0, opacity: 1 },
  exit: { y: 80, opacity: 0 },
}

export const slideDownVariants = {
  hidden: { y: -40, opacity: 0, scale: 0.98 },
  visible: { y: 0, opacity: 1, scale: 1 },
  exit: { y: -40, opacity: 0, scale: 0.98 },
}
