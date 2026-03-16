import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import './ImageSourcePickerModal.css';

/**
 * Bottom-sheet style modal letting the user choose Camera or Gallery.
 *
 * Props:
 *   open      – boolean
 *   onClose   – () => void
 *   onFile    – (file: File) => void   called with the selected file
 *   accept    – string (default: 'image/*')
 */
export default function ImageSourcePickerModal({ open, onClose, onFile, accept = 'image/*' }) {
  const { t } = useTranslation();
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);

  if (!open) return null;

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
    // Reset so same file can be re-selected
    e.target.value = '';
  };

  return (
    <div className="image-source-picker-overlay" onClick={onClose} role="presentation">
      <div
        className="image-source-picker-sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={t('imagePicker.chooseSource')}
      >
        <div className="image-source-picker-handle" />

        <button
          type="button"
          className="image-source-picker-option"
          onClick={() => cameraRef.current?.click()}
        >
          <CameraIcon />
          <span>{t('imagePicker.camera')}</span>
        </button>

        <button
          type="button"
          className="image-source-picker-option"
          onClick={() => galleryRef.current?.click()}
        >
          <GalleryIcon />
          <span>{t('imagePicker.gallery')}</span>
        </button>

        <button
          type="button"
          className="image-source-picker-cancel"
          onClick={onClose}
        >
          {t('common.cancel')}
        </button>

        {/* Hidden file inputs */}
        <input
          ref={cameraRef}
          type="file"
          accept={accept}
          capture="environment"
          onChange={handleFile}
          className="image-source-picker-hidden"
        />
        <input
          ref={galleryRef}
          type="file"
          accept={accept}
          onChange={handleFile}
          className="image-source-picker-hidden"
        />
      </div>
    </div>
  );
}

function CameraIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function GalleryIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}
