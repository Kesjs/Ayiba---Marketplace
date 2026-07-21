'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Modal } from '@/components/ui/Modal'

interface QrScannerModalProps {
  isOpen: boolean
  onClose: () => void
  onScan: (decodedText: string) => void
}

export function QrScannerModal({ isOpen, onClose, onScan }: QrScannerModalProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const containerId = 'qr-reader-container'
  const [scannerError, setScannerError] = useState<string | null>(null)
  const hasScannedRef = useRef(false)

  useEffect(() => {
    if (!isOpen) return

    hasScannedRef.current = false
    setScannerError(null)

    const scanner = new Html5Qrcode(containerId)
    scannerRef.current = scanner

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          if (hasScannedRef.current) return
          hasScannedRef.current = true
          onScan(decodedText)
        },
        () => {
          // erreur de décodage par frame, normal et fréquent, on ignore
        }
      )
      .catch((err) => {
        console.error('Erreur démarrage caméra:', err)
        setScannerError("Impossible d'accéder à la caméra. Vérifie les permissions.")
      })

    return () => {
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => scannerRef.current?.clear())
          .catch(() => {
            // déjà arrêté, on ignore
          })
      }
    }
  }, [isOpen, onScan])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Scanner le QR code">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Vise le QR code affiché sur l'écran du livreur
        </p>
        {scannerError ? (
          <div className="p-4 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 text-center">
            {scannerError}
          </div>
        ) : (
          <div
            id={containerId}
            className="w-full aspect-square rounded-lg overflow-hidden bg-black"
          />
        )}
      </div>
    </Modal>
  )
}
