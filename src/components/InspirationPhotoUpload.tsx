"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Camera, UploadCloud, X, Check, Loader2, AlertCircle } from "lucide-react";
import { OrderInspirationPhoto } from "@/lib/types";
import {
  uploadCakeInspirationPhoto,
  deleteCakeInspirationPhoto,
  fetchRemoteImageAsFile,
} from "@/lib/image-upload";

interface InspirationPhotoUploadProps {
  value: OrderInspirationPhoto | null;
  onChange: (photo: OrderInspirationPhoto | null) => void;
  title?: string;
  description?: string;
}

export default function InspirationPhotoUpload({
  value,
  onChange,
  title = "Predloha / inšpirácia (voliteľné)",
  description,
}: InspirationPhotoUploadProps) {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const preventWindowDrop = (e: DragEvent) => {
      e.preventDefault();
    };
    window.addEventListener("dragover", preventWindowDrop);
    window.addEventListener("drop", preventWindowDrop);
    return () => {
      window.removeEventListener("dragover", preventWindowDrop);
      window.removeEventListener("drop", preventWindowDrop);
    };
  }, []);

  const processAndUploadFile = useCallback(
    async (file: File) => {
      // Basic check
      if (!file.type.startsWith("image/") && !file.name.match(/\.(heic|heif|jpg|jpeg|png|webp|avif)$/i)) {
        setError("Podporované sú obrázky (JPG, PNG, WEBP, HEIC).");
        return;
      }
      if (file.size > 25 * 1024 * 1024) {
        setError("Súbor je príliš veľký (max. 25 MB).");
        return;
      }

      setError(null);
      setIsUploading(true);

      try {
        const result = await uploadCakeInspirationPhoto(file);
        onChange(result);
      } catch (err) {
        console.error("Upload error:", err);
        setError("Nepodarilo sa nahrať obrázok. Skúste znova.");
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [onChange]
  );

  const processUrl = useCallback(
    async (rawUrl: string) => {
      let url = rawUrl.trim();
      if (!url) return;

      // Detect and extract real image URL from Google Images redirect (imgurl=...)
      try {
        if (url.includes("google.") && url.includes("imgurl=")) {
          const parsed = new URL(url);
          const imgurl = parsed.searchParams.get("imgurl");
          if (imgurl) {
            url = decodeURIComponent(imgurl);
          }
        }
      } catch {
        // use rawUrl
      }

      setError(null);
      setIsUploading(true);

      try {
        const file = await fetchRemoteImageAsFile(url);
        const result = await uploadCakeInspirationPhoto(file);
        onChange(result);
      } catch (err) {
        console.error("URL image error:", err);
        setError("Nepodarilo sa stiahnuť obrázok z odkazu. Skúste obrázok uložiť a nahrať zo súboru.");
      } finally {
        setIsUploading(false);
      }
    },
    [onChange]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processAndUploadFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only deactivate if leaving the container
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (isUploading) return;

    // 1. Dropped regular file from desktop/folder
    const dtFiles = e.dataTransfer.files;
    if (dtFiles && dtFiles.length > 0) {
      processAndUploadFile(dtFiles[0]);
      return;
    }

    // 2. Check items for files
    const items = e.dataTransfer.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].kind === "file") {
          const f = items[i].getAsFile();
          if (f) {
            processAndUploadFile(f);
            return;
          }
        }
      }
    }

    // 3. Dropped image from Google Images / webpage (HTML contains <img src="..."> or imgurl=...)
    const html = e.dataTransfer.getData("text/html");
    if (html) {
      const imgMatch = html.match(/<img[^>]+(?:src|data-src)=["']([^"']+)["']/i);
      if (imgMatch && imgMatch[1]) {
        processUrl(imgMatch[1]);
        return;
      }
      const imgurlMatch = html.match(/imgurl=([^&"']+)/i);
      if (imgurlMatch && imgurlMatch[1]) {
        processUrl(decodeURIComponent(imgurlMatch[1]));
        return;
      }
    }

    // 4. Dropped URI / URL
    const uriList = e.dataTransfer.getData("text/uri-list");
    if (uriList) {
      const firstLine = uriList.split("\n")[0].trim();
      if (firstLine.startsWith("http://") || firstLine.startsWith("https://") || firstLine.startsWith("data:")) {
        processUrl(firstLine);
        return;
      }
    }

    // 5. Dropped plain text URL
    const plainText = e.dataTransfer.getData("text/plain");
    if (plainText) {
      const trimmed = plainText.trim();
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:")) {
        processUrl(trimmed);
        return;
      }
    }
  };

  // Support paste (Cmd+V / Ctrl+V)
  const handlePaste = useCallback(
    (e: React.ClipboardEvent | ClipboardEvent) => {
      if (isUploading) return;
      const clipboard = (e as ClipboardEvent).clipboardData;
      if (!clipboard) return;

      // 1. Image file in clipboard
      const files = clipboard.files;
      if (files && files.length > 0) {
        processAndUploadFile(files[0]);
        return;
      }

      // 2. URL string in clipboard
      const text = clipboard.getData("text");
      if (text && (text.startsWith("http://") || text.startsWith("https://") || text.startsWith("data:image/"))) {
        processUrl(text.trim());
      }
    },
    [isUploading, processAndUploadFile, processUrl]
  );

  const handleRemove = () => {
    if (value?.storagePath) {
      deleteCakeInspirationPhoto(value.storagePath).catch(() => {});
    }
    onChange(null);
    setError(null);
  };

  return (
    <div className="space-y-1.5" onPaste={handlePaste}>
      {/* Minimal Header */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-[#261B24] flex items-center gap-1.5">
          <Camera className="w-3.5 h-3.5 text-[#a62891]" />
          <span>{title}</span>
        </label>
        {value && (
          <span className="text-[11px] text-[#2e7d32] font-semibold flex items-center gap-1">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>Nahrané</span>
          </span>
        )}
      </div>

      {description && (
        <p className="text-xs text-[#261B24]/70">{description}</p>
      )}

      {/* Hidden native input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.heic,.heif"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Active Photo State */}
      {value ? (
        <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#ECD9E8] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-white border border-[#DFD8CD] shrink-0">
              <img
                src={value.url}
                alt="Predloha"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#261B24] truncate">
                {value.fileName || "Predloha torty"}
              </p>
              <p className="text-[10px] text-[#a62891] font-mono">
                {value.sizeBytes ? `${Math.round(value.sizeBytes / 1024)} KB` : "Optimalizované"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1 text-xs text-[#261B24] hover:text-[#a62891] bg-white border border-[#DFD8CD] rounded-md transition-colors cursor-pointer"
            >
              Zmeniť
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="p-1 text-[#7A2E2E] hover:bg-[#FBF2F2] rounded-md transition-colors cursor-pointer"
              title="Zmazať"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Empty / Drop State */
        <div
          ref={dropZoneRef}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-1.5 ${
            isDragOver
              ? "border-[#a62891] bg-[#FAF1F8] scale-[1.01]"
              : isUploading
              ? "border-[#a62891]/40 bg-[#FAF1F8]/50 cursor-wait"
              : "border-[#DFD8CD] bg-white hover:bg-[#FAF8F5] hover:border-[#a62891]/50"
          }`}
        >
          {isUploading ? (
            <div className="flex items-center gap-2 py-1 text-xs font-medium text-[#a62891]">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Spracovávam fotku...</span>
            </div>
          ) : isDragOver ? (
            <div className="flex items-center gap-2 py-1 text-xs font-semibold text-[#a62891]">
              <UploadCloud className="w-4 h-4 stroke-[2]" />
              <span>Pusťte obrázok sem</span>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 text-xs text-[#261B24]/80">
              <UploadCloud className="w-4 h-4 text-[#a62891] shrink-0" />
              <span>
                <strong className="font-semibold text-[#261B24]">Presuňte sem fotku</strong> (aj z Google Obrázkov) alebo kliknite
              </span>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-[#7A2E2E] mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
