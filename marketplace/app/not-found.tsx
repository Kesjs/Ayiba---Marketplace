'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Home, Search, MapPinOff, Compass } from 'lucide-react'
import { Navbar } from '@/components/ui/Navbar'
import { Footer } from '@/components/home/Footer'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-16 md:py-24">
        <div className="max-w-md w-full flex flex-col items-center text-center">
          {/* Illustration : livreur qui a raté sa route */}
          <div className="relative w-40 h-40 mb-8">
            {/* Anneau teal qui pulse, en écho au point de validation du logo */}
            <motion.div
              className="absolute inset-0 rounded-full bg-teal-50"
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Trajectoire pointillée qui se dessine en boucle */}
            <svg
              viewBox="0 0 160 160"
              className="absolute inset-0 w-full h-full"
              fill="none"
            >
              <motion.path
                d="M28 118 C 45 90, 55 130, 75 95 S 110 55, 132 40"
                stroke="#D85A30"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="1 12"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.4, ease: 'easeOut', delay: 0.2 }}
              />
            </svg>

            {/* Compas qui oscille doucement, comme s'il cherchait le nord */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{ rotate: [-8, 8, -8] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="w-20 h-20 rounded-2xl bg-white shadow-lg shadow-coral-400/10 border border-gray-100 flex items-center justify-center">
                <Compass size={34} className="text-coral-400" strokeWidth={1.5} />
              </div>
            </motion.div>

            {/* Repère perdu, en bas à droite */}
            <motion.div
              className="absolute -bottom-1 -right-1 w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <MapPinOff size={16} className="text-teal-600" />
            </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="text-[11px] font-bold text-coral-500 uppercase tracking-wide mb-3"
          >
            Erreur 404
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.4 }}
            className="text-2xl md:text-3xl font-bold text-gray-900 mb-3"
          >
            Cette page a pris un mauvais chemin
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.4 }}
            className="text-sm text-gray-500 mb-9 leading-relaxed"
          >
            La page que tu cherches n&rsquo;existe pas, a été déplacée, ou son
            adresse a changé. Pas d&rsquo;inquiétude, on te ramène.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.34, duration: 0.4 }}
            className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto"
          >
            <Button onClick={() => router.push('/')} className="w-full sm:w-auto">
              <Home size={16} />
              Retour à l&rsquo;accueil
            </Button>
            <Button
              variant="secondary"
              onClick={() => router.push('/')}
              className="w-full sm:w-auto"
            >
              <Search size={16} />
              Explorer les boutiques
            </Button>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
