import { useRef, useEffect, useState } from "react";
import { useBoardSettings } from "../hooks/useBoardSettings";

// =========================================================================
// 1. CONFIGURATION
// =========================================================================

const MOVE_DURATION = 350; 
const TRAIL_FADE_MS = 350; 
const TRAIL_LENGTH_RATIO = 1.95; 

const PIECE_THICKNESS: Record<string, number> = {
  Pawn: 0.3, 
  Knight: 0.4, 
  Bishop: 0.35, 
  Rook: 0.4, 
  Queen: 0.65, 
  King: 0.65,
};


// =========================================================================
// 2. MATH HELPERS
// =========================================================================

const getPieceName = (code: string): string => {
  const map: Record<string, string> = { P: 'Pawn', N: 'Knight', B: 'Bishop', R: 'Rook', Q: 'Queen', K: 'King' };
  const char = code.length === 2 ? code.charAt(1) : code.charAt(0);
  return map[char] || 'Pawn';
};

const getSweptStyle = (
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  squareSize: number,
  pieceType: string
) => {
  const dx = endX - startX;
  const dy = endY - startY;
  const angle = Math.atan2(dy, dx);
  
  const name = getPieceName(pieceType);
  const ratio = PIECE_THICKNESS[name] || 0.4;
  const baseThickness = squareSize * ratio;

  const projection = Math.abs(Math.cos(angle)) + Math.abs(Math.sin(angle));
  const length = Math.sqrt(dx*dx + dy*dy);
  
  return { 
    thickness: baseThickness * projection,
    dirX: length ? dx/length : 0, 
    dirY: length ? dy/length : 0 
  };
};

// =========================================================================
// 3. ANIMATION COMPONENT
// =========================================================================

interface ActiveMove {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  fromSq: string;
  toSq: string;
  pieceType: string;
  isCapture: boolean;
  capturedPieceType: string | null;
  targetPieceEl: HTMLElement | null;
}

interface ChessAnimationLayerProps {
  activeMove: ActiveMove | null;
  squareSize?: number;
  onLand?: () => void;
  onComplete?: () => void;
}

