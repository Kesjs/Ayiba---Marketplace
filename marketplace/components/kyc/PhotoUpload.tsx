"use client";

import { useRef, useState } from "react";
import { Camera, X, Check } from "lucide-react";

interface PhotoUploadProps {
  label: string;
  helperText?: string;
  value: File | null;
  onChange: (file: File | null) => void;
  aspect?: "square" | "wide";
  maxSizeMb?: number;
}

export function PhotoUpload({
  label,
  helperText,
  value,
  onChange,
  aspect = "square",
  maxSizeMb = 5,
}: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    onChange(file);
  };

  const handleRemove = () => {
    setPreview(null);
    onChange(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const aspectClass = aspect === "square" ? "aspect-square max-w-[180px]" : "aspect-video w-full";

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      {helperText && <p className="text-xs text-gray-400 mb-3">{helperText}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {preview ? (
        <div className={`relative ${aspectClass} mx-auto rounded-2xl overflow-hidden border border-teal-200 shadow-sm group`}>
          <img src={preview} alt={label} className="w-full h-full object-cover" />

          {/* Badge de confirmation, cohérent avec l'état "done" de DocumentUpload */}
          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1">
            <Check size={11} className="text-teal-600" />
            <span className="text-[10px] font-semibold text-teal-700">Ajoutée</span>
          </div>

          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 w-7 h-7 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors"
            aria-label="Retirer la photo"
          >
            <X size={14} />
          </button>

          {/* Overlay "remplacer" au survol/tap, pour ne pas avoir à passer par le bouton retirer */}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 opacity-0 group-hover:opacity-100 transition-all"
          >
            <span className="text-xs font-semibold text-white bg-black/50 rounded-full px-3 py-1.5">
              Remplacer
            </span>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`${aspectClass} mx-auto flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-coral-300 transition-colors`}
        >
          <div className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center">
            <Camera size={20} className="text-gray-400" />
          </div>
          <div className="text-center px-2">
            <p className="text-sm font-semibold text-gray-700">Ajouter une photo</p>
            <p className="text-xs text-gray-400 mt-0.5">JPG, PNG jusqu'à {maxSizeMb} Mo</p>
          </div>
        </button>
      )}

      {error && <p className="text-xs text-red-500 mt-2 text-center">{error}</p>}
    </div>
  );
}
