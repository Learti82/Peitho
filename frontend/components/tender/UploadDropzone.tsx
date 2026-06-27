"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { clsx } from "clsx";
import { Upload, FileText, X, CheckCircle } from "lucide-react";

interface UploadDropzoneProps {
  onFileSelected: (file: File) => void;
  selectedFile?: File | null;
  disabled?: boolean;
}

const MAX_SIZE_MB = 50;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export function UploadDropzone({
  onFileSelected,
  selectedFile,
  disabled = false,
}: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function validateAndSelect(file: File) {
    setError(null);

    if (!file.type.includes("pdf") && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Vetëm skedarët PDF pranohen.");
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      setError(`Skedari është shumë i madh. Maksimumi: ${MAX_SIZE_MB}MB.`);
      return;
    }

    onFileSelected(file);
  }

  function handleDragEnter(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;
    validateAndSelect(files[0]);
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    validateAndSelect(files[0]);
    // Reset input so the same file can be re-selected
    e.target.value = "";
  }

  function handleClear() {
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
    // Pass an empty file to parent to signal removal
    // Parent manages state, so we just signal via a workaround
    window.dispatchEvent(new CustomEvent("dropzone:clear"));
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (selectedFile) {
    return (
      <div className="border-2 border-green-300 rounded-xl p-6 bg-green-50 flex items-center gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
          <CheckCircle className="h-6 w-6 text-green-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-green-800 truncate">{selectedFile.name}</p>
          <p className="text-sm text-green-600">{formatSize(selectedFile.size)} • PDF</p>
        </div>
        {!disabled && (
          <button
            onClick={handleClear}
            className="flex-shrink-0 p-2 rounded-lg text-green-500 hover:text-red-500 hover:bg-red-50 transition-colors"
            aria-label="Hiq skedarin"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) {
            inputRef.current?.click();
          }
        }}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={clsx(
          "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 select-none",
          isDragging
            ? "border-gold bg-gold/5 scale-[1.01]"
            : error
            ? "border-red-300 bg-red-50"
            : "border-gray-300 bg-gray-50 hover:border-primary/50 hover:bg-primary/5",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        aria-label="Zona e ngarkimit të skedarit PDF"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />

        <div className="flex flex-col items-center gap-4">
          <div
            className={clsx(
              "w-16 h-16 rounded-2xl flex items-center justify-center transition-colors",
              isDragging ? "bg-gold/20" : "bg-primary/10"
            )}
          >
            {isDragging ? (
              <FileText className="h-8 w-8 text-gold" />
            ) : (
              <Upload className="h-8 w-8 text-primary/60" />
            )}
          </div>

          <div className="space-y-1">
            <p className="font-semibold text-gray-700">
              {isDragging
                ? "Lëshojeni skedarin këtu"
                : "Tërhiqni dhe lëshoni skedarin PDF"}
            </p>
            <p className="text-sm text-gray-500">
              ose{" "}
              <span className="text-primary font-medium underline">
                klikoni për të zgjedhur
              </span>
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Vetëm PDF • Maksimumi {MAX_SIZE_MB}MB
            </p>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1.5">
          <X className="h-4 w-4" />
          {error}
        </p>
      )}
    </div>
  );
}
