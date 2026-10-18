"use client";

import React, { useRef, useState, useEffect } from "react";
import { Eraser, PenTool } from "lucide-react";

interface DeliverySignaturePadProps {
  signerName: string;
  idDocument: string;
  onChangeSignerName: (name: string) => void;
  onChangeIdDocument: (doc: string) => void;
  onSaveSignature: (dataUrl: string) => void;
  isReadOnly?: boolean;
  initialSignature?: string;
}

export function DeliverySignaturePad({
  signerName,
  idDocument,
  onChangeSignerName,
  onChangeIdDocument,
  onSaveSignature,
  isReadOnly = false,
  initialSignature,
}: DeliverySignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hasDrawnRef = useRef(!!initialSignature);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(!!initialSignature);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#d3a548";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (initialSignature) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = initialSignature;
    }
  }, [initialSignature]);

  const getCanvasPoint = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0]?.clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0]?.clientY : e.clientY;
    if (clientX == null || clientY == null) return null;
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (isReadOnly) return;
    if ("touches" in e) e.preventDefault();
    const point = getCanvasPoint(e);
    const canvas = canvasRef.current;
    if (!point || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing || isReadOnly) return;
    if ("touches" in e) e.preventDefault();
    const point = getCanvasPoint(e);
    const canvas = canvasRef.current;
    if (!point || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    hasDrawnRef.current = true;
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawnRef.current) return;
    onSaveSignature(canvas.toDataURL("image/png"));
  };

  const handleClear = () => {
    if (isReadOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasDrawnRef.current = false;
    setHasDrawn(false);
    onSaveSignature("");
  };

  return (
    <div className="flex flex-col gap-4 p-5 rounded-[18px] bg-[#101314] border border-white/[0.08] text-xs">
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <PenTool className="h-4 w-4 text-[#d3a548]" />
          <span className="font-bold text-sm text-[#f1ede5]">
            Assinatura Digital de Levantamento
          </span>
        </div>

        {!isReadOnly && (
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1 text-[12px] text-[#8a9092] hover:text-[#f05a50] cursor-pointer"
          >
            <Eraser className="h-3.5 w-3.5" />
            <span>Limpar</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="delivery-signer" className="font-semibold text-[#a9adae]">
            Nome de Quem Levanta a Viatura *
          </label>
          <input
            id="delivery-signer"
            type="text"
            value={signerName}
            onChange={(e) => onChangeSignerName(e.target.value)}
            placeholder="Nome completo..."
            disabled={isReadOnly}
            className="h-10 px-3 rounded-sm bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] text-xs text-[#f1ede5]"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="delivery-id-document" className="font-semibold text-[#a9adae]">
            Nº Documento de Identificação (CC / Passaporte)
          </label>
          <input
            id="delivery-id-document"
            type="text"
            value={idDocument}
            onChange={(e) => onChangeIdDocument(e.target.value)}
            placeholder="ex: CC 14882991-2"
            disabled={isReadOnly}
            className="h-10 px-3 rounded-sm bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] text-xs text-[#f1ede5] font-mono"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5 pt-1">
        <span className="font-semibold text-[#a9adae]">Assinatura na Tela *</span>
        <div className="relative rounded-md bg-[#0a0d0e] border border-white/[0.08] overflow-hidden flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={400}
            height={100}
            aria-label="Área de assinatura de quem levanta a viatura"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className={`w-full h-[100px] touch-none ${
              isReadOnly ? "cursor-default" : "cursor-crosshair"
            }`}
          />
          {!hasDrawn && !isReadOnly && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-[#8a9092] text-xs italic">
              Desenha a assinatura do cliente aqui com o dedo ou rato...
            </div>
          )}
        </div>
      </div>

      <p className="text-[12px] text-[#8a9092] leading-relaxed pt-1">
        Ao assinar, o cliente confirma o levantamento da viatura, a receção dos pertences
        a bordo e a ativação da respetiva garantia digital.
      </p>
    </div>
  );
}
