import { useState, useRef, useEffect, useCallback } from "react";
import { X, RotateCcw, RotateCw, ZoomIn, ZoomOut, Move, Check } from "lucide-react";

interface ThumbnailEditorModalProps {
  imageSrc: string;
  onConfirm: (processedDataUrl: string) => void;
  onClose: () => void;
}

export function ThumbnailEditorModal({
  imageSrc,
  onConfirm,
  onClose,
}: ThumbnailEditorModalProps) {
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0); // in degrees
  const [offsetX, setOffsetX] = useState<number>(0);
  const [offsetY, setOffsetY] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

  // Load image object
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Render canvas preview whenever parameters change
  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !imageLoaded) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fixed 16:9 canvas dimensions (640x360 for high DPI crispness)
    const targetWidth = 640;
    const targetHeight = 360;

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // Clear canvas
    ctx.clearRect(0, 0, targetWidth, targetHeight);

    // Save context transform state
    ctx.save();

    // Translate to canvas center
    ctx.translate(targetWidth / 2 + offsetX, targetHeight / 2 + offsetY);

    // Rotate
    ctx.rotate((rotation * Math.PI) / 180);

    // Scale
    ctx.scale(scale, scale);

    // Draw image centered
    const imgAspect = img.width / img.height;
    const targetAspect = targetWidth / targetHeight;

    let drawWidth = targetWidth;
    let drawHeight = targetHeight;

    if (imgAspect > targetAspect) {
      drawWidth = targetHeight * imgAspect;
    } else {
      drawHeight = targetWidth / imgAspect;
    }

    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

    // Restore context
    ctx.restore();
  }, [scale, rotation, offsetX, offsetY, imageLoaded]);

  useEffect(() => {
    drawPreview();
  }, [drawPreview]);

  const handleRotateLeft = () => setRotation((prev) => (prev - 90) % 360);
  const handleRotateRight = () => setRotation((prev) => (prev + 90) % 360);

  const handleReset = () => {
    setScale(1.0);
    setRotation(0);
    setOffsetX(0);
    setOffsetY(0);
  };

  const handleApply = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    onConfirm(dataUrl);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none">
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-brand-surface border border-brand-border rounded-2xl shadow-2xl p-6 font-sans text-brand-text space-y-5 animate-in zoom-in-95 duration-150 relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brand-border/40 pb-3">
          <div>
            <h3 className="font-semibold text-lg text-brand-text">
              Crop & Edit Lesson Thumbnail
            </h3>
            <p className="text-xs text-brand-secondary mt-0.5">
              Adjust scale, rotation, and position for a 16:9 thumbnail preview.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Close"
            className="p-1.5 rounded-lg text-brand-secondary hover:text-brand-text hover:bg-brand-text/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Canvas Preview Box */}
        <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black/80 border border-brand-border/60 flex items-center justify-center shadow-inner">
          <canvas
            ref={canvasRef}
            className="w-full h-full object-contain max-h-[300px]"
          />
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-brand-secondary">
              Loading image preview...
            </div>
          )}
          {/* 16:9 Crop Overlay Lines */}
          <div className="absolute inset-0 pointer-events-none border-2 border-brand-accent/40 rounded-xl" />
        </div>

        {/* Control Sliders & Buttons */}
        <div className="space-y-4 bg-brand-bg/50 border border-brand-border/40 p-4 rounded-xl text-xs">
          {/* Zoom / Scale Slider */}
          <div className="flex items-center gap-3">
            <ZoomOut className="w-4 h-4 text-brand-secondary shrink-0" />
            <span className="w-12 text-brand-secondary font-medium">Zoom</span>
            <input
              type="range"
              min="0.5"
              max="3.0"
              step="0.05"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="flex-1 accent-brand-accent cursor-pointer"
            />
            <ZoomIn className="w-4 h-4 text-brand-secondary shrink-0" />
            <span className="w-10 text-right font-mono text-brand-accent">
              {Math.round(scale * 100)}%
            </span>
          </div>

          {/* Rotate Slider & Quick Rotate Buttons */}
          <div className="flex items-center gap-3">
            <RotateCcw className="w-4 h-4 text-brand-secondary shrink-0" />
            <span className="w-12 text-brand-secondary font-medium">Rotate</span>
            <input
              type="range"
              min="-180"
              max="180"
              step="1"
              value={rotation}
              onChange={(e) => setRotation(parseInt(e.target.value, 10))}
              className="flex-1 accent-brand-accent cursor-pointer"
            />
            <span className="w-10 text-right font-mono text-brand-accent">
              {rotation}°
            </span>
            <div className="flex items-center gap-1 pl-2 border-l border-brand-border/40">
              <button
                type="button"
                onClick={handleRotateLeft}
                title="Rotate Left 90°"
                className="p-1 rounded bg-brand-surface hover:bg-brand-text/10 text-brand-secondary hover:text-brand-text transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleRotateRight}
                title="Rotate Right 90°"
                className="p-1 rounded bg-brand-surface hover:bg-brand-text/10 text-brand-secondary hover:text-brand-text transition-colors cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Offset Pan Sliders (X & Y) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Move className="w-3.5 h-3.5 text-brand-secondary shrink-0" />
              <span className="text-brand-secondary font-medium shrink-0">Pan X</span>
              <input
                type="range"
                min="-200"
                max="200"
                value={offsetX}
                onChange={(e) => setOffsetX(parseInt(e.target.value, 10))}
                className="w-full accent-brand-accent cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-2">
              <Move className="w-3.5 h-3.5 text-brand-secondary shrink-0" />
              <span className="text-brand-secondary font-medium shrink-0">Pan Y</span>
              <input
                type="range"
                min="-200"
                max="200"
                value={offsetY}
                onChange={(e) => setOffsetY(parseInt(e.target.value, 10))}
                className="w-full accent-brand-accent cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-brand-border/40">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 rounded-lg border border-brand-border/60 hover:bg-brand-text/5 text-brand-secondary hover:text-brand-text text-xs font-medium transition-colors cursor-pointer"
          >
            Reset Edits
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-brand-border/60 hover:bg-brand-text/5 text-brand-secondary hover:text-brand-text text-xs font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-accent text-brand-bg hover:bg-brand-accent-hover text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Apply Thumbnail</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
