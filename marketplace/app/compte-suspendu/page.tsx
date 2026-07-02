'use client'

import { useRouter } from 'next/navigation'
import LogoAyiba from '@/components/ui/LogoAyiba'

export default function CompteSuspenduPage() {
  const router = useRouter()

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 p-4">
        <LogoAyiba />
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="ti ti-alert-circle text-3xl text-red-400" />
          </div>
          
          <h1 className="text-xl font-medium text-gray-900 mb-3">
            Compte suspendu
          </h1>
          
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            Votre compte a été suspendu temporairement. Pour plus d'informations, 
            veuillez contacter notre support par email à support@ayiba.bj
          </p>

          <button
            onClick={() => router.push('/')}
            className="w-full py-3 rounded-lg bg-coral-400 text-white text-sm font-medium hover:bg-coral-600 transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  )
}
