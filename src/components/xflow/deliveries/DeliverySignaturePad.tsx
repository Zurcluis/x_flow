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
        ctx.drawImage(img, 0, 0);
      };
      img.src = initialSignature;
    }
  }, [initialSignature]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (isReadOnly) return;
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || isReadOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    onSaveSignature(canvas.toDataURL("image/png"));
  };

  const handleClear = () => {
    if (isReadOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    onSaveSignature("");
  };

  const handleDemoSignature = () => {
    if (isReadOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.moveTo(30, 45);
    ctx.bezierCurveTo(60, 20, 90, 70, 130, 35);
    ctx.bezierCurveTo(160, 10, 200, 60, 240, 30);
    ctx.stroke();

    setHasDrawn(true);
    onSaveSignature(canvas.toDataURL("image/png"));
  };

  return (
    <div className="flex flex-col gap-4 p-5 rounded-[18px] bg-[#101314] border border-white/[0.08] text-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <PenTool className="h-4 w-4 text-[#d3a548]" />
          <span className="font-bold text-sm text-[#f1ede5]">
            Assinatura Digital de Levantamento
          </span>
        </div>

        {!isReadOnly && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDemoSignature}
              className="text-[12px] text-[#d3a548] hover:underline cursor-pointer font-medium"
            >
              Assinar Automaticamente (Demo)
            </button>
            <span className="text-[#8a9092]">·</span>
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center gap-1 text-[12px] text-[#8a9092] hover:text-[#f05a50] cursor-pointer"
            >
              <Eraser className="h-3.5 w-3.5" />
              <span>Limpar</span>
            </button>
          </div>
        )}
      </div>

      {/* Receiver Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="font-semibold text-[#a9adae]">Nome de Quem Levanta a Viatura *</label>
          <input
            type="text"
            value={signerName}
            onChange={(e) => onChangeSignerName(e.target.value)}
            placeholder="Nome completo..."
            disabled={isReadOnly}
            className="h-10 px-3 rounded-[10px] bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] text-xs text-[#f1ede5]"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-semibold text-[#a9adae]">Nº Documento de Identificação (CC / Passaporte)</label>
          <input
            type="text"
            value={idDocument}
            onChange={(e) => onChangeIdDocument(e.target.value)}
            placeholder="ex: CC 14882991-2"
            disabled={isReadOnly}
            className="h-10 px-3 rounded-[10px] bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] text-xs text-[#f1ede5] font-mono"
          />
        </div>
      </div>

      {/* Signature Canvas */}
      <div className="flex flex-col gap-1.5 pt-1">
        <label className="font-semibold text-[#a9adae]">Assinatura na Tela *</label>
        <div className="relative rounded-[14px] bg-[#0a0d0e] border border-white/[0.08] overflow-hidden flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={400}
            height={100}
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
        Ao assinar, o cliente confirma o levantamento da viatura em perfeito estado de conformidade, a receção integral de todos os pertences a bordo e a ativação da respetiva garantia digital.
      </p>
    </div>
  );
}
