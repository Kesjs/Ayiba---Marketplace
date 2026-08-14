/**
 * Modal animation components
 * Lazy-loaded to reduce main bundle size
 */

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface ModalOverlayProps {
  onClick?: () => void
  className?: string
}

interface ModalDialogProps {
  children: ReactNode
  className?: string
}

export function ModalOverlay({ onClick, className = '' }: ModalOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={`fixed inset-0 z-50 bg-black/50 ${className}`}
    />
  )
}

export function ModalDialog({ children, className = '' }: ModalDialogProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={`relative z-[51] ${className}`}
    >
      {children}
    </motion.div>
  )
}