export default function ChessAnimationLayer({ 
  activeMove, 
  squareSize = 50, 
  onLand,
  onComplete 
}: ChessAnimationLayerProps) {

  const { pieceSet } = useBoardSettings();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [ghost, setGhost] = useState<{
    x: number;
    y: number;
    type: string;
    scale: number;
    opacity: number;
  } | null>(null);

  const [capturedGhost, setCapturedGhost] = useState<{
    x: number;
    y: number;
    type: string;
    scale: number;
    opacity: number;
  } | null>(null);
  
  const anim = useRef<{ start: number | null; isPlaying: boolean }>({ start: null, isPlaying: false });

  useEffect(() => {
    if (!activeMove) {
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, 1000, 1000);
      setGhost(null);
      setCapturedGhost(null);
      return;
    }

    anim.current = { start: null, isPlaying: true };
    const { startX, startY, targetX, targetY, pieceType, isCapture, capturedPieceType } = activeMove;
    const TRAIL_LEN = squareSize * TRAIL_LENGTH_RATIO;
    let landed = false;

    let reqId: number;
    const ctx = canvasRef.current?.getContext("2d");

    const render = (now: number) => {
      if (!anim.current.start) anim.current.start = now;
      const elapsed = now - anim.current.start;
      
      const moveProgress = Math.min(elapsed / MOVE_DURATION, 1);
      const isFading = moveProgress >= 1;
      
      const ease = moveProgress < 0.5 
        ? 2 * moveProgress * moveProgress 
        : 1 - Math.pow(-2 * moveProgress + 2, 2) / 2;

      let cx = startX + (targetX - startX) * ease;
      let cy = startY + (targetY - startY) * ease;
      
      if (isFading) { cx = targetX; cy = targetY; }

      let ghostScale = 1.0;
      let ghostOpacity = 1.0;
      
      let capturedOpacity = 0.0;
      let capturedScale = 1.0;

      if (!isFading) {
        // Smooth lift scaling: 1.0 -> 1.1 (first 15%), stays 1.1, lands smoothly to 1.0 (last 15%)
        if (moveProgress < 0.15) {
          const t = moveProgress / 0.15;
          const easeT = 1 - Math.pow(1 - t, 3); // cubic ease-out
          ghostScale = 1.0 + 0.1 * easeT;
        } else if (moveProgress > 0.85) {
          const t = (1 - moveProgress) / 0.15;
          const easeT = 1 - Math.pow(1 - t, 3); // cubic ease-out
          ghostScale = 1.0 + 0.1 * easeT;
        } else {
          ghostScale = 1.1;
        }
      } else {
        // Ghost has landed at the target square
        if (!landed) {
          landed = true;
          if (onLand) onLand();
        }
        
        // Dissolve capture & fade ghost over a 100ms window
        const fadeElapsed = elapsed - MOVE_DURATION;
        const fadeProgress = Math.min(fadeElapsed / 100, 1);
        
        ghostOpacity = 1.0 - fadeProgress;
        ghostScale = 1.0 + 0.1 * (1.0 - fadeProgress); // smoothly returns 1.1 -> 1.0
        
        if (isCapture && capturedPieceType) {
          capturedOpacity = 1.0 - fadeProgress;
          capturedScale = 1.0 + 0.1 * fadeProgress; // scale 100% -> 110%
        }
      }

      setGhost({ x: cx, y: cy, type: pieceType, scale: ghostScale, opacity: ghostOpacity });

      if (isCapture && capturedPieceType && isFading) {
        setCapturedGhost({
          x: targetX,
          y: targetY,
          type: capturedPieceType,
          scale: capturedScale,
          opacity: capturedOpacity
        });
      } else {
        setCapturedGhost(null);
      }

      // Draw Canvas Trail
      const dpr = window.devicePixelRatio || 1;
      if (canvasRef.current && ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width/dpr, canvasRef.current.height/dpr);
      }

      const trailOpacity = isFading ? 1.0 - Math.min((elapsed - MOVE_DURATION) / TRAIL_FADE_MS, 1) : 1.0;

      if (trailOpacity > 0 && ctx) {
        const { thickness, dirX, dirY } = getSweptStyle(startX, startY, targetX, targetY, squareSize, pieceType);
        
        const hx = cx + squareSize/2; 
        const hy = cy + squareSize/2;
        let tx = hx - dirX * TRAIL_LEN;
        let ty = hy - dirY * TRAIL_LEN;

        const dist = Math.sqrt((cx - startX)**2 + (cy - startY)**2);
        if (dist < TRAIL_LEN && !isFading) {
          tx = startX + squareSize/2; 
          ty = startY + squareSize/2;
        }

        if (dist > 1) {
          const gradient = ctx.createLinearGradient(hx, hy, tx, ty);
          const isWhite = pieceType.startsWith('w') || pieceType === 'P';
          const colorStr = isWhite ? "255, 255, 255" : "40, 40, 40";
          
          gradient.addColorStop(0, `rgba(${colorStr}, ${0.5 * trailOpacity})`);
          gradient.addColorStop(1, `rgba(${colorStr}, 0)`);

          ctx.beginPath();
          ctx.lineCap = "butt";
          ctx.lineWidth = thickness;
          ctx.strokeStyle = gradient;
          ctx.moveTo(hx, hy);
          ctx.lineTo(tx, ty);
          ctx.stroke();
        }
      }

      if (elapsed < (MOVE_DURATION + TRAIL_FADE_MS)) {
        reqId = requestAnimationFrame(render);
      } else {
        anim.current.isPlaying = false;
        if (onComplete) onComplete();
      }
    };

    reqId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(reqId);
  }, [activeMove, squareSize, onLand, onComplete]);

  // Setup Canvas Resolution
  useEffect(() => {
    const cvs = canvasRef.current;
    if (cvs) {
      const dpr = window.devicePixelRatio || 1;
      const rect = cvs.getBoundingClientRect();
      cvs.width = rect.width * dpr;
      cvs.height = rect.height * dpr;
      const ctx = cvs.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    }
  }, [squareSize]);

  // Derive ghost state if activeMove is present but ghost is not set yet
  const currentGhost = ghost || (activeMove ? {
    x: activeMove.startX,
    y: activeMove.startY,
    type: activeMove.pieceType,
    scale: 1.0,
    opacity: 1.0
  } : null);

  // Compute outline drop shadow based on current piece lift (scale)
  const liftPercentage = currentGhost ? (currentGhost.scale - 1.0) / 0.1 : 0;
  const shadowBlur = liftPercentage * 8;
  const shadowOffset = liftPercentage * 6;
  const shadowOpacity = liftPercentage * 0.4;
  const ghostFilter = liftPercentage > 0.01 
    ? `drop-shadow(${shadowOffset}px ${shadowOffset}px ${shadowBlur}px rgba(0, 0, 0, ${shadowOpacity}))`
    : undefined;

   const GhostPiece = currentGhost
  ? pieceSet.pieces[currentGhost.type]
  : null;

const CapturedPiece = capturedGhost
  ? pieceSet.pieces[capturedGhost.type]
  : null;

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 99 }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
      {currentGhost && GhostPiece && (
  <div
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      width: squareSize,
      height: squareSize,
      willChange: "transform",
      transform: `translate3d(${currentGhost.x}px, ${currentGhost.y}px, 0) scale(${currentGhost.scale})`,
      opacity: currentGhost.opacity,
      filter: ghostFilter,
    }}
  >
    {GhostPiece({
      svgStyle: {
        width: "100%",
        height: "100%",
        display: "block",
      },
    })}
  </div>
)}
      {capturedGhost && CapturedPiece && (
  <div
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      width: squareSize,
      height: squareSize,
      willChange: "transform",
      transform: `translate3d(${capturedGhost.x}px, ${capturedGhost.y}px, 0) scale(${capturedGhost.scale})`,
      opacity: capturedGhost.opacity,
    }}
  >
    {CapturedPiece({
      svgStyle: {
        width: "100%",
        height: "100%",
        display: "block",
      },
    })}
  </div>
)}
      
    </div>
  );
}
