/**
 * Tab/step transition animation component
 * Lazy-loaded to reduce main bundle size
 */

import { motion, AnimatePresence } from 'framer-motion'
import type { ReactNode } from 'react'

interface TabTransitionProps {
  children: ReactNode
  key: string | number
  className?: string
  direction?: 'forward' | 'backward'
}

const slideVariants = {
  enter: (direction: 'forward' | 'backward') => ({
    x: direction === 'forward' ? 1000 : -1000,
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: 'forward' | 'backward') => ({
    zIndex: 0,
    x: direction === 'forward' ? -1000 : 1000,
    opacity: 0,
  }),
}

export function TabTransition({
  children,
  key: tabKey,
  className = '',
  direction = 'forward',
}: TabTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={tabKey}
        custom={direction}
        variants={slideVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{
          x: { type: 'spring', stiffness: 300, damping: 30 },
          opacity: { duration: 0.2 },
        }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
