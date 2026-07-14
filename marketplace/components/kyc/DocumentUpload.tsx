"use client";

import { useEffect, useRef, useState } from "react";
import { UploadCloud, Loader2, CheckCircle2, X, FileImage } from "lucide-react";

interface DocumentUploadProps {
  label: string;
  value: File | null;
  onChange: (file: File | null) => void;
  existingFileLabel?: string | null; // ex: "Document déjà enregistré" si présent en base
  maxSizeMb?: number;
}

type UploadState = "idle" | "processing" | "done";

export function DocumentUpload({
  label,
  value,
  onChange,
  existingFileLabel = null,
  maxSizeMb = 5,
}: DocumentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<UploadState>(
    value || existingFileLabel ? "done" : "idle"
  );
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(value?.name ?? null);

  // Anime la barre de progression : c'est une vérification locale (format/taille),
  // pas un vrai upload réseau — celui-ci n'a lieu qu'à la soumission finale du formulaire.
  useEffect(() => {
    if (status !== "processing") return;
    const start = Date.now();
    const duration = 900;
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(interval);
        setStatus("done");
      }
    }, 40);
    return () => clearInterval(interval);
  }, [status]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Le fichier doit être une image");
      return;
    }
    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`L'image ne doit pas dépasser ${maxSizeMb} Mo`);
      return;
    }

    setFileName(file.name);
    setProgress(0);
    onChange(file);
    setStatus("processing");
  };

  const handleRemove = () => {
    setFileName(null);
    setError(null);
    onChange(null);
    setStatus("idle");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {status === "idle" && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-coral-300 transition-colors py-10 px-4"
        >
          <div className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center">
            <UploadCloud size={20} className="text-gray-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700">{label}</p>
            <p className="text-xs text-gray-400 mt-0.5">PNG, JPG jusqu'à {maxSizeMb} Mo</p>
          </div>
        </button>
      )}

      {status === "processing" && (
        <div className="w-full rounded-2xl border border-coral-200 bg-coral-50/50 py-6 px-5 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white border border-coral-200 flex items-center justify-center shrink-0">
              <Loader2 size={16} className="text-coral-500 animate-spin" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-800 truncate">{fileName}</p>
              <p className="text-xs text-coral-500">Vérification en cours...</p>
            </div>
            <span className="text-xs font-bold text-coral-500 shrink-0">{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-coral-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-coral-500 rounded-full transition-all duration-75"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {status === "done" && (
        <div className="w-full rounded-2xl border border-teal-200 bg-teal-50/50 py-5 px-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white border border-teal-200 flex items-center justify-center shrink-0">
            <FileImage size={16} className="text-teal-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-800 truncate">
              {fileName || existingFileLabel || "Document enregistré"}
            </p>
            <p className="text-xs text-teal-600 flex items-center gap-1">
              <CheckCircle2 size={12} />
              {fileName ? "Prêt à envoyer" : "Déjà enregistré"}
            </p>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-white hover:text-gray-600 transition-colors shrink-0"
            aria-label="Retirer le document"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error && <p className="text-xs text-red-500 mt-2 text-center">{error}</p>}
    </div>
  );
}
