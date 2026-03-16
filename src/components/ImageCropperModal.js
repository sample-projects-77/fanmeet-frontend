import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { useTranslation } from 'react-i18next';
import { createCroppedImage } from '../utils/imageCropUtils';
import './ImageCropperModal.css';

/**
 * Aspect-ratio presets matching the Flutter cropper.
 *   – Square  (1:1)
 *   – 4:3
 *   – Free    (no aspect lock)
 */
const ASPECT_PRESETS = [
  { key: 'square', label: 'imageCropper.square', value: 1 },
  { key: '4:3',    label: 'imageCropper.fourThree', value: 4 / 3 },
  { key: 'free',   label: 'imageCropper.free', value: undefined },
];

/**
 * Full-screen dark cropper modal.
 *
 * Props:
 *   open            – boolean
 *   imageSrc        – blob/data URL to crop
 *   initialAspect   – starting aspect ratio key ('square' | '4:3' | 'free'), default 'square'
 *   onCropDone      – (croppedFile: File) => void
 *   onClose         – () => void
 *   fileName        – output file name (default: 'cropped.jpg')
 */
export default function ImageCropperModal({
  open,
  imageSrc,
  initialAspect = 'square',
  onCropDone,
  onClose,
  fileName = 'cropped.jpg',
}) {
  const { t } = useTranslation();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [processing, setProcessing] = useState(false);

  const startPreset = ASPECT_PRESETS.find((p) => p.key === initialAspect) || ASPECT_PRESETS[0];
  const [activePreset, setActivePreset] = useState(startPreset.key);
  const currentAspect = ASPECT_PRESETS.find((p) => p.key === activePreset)?.value;

  const onCropComplete = useCallback((_area, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels || !imageSrc) return;
    setProcessing(true);
    try {
      const file = await createCroppedImage(imageSrc, croppedAreaPixels, fileName);
      onCropDone(file);
    } catch {
      // Silently fail – user can retry
    } finally {
      setProcessing(false);
    }
  };

  if (!open || !imageSrc) return null;

  return (
    <div className="image-cropper-overlay">
      <div className="image-cropper-modal">
        {/* Header */}
        <div className="image-cropper-header">
          <button type="button" className="image-cropper-cancel" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <span className="image-cropper-title">{t('imageCropper.title')}</span>
          <button
            type="button"
            className="image-cropper-done"
            onClick={handleConfirm}
            disabled={processing}
          >
            {processing ? '…' : t('imageCropper.done')}
          </button>
        </div>

        {/* Crop area */}
        <div className="image-cropper-area">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={currentAspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            showGrid
            style={{
              containerStyle: { background: '#0f0f0f' },
              cropAreaStyle: { border: '2px solid rgba(244,192,70,0.7)' },
            }}
          />
        </div>

        {/* Aspect ratio presets */}
        <div className="image-cropper-presets">
          {ASPECT_PRESETS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={`image-cropper-preset ${activePreset === key ? 'image-cropper-preset--active' : ''}`}
              onClick={() => setActivePreset(key)}
            >
              {t(label)}
            </button>
          ))}
        </div>

        {/* Zoom slider */}
        <div className="image-cropper-zoom">
          <ZoomOutIcon />
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="image-cropper-zoom-slider"
            aria-label="Zoom"
          />
          <ZoomInIcon />
        </div>
      </div>
    </div>
  );
}

function ZoomOutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

function ZoomInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}
