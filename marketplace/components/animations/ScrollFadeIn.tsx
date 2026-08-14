/**
 * Scroll-triggered fade-in animation component
 * Lazy-loaded to reduce main bundle size
 */

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface ScrollFadeInProps {
  children: ReactNode
  className?: string
  delay?: number
}

export function ScrollFadeIn({ children, className = '', delay = 0 }: ScrollFadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
