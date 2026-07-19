"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ScanLine, ShieldAlert, CheckCircle2, Camera, KeyRound } from "lucide-react";
import { useConfirmationLivraison } from "@/lib/hooks/useConfirmationLivraison";

interface ConfirmationLivraisonModalProps {
  commandeId: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirmee?: () => void;
}

// Scanner QR natif (BarcodeDetector) — pas de dépendance npm supplémentaire.
// Support : Chrome/Edge desktop et Android récents. Sur les navigateurs sans
// BarcodeDetector (ex. Safari iOS à ce jour), on affiche directement le
// fallback "code de secours" avec une explication, plutôt qu'un scanner cassé.
function useBarcodeDetectorDisponible() {
  const [disponible, setDisponible] = useState<boolean | null>(null);
  useEffect(() => {
    setDisponible(typeof window !== "undefined" && "BarcodeDetector" in window);
  }, []);
  return disponible;
}

export function ConfirmationLivraisonModal({
  commandeId,
  isOpen,
  onClose,
  onConfirmee,
}: ConfirmationLivraisonModalProps) {
  const { etat, soumettre, reinitialiser } = useConfirmationLivraison(commandeId);
  const barcodeDetectorOk = useBarcodeDetectorDisponible();

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [scanActif, setScanActif] = useState(false);
  const [code6Saisi, setCode6Saisi] = useState("");

  useEffect(() => {
    if (!isOpen) {
      reinitialiser();
      setCode6Saisi("");
      arreterCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (etat.etape === "confirmee") {
      arreterCamera();
      onConfirmee?.();
    }
  }, [etat.etape, onConfirmee]);

  const arreterCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanActif(false);
  };

  const demarrerScan = async () => {
    if (!barcodeDetectorOk) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanActif(true);

      // @ts-expect-error BarcodeDetector n'est pas encore dans les types TS standards
      const detector = new window.BarcodeDetector({ formats: ["qr_code"] });

      const boucle = async () => {
        if (!videoRef.current || !streamRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes.length > 0) {
            const valeur = codes[0].rawValue as string;
            arreterCamera();
            await soumettre("qr", valeur);
            return;
          }
        } catch {
          // frame illisible, on retente au prochain tick
        }
        if (streamRef.current) requestAnimationFrame(boucle);
      };
      requestAnimationFrame(boucle);
    } catch (err) {
      console.error("[ConfirmationLivraisonModal] accès caméra refusé:", err);
    }
  };

  const soumettreCode6 = async () => {
    if (code6Saisi.length !== 6) return;
    await soumettre("code6", code6Saisi);
    setCode6Saisi("");
  };

  const avertirCode6TropTot = () => {
    window.alert(
      "Le code de secours ne peut être utilisé qu'après 3 échecs de scan QR, pour des raisons de sécurité. Réessaie le scan."
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          className="bg-white w-full sm:max-w-sm sm:rounded-3xl rounded-t-3xl p-6 relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={onClose} className="absolute top-5 right-5 text-gray-400" aria-label="Fermer">
            <X size={20} />
          </button>

          <h2 className="text-lg font-bold text-gray-900 mb-1">Confirmer la réception</h2>
          <p className="text-sm text-gray-500 mb-6">
            Scanne le QR affiché sur le téléphone du livreur.
          </p>

          {etat.etape === "confirmee" && (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center">
                <CheckCircle2 size={32} className="text-teal-500" />
              </div>
              <p className="font-bold text-gray-900">Livraison confirmée</p>
              <p className="text-sm text-gray-500 text-center">
                Le paiement du vendeur et du livreur va être débloqué.
              </p>
            </div>
          )}

          {etat.etape === "litige" && (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center">
                <ShieldAlert size={32} className="text-orange-500" />
              </div>
              <p className="font-bold text-gray-900 text-center">En attente de vérification</p>
              <p className="text-sm text-gray-500 text-center leading-relaxed">
                Les tentatives de confirmation sont épuisées. Ton colis reste à toi — le paiement,
                lui, reste bloqué jusqu'à ce que notre équipe te contacte pour vérifier la livraison.
              </p>
            </div>
          )}

          {etat.etape === "qr" && (
            <div className="flex flex-col items-center gap-4">
              {barcodeDetectorOk === false ? (
                <div className="w-full p-4 bg-amber-50 border border-amber-100 rounded-2xl text-sm text-amber-700">
                  Le scan QR n'est pas disponible sur ce navigateur. Demande au livreur le code de
                  secours à 6 chiffres affiché sous son QR.
                </div>
              ) : (
                <>
                  <div className="w-full aspect-square bg-gray-900 rounded-2xl overflow-hidden relative">
                    <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                    {!scanActif && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <button
                          onClick={demarrerScan}
                          className="flex flex-col items-center gap-2 text-white"
                        >
                          <Camera size={32} />
                          <span className="text-sm font-bold">Activer la caméra</span>
                        </button>
                      </div>
                    )}
                    {scanActif && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <ScanLine size={40} className="text-teal-400 animate-pulse" />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={avertirCode6TropTot}
                    className="text-xs font-semibold text-gray-400 hover:text-gray-600"
                  >
                    Le code de secours est déjà affiché ? Saisis-le manuellement
                  </button>
                </>
              )}

              {etat.erreur && <p className="text-xs text-red-500 text-center">{etat.erreur}</p>}
            </div>
          )}

          {etat.etape === "code6" && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center">
                <KeyRound size={24} className="text-gray-500" />
              </div>
              <p className="text-sm text-gray-600 text-center">
                Saisis le code de secours à 6 chiffres affiché sous le QR du livreur.
              </p>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code6Saisi}
                onChange={(e) => setCode6Saisi(e.target.value.replace(/\D/g, ""))}
                className="w-full text-center text-2xl font-bold tracking-[0.4em] border border-gray-200 rounded-xl h-14 focus:outline-none focus:border-teal-400"
                placeholder="······"
              />
              {etat.erreur && <p className="text-xs text-red-500 text-center">{etat.erreur}</p>}
              {etat.attendreSecondes ? (
                <p className="text-xs text-amber-600 text-center">
                  Réessaie dans {etat.attendreSecondes}s.
                </p>
              ) : null}
              <button
                onClick={soumettreCode6}
                disabled={code6Saisi.length !== 6 || etat.enCours || !!etat.attendreSecondes}
                className="w-full h-12 bg-gray-900 text-white font-bold rounded-xl disabled:opacity-40"
              >
                {etat.enCours ? "Vérification..." : "Confirmer"}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
