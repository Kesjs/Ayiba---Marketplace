/**
 * Framer Motion animations library
 * Code-split animations to reduce bundle size
 * 
 * Usage:
 * import dynamic from 'next/dynamic';
 * const ScrollFadeIn = dynamic(() => import('@/components/animations/ScrollFadeIn').then(m => ({ default: m.ScrollFadeIn })));
 */

export { ScrollFadeIn } from './ScrollFadeIn'
export { StaggerContainer, StaggerItem } from './StaggerContainer'
export { ModalOverlay, ModalDialog } from './ModalAnimations'
export { TabTransition } from './TabTransition'
export { expandVariants, collapseVariants } from './variants'
