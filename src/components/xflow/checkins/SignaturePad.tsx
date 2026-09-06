"use client";

import React, { useRef, useState, useEffect } from "react";
import { Eraser, PenTool } from "lucide-react";

interface SignaturePadProps {
  signerName: string;
  onSaveSignature: (dataUrl: string) => void;
  isReadOnly?: boolean;
  initialSignature?: string;
}

export function SignaturePad({
  signerName,
  onSaveSignature,
  isReadOnly = false,
  initialSignature,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(!!initialSignature);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    ctx.strokeStyle = "#f7d46d";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (initialSignature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = initialSignature;
    }
  }, [initialSignature]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (isReadOnly) return;
    setIsDrawing(true);
    setHasDrawn(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || isReadOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onSaveSignature(canvas.toDataURL());
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    onSaveSignature("");
  };

  const applyDemoSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#f7d46d";
    ctx.lineWidth = 2.5;

    // Draw a stylish signature path
    ctx.beginPath();
    const startX = 60;
    const startY = 80;
    ctx.moveTo(startX, startY);
    ctx.bezierCurveTo(startX + 40, startY - 40, startX + 80, startY + 50, startX + 120, startY - 20);
    ctx.bezierCurveTo(startX + 140, startY + 30, startX + 180, startY - 30, startX + 220, startY + 10);
    ctx.stroke();

    setHasDrawn(true);
    onSaveSignature(canvas.toDataURL());
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-[#a9adae]">
          Assinatura Digital de Receção · {signerName}
        </span>
        {!isReadOnly && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={applyDemoSignature}
              className="text-[12px] font-semibold text-[#d3a548] hover:underline cursor-pointer"
            >
              Assinar Automaticamente (Demo)
            </button>
            <button
              type="button"
              onClick={clearCanvas}
              className="flex items-center gap-1 text-[12px] text-[#8a9092] hover:text-[#f05a50] cursor-pointer"
            >
              <Eraser className="h-3 w-3" />
              <span>Limpar</span>
            </button>
          </div>
        )}
      </div>

      {/* Signature Canvas Box */}
      <div className="relative w-full h-36 rounded-md bg-[#0c0f10] border border-white/[0.08] flex items-center justify-center overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className={`w-full h-full ${isReadOnly ? "cursor-default" : "cursor-crosshair"}`}
        />

        {!hasDrawn && !isReadOnly && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-xs text-[#8a9092] gap-1">
            <PenTool className="h-5 w-5 text-white/20" />
            <span>Assine aqui com o dedo ou rato</span>
          </div>
        )}

        {/* Signature Line */}
        <div className="absolute bottom-6 left-8 right-8 border-b border-white/[0.06] pointer-events-none" />
      </div>
    </div>
  );
}
