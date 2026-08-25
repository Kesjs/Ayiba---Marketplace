"use client";

import { useRef, useState, useCallback, useEffect, KeyboardEvent, ClipboardEvent } from "react";

interface OTPInputProps {
  length?: number;
  onComplete: (otp: string) => void;
  loading?: boolean;
  error?: boolean;
  onReset?: () => void;
}

export default function OTPInput({
  length = 6,
  onComplete,
  loading = false,
  error = false,
  onReset,
}: OTPInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(""));
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Reset cases when error clears externally
  useEffect(() => {
    if (!error) return;
  }, [error]);

  const focusAt = (index: number) => {
    inputsRef.current[index]?.focus();
  };

  const handleChange = useCallback(
    (index: number, raw: string) => {
      // Keep only the last digit entered
      const digit = raw.replace(/\D/g, "").slice(-1);
      const next = [...values];
      next[index] = digit;
      setValues(next);

      if (digit && index < length - 1) {
        focusAt(index + 1);
      }

      const complete = next.join("");
      if (complete.length === length && !next.includes("")) {
        onComplete(complete);
      }
    },
    [values, length, onComplete]
  );

  const handleKeyDown = useCallback(
    (index: number, e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace") {
        e.preventDefault();
        if (values[index]) {
          const next = [...values];
          next[index] = "";
          setValues(next);
          onReset?.();
        } else if (index > 0) {
          const next = [...values];
          next[index - 1] = "";
          setValues(next);
          focusAt(index - 1);
          onReset?.();
        }
      } else if (e.key === "ArrowLeft" && index > 0) {
        e.preventDefault();
        focusAt(index - 1);
      } else if (e.key === "ArrowRight" && index < length - 1) {
        e.preventDefault();
        focusAt(index + 1);
      }
    },
    [values, length, onReset]
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
      if (!pasted) return;

      const next = [...values];
      for (let i = 0; i < pasted.length; i++) {
        next[i] = pasted[i];
      }
      setValues(next);

      const nextFocus = Math.min(pasted.length, length - 1);
      focusAt(nextFocus);

      if (pasted.length === length) {
        onComplete(pasted);
      }
    },
    [values, length, onComplete]
  );

  const handleFocus = (index: number) => {
    // Select content on focus so typing replaces existing digit
    inputsRef.current[index]?.select();
  };

  return (
    <div className="flex gap-2 justify-center" role="group" aria-label="Code de vérification">
      {values.map((val, i) => (
        <input
          key={i}
          ref={(el) => { inputsRef.current[i] = el; }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={val}
          disabled={loading}
          aria-label={`Chiffre ${i + 1}`}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={() => handleFocus(i)}
          className={[
            "w-11 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all duration-200",
            "focus:outline-none focus:ring-0",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            loading
              ? "border-gray-200 bg-gray-50 text-gray-400"
              : error
              ? "border-red-300 bg-red-50 text-red-600"
              : val
              ? "border-coral-400 bg-coral-50 text-gray-900"
              : "border-gray-200 bg-white text-gray-900 focus:border-coral-400 focus:bg-coral-50/30",
          ].join(" ")}
        />
      ))}
    </div>
  );
}
