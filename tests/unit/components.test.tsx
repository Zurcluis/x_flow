import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Logo } from "@/components/xflow/Logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { KpiCard } from "@/components/xflow/KpiCard";

describe("UI Components", () => {
  it("renders Logo with canonical X-FLOW by X-Motion text", () => {
    render(<Logo variant="full" />);
    expect(screen.getByText("X-FLOW")).toBeInTheDocument();
    expect(screen.getByText("by X-Motion")).toBeInTheDocument();
  });

  it("renders Logo in symbol-only mode", () => {
    const { container } = render(<Logo variant="symbol" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("aria-label", "X-Flow Símbolo");
  });

  it("renders Button with primary gold variant", () => {
    render(<Button variant="primary">Criar Orçamento</Button>);
    const btn = screen.getByRole("button", { name: /Criar Orçamento/i });
    expect(btn).toBeInTheDocument();
    expect(btn.className).toContain("from-[#d3a548]");
  });

  it("renders Badge with in_progress status", () => {
    render(<Badge variant="in_progress">Em Curso</Badge>);
    expect(screen.getByText("Em Curso")).toBeInTheDocument();
  });

  it("renders Card with title and content", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Trabalhos de Hoje</CardTitle>
        </CardHeader>
        <CardContent>Conteúdo de teste</CardContent>
      </Card>
    );
    expect(screen.getByText("Trabalhos de Hoje")).toBeInTheDocument();
    expect(screen.getByText("Conteúdo de teste")).toBeInTheDocument();
  });

  it("renders KpiCard with value and label", () => {
    render(
      <KpiCard
        title="Hoje na Oficina"
        value={4}
        label="Viaturas"
        linkText="Ver detalhes"
        href="/vehicles"
      />
    );
    expect(screen.getByText("Hoje na Oficina")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("Viaturas")).toBeInTheDocument();
    expect(screen.getByText("Ver detalhes")).toBeInTheDocument();
  });
});
