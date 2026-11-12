#!/usr/bin/env python3
"""Gera o relatório do Raio-X do Instagram (PDF com reportlab; plano B em HTML).

Uso:
    python3 gerar_relatorio.py --pasta <pasta-do-trabalho>
    python3 gerar_relatorio.py --pasta <pasta> --formato html      (força o plano B)
    python3 gerar_relatorio.py --pasta <pasta> --previa            (gera PNG das páginas para conferir)

A pasta precisa ter: perfil.json, metricas.json (saída do contas.py) e raio-x.json (a análise).
Saída em <pasta>/entrega/: o PDF (ou HTML), resumo-whatsapp.txt e, no modo prospect,
mensagem-abordagem.txt. O script confere o raio-x.json antes e lista o que falta.
"""
import argparse
import html as htmlmod
import json
import re
import shutil
import subprocess
import sys
from datetime import date, datetime, timedelta
from pathlib import Path
from xml.sax.saxutils import escape

AQUI = Path(__file__).resolve().parent
FONTES = AQUI.parent / "assets" / "fontes"

# ---------------------------------------------------------------- critérios fixos
AREAS = [
    ("primeira_impressao", "Primeira impressão",
     "Foto reconhecível em tamanho pequeno, nome pesquisável, bio em 3 informações (assunto, como ajuda, próximo passo) e link coerente com a chamada."),
    ("destaques", "Destaques",
     "Vitrine permanente: sobre, serviços, provas, dúvidas e, se for negócio local, como chegar. Capas legíveis, nomes claros, conteúdo atual."),
    ("grade", "Grade",
     "Em 3 segundos dá para entender o assunto do perfil. Capas com título legível no tamanho da grade e identidade reconhecível."),
    ("formatos", "Mix de formatos",
     "Cada formato com uma função: Reels para alcance, carrossel para salvamentos, Stories para conversa e conversão, Destaques para autoridade."),
    ("frequencia", "Frequência e constância",
     "Ritmo que cabe na rotina e sem buracos longos. Referência de planejamento do curso: mínimo de 3 posts por semana, ideal 1 por dia."),
    ("posicionamento", "Posicionamento e pilares",
     "Dá para completar 'Ajudamos [público] a [progresso] com [abordagem]' só olhando o perfil. 3 ou 4 pilares ligados ao que se vende."),
    ("ganchos", "Ganchos",
     "Capa, primeira linha e 3 primeiros segundos mostram uma situação reconhecível ou uma promessa clara, e a entrega cumpre."),
    ("ctas", "Chamadas para ação",
     "Uma chamada por peça, ligada ao que acabou de acontecer: salvar, comentar, chamar no direct ou ir ao link."),
    ("caminho_venda", "Caminho até a venda",
     "Bio, link, direct ou WhatsApp e oferta: cada passo existe, é óbvio e leva ao próximo sem esforço."),
    ("prova_social", "Prova social",
     "Depoimentos, resultados e bastidores reais, com autorização, fáceis de achar em destaques, fixados e Reels."),
    ("engajamento", "Engajamento",
     "Interações úteis (salvamentos, compartilhamentos, comentários com pergunta) medidas com denominador e comparadas com o próprio perfil."),
]
IDS_AREAS = [a[0] for a in AREAS]

OBJETIVOS = {
    "vender-servico": "Vender um serviço",
    "crescer": "Crescer a audiência",
    "lancar": "Preparar um lançamento",
    "clientes-locais": "Atrair clientes locais",
}
SINONIMOS_OBJETIVO = {
    "vender": "vender-servico", "vender servico": "vender-servico", "vender serviço": "vender-servico",
    "servico": "vender-servico", "serviço": "vender-servico", "crescimento": "crescer", "crescer": "crescer",
    "lancamento": "lancar", "lançamento": "lancar", "lançar": "lancar", "lancar": "lancar",
    "local": "clientes-locais", "clientes locais": "clientes-locais", "atrair clientes locais": "clientes-locais",
    "negocio local": "clientes-locais", "negócio local": "clientes-locais",
}
# Pesos por objetivo (declarados no relatório). Ordem igual a AREAS.
PESOS = {
    "vender-servico": [1.5, 1.0, 0.5, 0.75, 0.75, 1.0, 1.0, 1.25, 2.0, 1.5, 1.0],
    "crescer":        [1.0, 0.5, 0.75, 1.5, 1.5, 1.25, 2.0, 0.75, 0.5, 0.5, 1.5],
    "lancar":         [1.0, 1.0, 0.5, 1.0, 1.0, 1.0, 1.25, 1.5, 1.5, 1.5, 1.25],
    "clientes-locais": [1.75, 1.25, 0.5, 0.75, 0.75, 1.0, 1.0, 1.25, 1.75, 1.5, 0.75],
}
MODOS = {"meu-perfil": "Com os Insights do perfil", "cliente": "Com os Insights do perfil",
         "prospect": "Sem os Insights do perfil: números públicos são estimativa"}
SUBTITULO = {"prospect": "Pré-diagnóstico com dados públicos e plano de ação de 30 dias"}
SUBTITULO_PADRAO = "Diagnóstico completo do perfil e plano de ação de 30 dias"
FORMATOS_PLANO = ["Reels", "Carrossel", "Estático", "Stories", "Live", "Descanso"]
DIAS_SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]
LIMITE_BIO = 150  # realidade de setembro de 2026; confira no app

COR_PADRAO = "#6D4AFF"
PALETA = {
    "tinta": "#15121F", "texto": "#2A2737", "suave": "#6B6880", "linha": "#E4E1EE",
    "fundo": "#F6F4FB", "branco": "#FFFFFF",
    "critico": "#E5484D", "atencao": "#F0A43A", "bom": "#3DAA73", "forte": "#1F8A5B",
    "confirmar_fundo": "#FFE9B8", "confirmar_texto": "#7A4E00",
}
COR_FORMATO = {"Reels": None, "Carrossel": "#0E9F9B", "Estático": "#E8952B", "Stories": "#E1508F",
               "Live": "#E5484D", "Descanso": "#A9A6B8"}


def faixa(nota):
    if nota is None:
        return ("Sem dados", PALETA["suave"])
    if nota <= 4:
        return ("Crítico", PALETA["critico"])
    if nota <= 6:
        return ("Atenção", PALETA["atencao"])
    if nota <= 8:
        return ("Bom", PALETA["bom"])
    return ("Forte", PALETA["forte"])


def arred(v, casas):
    """Arredonda meio para cima (19,45 -> 19,5), como uma pessoa faria ao escrever o número no texto."""
    from decimal import Decimal, ROUND_HALF_UP
    return float(Decimal(repr(float(v))).quantize(Decimal(1).scaleb(-casas), rounding=ROUND_HALF_UP))


def br(v, casas=1, sufixo=""):
    if v is None:
        return "–"
    v = arred(v, casas)
    if casas == 0:
        s = f"{v:,.0f}".replace(",", ".")
    else:
        s = f"{v:,.{casas}f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return s + sufixo


def data_curta(iso):
    if not iso:
        return "–"
    d = date.fromisoformat(iso)
    return d.strftime("%d/%m")


def data_longa(d):
    meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro",
             "outubro", "novembro", "dezembro"]
    return f"{d.day} de {meses[d.month - 1]} de {d.year}"


def misturar(hex1, hex2, t):
    a = [int(hex1[i:i + 2], 16) for i in (1, 3, 5)]
    b = [int(hex2[i:i + 2], 16) for i in (1, 3, 5)]
    c = [round(a[k] + (b[k] - a[k]) * t) for k in range(3)]
    return "#" + "".join(f"{x:02X}" for x in c)


# ---------------------------------------------------------------- leitura e conferência
def carregar(pasta: Path):
    faltam = [a for a in ("perfil.json", "metricas.json", "raio-x.json") if not (pasta / a).exists()]
    if faltam:
        sys.exit("Faltam arquivos na pasta: " + ", ".join(faltam) + ". Rode primeiro o contas.py e escreva o raio-x.json.")
    ler = lambda n: json.loads((pasta / n).read_text(encoding="utf-8"))
    return ler("perfil.json"), ler("metricas.json"), ler("raio-x.json")


def objetivo_norm(v):
    s = (v or "").strip().lower()
    if s in OBJETIVOS:
        return s
    return SINONIMOS_OBJETIVO.get(s, "vender-servico")


def conferir(perfil, met, rx):
    erros, avisos = [], []
    modo = perfil.get("modo", "cliente")
    if modo not in MODOS:
        erros.append(f"perfil.json: modo '{modo}' inválido. Use meu-perfil, cliente ou prospect.")
    if (perfil.get("objetivo") or "").strip().lower() not in OBJETIVOS and \
            (perfil.get("objetivo") or "").strip().lower() not in SINONIMOS_OBJETIVO:
        avisos.append("Objetivo não reconhecido; usei 'vender-servico' para os pesos. Use: " + ", ".join(OBJETIVOS))
    res = rx.get("resumo") or {}
    if not res.get("diagnostico"):
        erros.append("resumo.diagnostico está vazio.")
    if len(res.get("pontos_fortes") or []) < 2:
        erros.append("resumo.pontos_fortes precisa de 2 ou 3 itens.")
    areas = rx.get("areas") or {}
    for aid, titulo, _ in AREAS:
        a = areas.get(aid)
        if not a:
            erros.append(f"areas.{aid} ({titulo}) está faltando.")
            continue
        n = a.get("nota")
        if n is not None and (not isinstance(n, (int, float)) or n < 0 or n > 10):
            erros.append(f"areas.{aid}.nota precisa ser de 0 a 10 (ou null quando não há dados).")
        for campo in ("o_que_vimos", "por_que", "o_que_fazer"):
            if not (a.get(campo) or "").strip():
                erros.append(f"areas.{aid}.{campo} está vazio.")
    probs = rx.get("problemas") or []
    if len(probs) != 5:
        erros.append(f"problemas: são 5 (encontrei {len(probs)}).")
    for i, p in enumerate(probs, 1):
        for campo in ("titulo", "evidencia", "por_que_custa"):
            if not (p.get(campo) or "").strip():
                erros.append(f"problemas[{i}].{campo} está vazio.")
        if not p.get("correcao"):
            erros.append(f"problemas[{i}].correcao precisa de pelo menos 1 passo.")
    bios = rx.get("bios") or []
    if len(bios) != 3:
        erros.append(f"bios: são 3 (encontrei {len(bios)}).")
    for i, b in enumerate(bios, 1):
        t = b.get("texto", "")
        if len(t) > LIMITE_BIO:
            erros.append(f"bios[{i}] tem {len(t)} caracteres; o limite da bio é {LIMITE_BIO} (realidade de set/2026, confira no app).")
        if not b.get("prioriza"):
            avisos.append(f"bios[{i}] sem o campo 'prioriza' (o que essa versão privilegia).")
    dest = rx.get("destaques") or []
    if not 3 <= len(dest) <= 8:
        erros.append(f"destaques: sugira de 4 a 7 (encontrei {len(dest)}).")
    plano = (rx.get("plano_30_dias") or {}).get("dias") or []
    if len(plano) != 30:
        erros.append(f"plano_30_dias.dias: são 30 dias (encontrei {len(plano)}).")
    for i, d in enumerate(plano, 1):
        if d.get("formato") not in FORMATOS_PLANO:
            erros.append(f"plano_30_dias.dias[{i}].formato '{d.get('formato')}' inválido. Use: {', '.join(FORMATOS_PLANO)}.")
        if not (d.get("pauta") or "").strip():
            erros.append(f"plano_30_dias.dias[{i}].pauta está vazia.")
        elif len(d["pauta"]) > 110:
            avisos.append(f"plano dia {i}: pauta com {len(d['pauta'])} caracteres; acima de 110 fica apertado no calendário.")
    ideias = rx.get("ideias") or []
    if len(ideias) != 15:
        erros.append(f"ideias: são 15 (encontrei {len(ideias)}).")
    for i, d in enumerate(ideias, 1):
        if not d.get("gancho") or not d.get("pauta"):
            erros.append(f"ideias[{i}] precisa de pauta e gancho.")
    rot = rx.get("roteiros") or []
    if len(rot) != 3:
        erros.append(f"roteiros: são 3 (encontrei {len(rot)}).")
    for i, r in enumerate(rot, 1):
        etapas = [(b.get("etapa") or "").lower()[:1] for b in r.get("blocos") or []]
        if etapas != ["g", "p", "e", "c"]:
            erros.append(f"roteiros[{i}].blocos precisa ter 4 blocos na ordem Gancho, Promessa, Entrega, CTA.")
        for b in r.get("blocos") or []:
            if not b.get("fala") or not b.get("visual"):
                erros.append(f"roteiros[{i}]: todo bloco precisa de fala e visual.")
                break
    if modo == "prospect" and not (rx.get("abordagem") or "").strip():
        erros.append("Modo prospect: escreva a mensagem de abordagem (campo 'abordagem').")
    if rx.get("abordagem") and len(rx["abordagem"]) > 900:
        avisos.append(f"abordagem com {len(rx['abordagem'])} caracteres; mensagem de primeiro contato funciona melhor curta (até ~700).")
    if rx.get("whatsapp") and len(rx["whatsapp"]) > 1500:
        avisos.append(f"whatsapp com {len(rx['whatsapp'])} caracteres; a versão curta deve caber em uma tela (até ~1.200).")
    if (perfil.get("concorrentes") or []) and not (rx.get("concorrentes") or {}).get("leitura"):
        avisos.append("Há concorrentes no perfil.json, mas raio-x.json não tem concorrentes.leitura.")
    texto_todo = json.dumps(rx, ensure_ascii=False)
    pend = sorted(set(re.findall(r"\[CONFIRMAR[^\]]*\]", texto_todo)))
    if pend:
        avisos.append(f"{len(pend)} ponto(s) marcados [CONFIRMAR] no relatório: " + "; ".join(pend[:8]))
    for m in re.finditer(r"benchmark|m[ée]dia (?:de|do|da) (?:mercado|setor|nicho|categoria)|taxa ideal|engajamento ideal", texto_todo, re.I):
        antes = texto_todo[max(0, m.start() - 45):m.start()].lower()
        if not re.search(r"\b(não|sem|nada de|nenhum|nenhuma)\b", antes):
            avisos.append(f"O texto cita '{m.group(0)}'. A skill não usa referência externa inventada; troque pelo critério (perfil contra ele mesmo).")
            break
    return erros, avisos


def nota_geral(rx, objetivo):
    pesos = PESOS[objetivo]
    soma, total = 0.0, 0.0
    detalhes = []
    for (aid, titulo, _), w in zip(AREAS, pesos):
        n = (rx.get("areas") or {}).get(aid, {}).get("nota")
        detalhes.append((aid, titulo, n, w))
        if n is not None:
            soma += n * w
            total += w
    return (round(soma / total, 1) if total else None), detalhes


def datas_plano(rx, data_rel):
    ini = (rx.get("plano_30_dias") or {}).get("inicio")
    if ini:
        d0 = date.fromisoformat(ini)
    else:
        d0 = data_rel + timedelta(days=(7 - data_rel.weekday()) % 7 or 7)
    return d0


def texto_whatsapp(perfil, met, rx, geral):
    if (rx.get("whatsapp") or "").strip():
        return rx["whatsapp"].strip().replace("{nota_geral}", br(geral, 1)) + "\n"
    probs = rx.get("problemas") or []
    linhas = [f"Raio-X do Instagram de {perfil.get('perfil')}", "",
              f"Nota geral: {br(geral, 1)}/10", ""]
    linhas.append("O que mais está custando hoje:")
    for i, p in enumerate(probs[:3], 1):
        linhas.append(f"{i}. {p['titulo']}")
    linhas += ["", "O que fazer já nesta semana:"]
    for i, p in enumerate(probs[:3], 1):
        passo = p["correcao"][0] if isinstance(p["correcao"], list) else p["correcao"]
        linhas.append(f"- {passo}")
    linhas += ["", "O relatório completo (com as 3 bios, o calendário de 30 dias, 15 ideias e 3 roteiros) está no PDF."]
    return "\n".join(linhas) + "\n"


# ---------------------------------------------------------------- PDF (reportlab)
def gerar_pdf(perfil, met, rx, saida: Path, cor_destaque):
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib.units import mm
    from reportlab.lib import colors
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
    from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Table, TableStyle,
                                    PageBreak, NextPageTemplate, KeepTogether, Flowable, CondPageBreak)
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.lib.fonts import addMapping

    C = lambda h: colors.HexColor(h)
    DEST = cor_destaque
    DEST_CLARO = misturar(DEST, "#FFFFFF", 0.88)
    DEST_ESCURO = misturar(DEST, "#000000", 0.35)
    COR_FORMATO["Reels"] = DEST

    # fontes
    cmaps = {}
    try:
        for nome in ("Inter-Regular", "Inter-Medium", "Inter-Bold", "Sora-SemiBold", "Sora-Bold"):
            t = TTFont(nome, str(FONTES / f"{nome}.ttf"))
            pdfmetrics.registerFont(t)
            cmaps[nome] = set(t.face.charToGlyph.keys())
        addMapping("Inter-Regular", 0, 0, "Inter-Regular")
        addMapping("Inter-Regular", 1, 0, "Inter-Bold")
        addMapping("Inter-Regular", 0, 1, "Inter-Regular")
        addMapping("Inter-Regular", 1, 1, "Inter-Bold")
        addMapping("Inter-Medium", 1, 0, "Inter-Bold")
        addMapping("Inter-Medium", 0, 1, "Inter-Medium")
        addMapping("Inter-Medium", 1, 1, "Inter-Bold")
        F_REG, F_MED, F_BOLD, F_TIT, F_TIT_B = "Inter-Regular", "Inter-Medium", "Inter-Bold", "Sora-SemiBold", "Sora-Bold"
    except Exception as e:  # sem as fontes: Helvetica
        print("Aviso: fontes da skill não carregaram (" + str(e) + "); usando Helvetica.")
        F_REG, F_MED, F_BOLD, F_TIT, F_TIT_B = "Helvetica", "Helvetica", "Helvetica-Bold", "Helvetica-Bold", "Helvetica-Bold"
        cmaps = {}

    TROCAS = {"→": "->", "←": "<-", "↗": "->", "✓": "ok", "✔": "ok", "★": "*", "≥": ">=", "≤": "<=",
              "▲": "+", "▼": "-", "•": "-", "…": "...", "“": '"', "”": '"', "‘": "'", "’": "'", "–": "-", "—": "-"}

    def limpar(s, fonte):
        cm = cmaps.get(fonte)
        out = []
        for ch in str(s):
            if ch in "\n\t":
                out.append(ch)
                continue
            ok = (ord(ch) in cm) if cm is not None else _cp1252(ch)
            if ok:
                out.append(ch)
            elif ch in TROCAS:
                out.append(TROCAS[ch])
        return re.sub(r"[ ]{2,}", " ", "".join(out)).strip(" ") if "\n" not in s else "".join(out)

    def _cp1252(ch):
        try:
            ch.encode("cp1252")
            return True
        except UnicodeEncodeError:
            return False

    def mk(txt, fonte):
        s = escape(limpar(txt, fonte))
        s = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s)
        s = re.sub(r"\[CONFIRMAR([^\]]*)\]",
                   lambda m: f'<font backColor="{PALETA["confirmar_fundo"]}" color="{PALETA["confirmar_texto"]}">[CONFIRMAR{m.group(1)}]</font>', s)
        return s.replace("\n", "<br/>")

    def est(nome, **kw):
        base = dict(fontName=F_REG, fontSize=9.5, leading=14, textColor=C(PALETA["texto"]))
        base.update(kw)
        return ParagraphStyle(nome, **base)

    S = {
        "corpo": est("corpo"),
        "corpo_suave": est("corpo_suave", textColor=C(PALETA["suave"])),
        "peq": est("peq", fontSize=8, leading=11),
        "peq_suave": est("peq_suave", fontSize=7.6, leading=10.5, textColor=C(PALETA["suave"])),
        "mini": est("mini", fontSize=6.8, leading=8.5),
        "mini_b": est("mini_b", fontSize=7, leading=9, fontName=F_BOLD),
        "h1": est("h1", fontName=F_TIT_B, fontSize=22, leading=27, textColor=C(PALETA["tinta"]), spaceAfter=4),
        "h2": est("h2", fontName=F_TIT, fontSize=13, leading=17, textColor=C(PALETA["tinta"]), spaceBefore=6, spaceAfter=4),
        "h3": est("h3", fontName=F_BOLD, fontSize=10, leading=13, textColor=C(PALETA["tinta"])),
        "rotulo": est("rotulo", fontName=F_BOLD, fontSize=7.2, leading=9, textColor=C(DEST)),
        "lead": est("lead", fontSize=11, leading=16.5, textColor=C(PALETA["texto"])),
        "celula": est("celula", fontSize=7.6, leading=10),
        "celula_b": est("celula_b", fontSize=7.6, leading=10, fontName=F_BOLD),
        "cab": est("cab", fontSize=7.2, leading=9, fontName=F_BOLD, textColor=colors.white),
    }

    def P(txt, st="corpo"):
        stl = S[st] if isinstance(st, str) else st
        return Paragraph(mk(txt, stl.fontName), stl)

    def PR(marcacao, st="corpo"):
        """Parágrafo com marcação já pronta (o chamador escapa o texto)."""
        stl = S[st] if isinstance(st, str) else st
        return Paragraph(marcacao, stl)

    def T(txt, fonte=None):
        return escape(limpar(txt, fonte or F_REG))

    def marcador(txt, tam=8.6, lead=12.2):
        stl = est(f"mk{tam}", fontSize=tam, leading=lead, leftIndent=11, bulletIndent=0, bulletFontName=F_BOLD,
                  bulletColor=C(DEST), bulletFontSize=tam)
        return Paragraph(mk(txt, F_REG), stl, bulletText="•")

    # ------------------------------------------------ flowables próprios
    class Sobrelinha(Flowable):
        def __init__(self, texto, cor=DEST):
            super().__init__()
            self.texto, self.cor = limpar(texto.upper(), F_BOLD), cor

        def wrap(self, aw, ah):
            return aw, 14

        def getSpaceBefore(self):
            return 26

        def draw(self):
            c = self.canv
            c.setFillColor(C(self.cor))
            t = c.beginText(0, 3)
            t.setFont(F_BOLD, 7.8)
            t.setCharSpace(1.6)
            t.textOut(self.texto)
            t.setCharSpace(0)
            c.drawText(t)

    class Medidor(Flowable):
        def __init__(self, nota, d=120, fundo_escuro=False):
            super().__init__()
            self.nota, self.d, self.escuro = nota, d, fundo_escuro

        def wrap(self, aw, ah):
            return self.d, self.d

        def draw(self):
            c = self.canv
            r = self.d / 2
            cx, cy = r, r
            esp = self.d * 0.085
            trilho = "#3A3550" if self.escuro else PALETA["linha"]
            c.setLineWidth(esp)
            c.setLineCap(1)
            c.setStrokeColor(C(trilho))
            c.circle(cx, cy, r - esp / 2 - 1, stroke=1, fill=0)
            if self.nota is not None:
                _, cor = faixa(round(self.nota))
                c.setStrokeColor(C(cor))
                ang = 360 * self.nota / 10
                p = c.beginPath()
                rr = r - esp / 2 - 1
                p.arc(cx - rr, cy - rr, cx + rr, cy + rr, startAng=90, extent=-ang)
                c.drawPath(p, stroke=1, fill=0)
            c.setFillColor(colors.white if self.escuro else C(PALETA["tinta"]))
            txt = br(self.nota, 1) if self.nota is not None else "–"
            c.setFont(F_TIT_B, self.d * 0.27)
            c.drawCentredString(cx, cy - self.d * 0.06, txt)
            c.setFont(F_REG, self.d * 0.085)
            c.setFillColor(C("#B9B4CC") if self.escuro else C(PALETA["suave"]))
            c.drawCentredString(cx, cy - self.d * 0.21, "de 10")

    class Selo(Flowable):
        def __init__(self, nota, d=34):
            super().__init__()
            self.nota, self.d = nota, d

        def wrap(self, aw, ah):
            return self.d, self.d + 12

        def draw(self):
            c = self.canv
            rot, cor = faixa(self.nota)
            c.setFillColor(C(cor))
            c.circle(self.d / 2, 12 + self.d / 2, self.d / 2, stroke=0, fill=1)
            c.setFillColor(colors.white)
            c.setFont(F_TIT_B, self.d * 0.42)
            c.drawCentredString(self.d / 2, 12 + self.d / 2 - self.d * 0.15, "–" if self.nota is None else str(int(self.nota)))
            c.setFillColor(C(cor))
            c.setFont(F_BOLD, 6.2)
            c.drawCentredString(self.d / 2, 2, limpar(rot.upper(), F_BOLD))

    class Blocos(Flowable):
        """Linha de indicadores: [(valor, rótulo, nota de rodapé)]."""

        def __init__(self, itens, altura=70):
            super().__init__()
            self.itens, self.h = itens, altura

        def wrap(self, aw, ah):
            self.w = aw
            return aw, self.h

        def draw(self):
            c = self.canv
            n = len(self.itens)
            gap = 8
            lw = (self.w - gap * (n - 1)) / n
            for i, (valor, rot, rod) in enumerate(self.itens):
                x = i * (lw + gap)
                c.setFillColor(C(PALETA["fundo"]))
                c.roundRect(x, 0, lw, self.h, 8, stroke=0, fill=1)
                c.setFillColor(C(PALETA["tinta"]))
                c.setFont(F_TIT_B, 17)
                c.drawString(x + 10, self.h - 26, limpar(valor, F_TIT_B))
                tam_r = 7.4
                rot_l = limpar(rot, F_BOLD)
                while pdfmetrics.stringWidth(rot_l, F_BOLD, tam_r) > lw - 18 and tam_r > 5.6:
                    tam_r -= 0.2
                c.setFont(F_BOLD, tam_r)
                c.setFillColor(C(PALETA["texto"]))
                c.drawString(x + 10, self.h - 39, rot_l)
                c.setFont(F_REG, 6.3)
                c.setFillColor(C(PALETA["suave"]))
                yy = self.h - 49
                for ln in _quebrar(limpar(rod, F_REG), F_REG, 6.3, lw - 18)[:3]:
                    c.drawString(x + 10, yy, ln)
                    yy -= 7.6

    def _quebrar(txt, fonte, tam, larg):
        palavras, linhas, atual = txt.split(), [], ""
        for p in palavras:
            teste = (atual + " " + p).strip()
            if pdfmetrics.stringWidth(teste, fonte, tam) <= larg:
                atual = teste
            else:
                if atual:
                    linhas.append(atual)
                atual = p
        if atual:
            linhas.append(atual)
        return linhas

    class BarrasNotas(Flowable):
        def __init__(self, linhas):
            super().__init__()
            self.linhas = linhas  # (titulo, nota, peso)

        def wrap(self, aw, ah):
            self.w = aw
            return aw, len(self.linhas) * 17 + 4

        def draw(self):
            c = self.canv
            y = len(self.linhas) * 17
            x0, xv = 118, self.w - 58
            for titulo, nota, peso in self.linhas:
                y -= 17
                c.setFont(F_MED, 8.2)
                c.setFillColor(C(PALETA["texto"]))
                c.drawString(0, y + 5, limpar(titulo, F_MED))
                c.setFillColor(C(PALETA["linha"]))
                c.roundRect(x0, y + 4, xv - x0, 7, 3.5, stroke=0, fill=1)
                if nota is not None:
                    _, cor = faixa(nota)
                    c.setFillColor(C(cor))
                    c.roundRect(x0, y + 4, max(7, (xv - x0) * nota / 10), 7, 3.5, stroke=0, fill=1)
                c.setFont(F_BOLD, 8.4)
                c.setFillColor(C(PALETA["tinta"]))
                c.drawRightString(self.w - 22, y + 4, "–" if nota is None else f"{int(nota)}")
                c.setFont(F_REG, 6.6)
                c.setFillColor(C(PALETA["suave"]))
                c.drawRightString(self.w, y + 4.5, f"x{br(peso, 2).rstrip('0').rstrip(',')}")

    class BarrasSimples(Flowable):
        def __init__(self, linhas, cor=DEST, larg_rotulo=70):
            super().__init__()
            self.linhas, self.cor, self.lr = linhas, cor, larg_rotulo  # (rotulo, valor, texto)

        def wrap(self, aw, ah):
            self.w = aw
            return aw, len(self.linhas) * 16 + 2

        def draw(self):
            c = self.canv
            mx = max([v for _, v, _ in self.linhas if v] or [1])
            y = len(self.linhas) * 16
            for rot, v, txt in self.linhas:
                y -= 16
                c.setFont(F_MED, 7.8)
                c.setFillColor(C(PALETA["texto"]))
                c.drawString(0, y + 4, limpar(rot, F_MED))
                larg = (self.w - self.lr - 60) * ((v or 0) / mx)
                c.setFillColor(C(PALETA["linha"]))
                c.roundRect(self.lr, y + 3, self.w - self.lr - 60, 8, 4, stroke=0, fill=1)
                c.setFillColor(C(COR_FORMATO.get(rot) or self.cor))
                if v:
                    c.roundRect(self.lr, y + 3, max(8, larg), 8, 4, stroke=0, fill=1)
                c.setFont(F_BOLD, 7.8)
                c.setFillColor(C(PALETA["tinta"]))
                c.drawString(self.w - 54, y + 3.5, limpar(txt, F_BOLD))

    class Etiqueta(Flowable):
        def __init__(self, texto, cor, cor_texto="#FFFFFF", tam=6.8):
            super().__init__()
            self.t, self.cor, self.ct, self.tam = limpar(texto, F_BOLD), cor, cor_texto, tam

        def wrap(self, aw, ah):
            self.w = pdfmetrics.stringWidth(self.t, F_BOLD, self.tam) + 10
            return self.w, self.tam + 6

        def draw(self):
            c = self.canv
            c.setFillColor(C(self.cor))
            c.roundRect(0, 0, self.w, self.tam + 6, (self.tam + 6) / 2, stroke=0, fill=1)
            c.setFillColor(C(self.ct))
            c.setFont(F_BOLD, self.tam)
            c.drawString(5, 3.2, self.t)

    class Linha(Flowable):
        """Etiquetas lado a lado, do tamanho do texto."""

        def __init__(self, itens, gap=5):
            super().__init__()
            self.itens, self.gap = [i for i in itens if i is not None], gap

        def wrap(self, aw, ah):
            self.tams = [i.wrap(aw, ah) for i in self.itens]
            return aw, max([h for _, h in self.tams] or [0])

        def draw(self):
            x = 0
            for it, (w, h) in zip(self.itens, self.tams):
                it.drawOn(self.canv, x, 0)
                x += w + self.gap

    class PerfilMock(Flowable):
        def __init__(self, handle, nome, categoria, bio, link, largura=250, iniciais_de=None, numeros=None):
            super().__init__()
            self.numeros = numeros or {}
            self.handle, self.nome, self.cat, self.bio, self.link, self.lw = handle, nome, categoria, bio, link, largura
            self.base_ini = iniciais_de or nome
            self.p_bio = Paragraph(mk(bio, F_REG), est("biomock", fontSize=8.4, leading=11.4, textColor=C("#111111")))

        def wrap(self, aw, ah):
            _, hb = self.p_bio.wrap(self.lw - 28, 400)
            self.hb = hb
            self.h = 92 + hb + (16 if self.link else 0)
            return self.lw, self.h

        def draw(self):
            c = self.canv
            c.setFillColor(colors.white)
            c.setStrokeColor(C(PALETA["linha"]))
            c.setLineWidth(1)
            c.roundRect(0, 0, self.lw, self.h, 10, stroke=1, fill=1)
            top = self.h - 14
            c.setFillColor(C(DEST))
            c.circle(34, top - 22, 20, stroke=0, fill=1)
            ini = "".join(w[0] for w in re.findall(r"[A-Za-zÀ-ú]+", self.base_ini)[:2]).upper() or "IG"
            c.setFillColor(colors.white)
            c.setFont(F_TIT_B, 12)
            c.drawCentredString(34, top - 26, limpar(ini, F_TIT_B))
            c.setFillColor(C("#111111"))
            c.setFont(F_BOLD, 9)
            c.drawString(64, top - 14, limpar(self.handle.lstrip("@"), F_BOLD))
            c.setFont(F_REG, 7)
            c.setFillColor(C(PALETA["suave"]))
            itens = [(limpar(str(self.numeros.get(k) or ""), F_BOLD), rot) for k, rot in
                     (("publicacoes", "publicações"), ("seguidores", "seguidores"), ("seguindo", "seguindo"))]
            tam, gap = 7.0, 8.0
            larg_max = self.lw - 64 - 10

            def largura(tm, gp):
                return sum((pdfmetrics.stringWidth(v, F_BOLD, tm) + 2.5 if v else 0) + pdfmetrics.stringWidth(r_, F_REG, tm)
                           for v, r_ in itens) + gp * (len(itens) - 1)
            while largura(tam, gap) > larg_max and tam > 5.4:
                tam -= 0.2
                gap = max(5.0, gap - 0.3)
            xx = 64
            for val, rot in itens:
                if val:
                    c.setFont(F_BOLD, tam)
                    c.setFillColor(C("#111111"))
                    c.drawString(xx, top - 26, val)
                    xx += pdfmetrics.stringWidth(val, F_BOLD, tam) + 2.5
                c.setFont(F_REG, tam)
                c.setFillColor(C(PALETA["suave"]))
                c.drawString(xx, top - 26, rot)
                xx += pdfmetrics.stringWidth(rot, F_REG, tam) + gap
            y = top - 56
            c.setFillColor(C("#111111"))
            c.setFont(F_BOLD, 8.6)
            c.drawString(14, y, limpar(self.nome, F_BOLD)[:60])
            y -= 12
            if self.cat:
                c.setFont(F_REG, 8)
                c.setFillColor(C(PALETA["suave"]))
                c.drawString(14, y, limpar(self.cat, F_REG))
            y -= 4
            self.p_bio.drawOn(c, 14, y - self.hb)
            y -= self.hb + 12
            if self.link:
                c.setFont(F_BOLD, 8.2)
                c.setFillColor(C("#00376B"))
                c.drawString(14, y, limpar(self.link, F_BOLD)[:48])

    class DestaquesMock(Flowable):
        def __init__(self, nomes):
            super().__init__()
            self.nomes = nomes

        def wrap(self, aw, ah):
            self.w = aw
            return aw, 70

        def draw(self):
            c = self.canv
            n = len(self.nomes)
            passo = min(78, self.w / max(n, 1))
            for i, nome in enumerate(self.nomes):
                cx = passo / 2 + i * passo
                c.setStrokeColor(C(PALETA["linha"]))
                c.setLineWidth(1.5)
                c.circle(cx, 42, 24, stroke=1, fill=0)
                c.setFillColor(C(misturar(DEST, "#FFFFFF", 0.15 + 0.12 * (i % 4))))
                c.circle(cx, 42, 20, stroke=0, fill=1)
                c.setFillColor(colors.white)
                c.setFont(F_TIT_B, 11)
                c.drawCentredString(cx, 38, limpar(nome[:1].upper(), F_TIT_B))
                c.setFillColor(C(PALETA["texto"]))
                c.setFont(F_MED, 7.4)
                c.drawCentredString(cx, 6, limpar(nome, F_MED)[:16])

    # ------------------------------------------------ dados
    modo = perfil.get("modo", "cliente")
    objetivo = objetivo_norm(perfil.get("objetivo"))
    geral, detalhes = nota_geral(rx, objetivo)
    data_rel = date.fromisoformat(rx.get("data_relatorio")) if rx.get("data_relatorio") else date.today()
    handle = perfil.get("perfil", "@perfil")
    prep = perfil.get("preparado_por") or {}
    posts = met.get("posts") or []
    por_id = {p["id"]: p for p in posts}
    res = met.get("resumo") or {}
    ins = met.get("insights") or {}
    base_alcance = met.get("base") == "alcance"

    # ------------------------------------------------ páginas
    W, H = A4
    ML, MR, MT, MB = 46, 46, 58, 52

    def cabecalho(c, doc, larg, alt):
        c.saveState()
        c.setFont(F_MED, 7.2)
        c.setFillColor(C(PALETA["suave"]))
        c.drawString(ML, alt - 32, limpar(f"Raio-X do Instagram  ·  {handle}", F_MED))
        c.drawRightString(larg - MR, alt - 32, limpar(data_longa(data_rel), F_MED))
        c.setStrokeColor(C(PALETA["linha"]))
        c.setLineWidth(0.8)
        c.line(ML, alt - 38, larg - MR, alt - 38)
        c.setFillColor(C(DEST))
        c.rect(ML, alt - 38.4, 26, 1.6, stroke=0, fill=1)
        rod = f"Preparado por {prep.get('nome')}" if prep.get("nome") else "Raio-X do Instagram"
        c.setFillColor(C(PALETA["suave"]))
        c.drawString(ML, 26, limpar(rod, F_MED))
        c.drawRightString(larg - MR, 26, f"{doc.page}")
        c.restoreState()

    def pag_retrato(c, doc):
        cabecalho(c, doc, W, H)

    def pag_paisagem(c, doc):
        cabecalho(c, doc, H, W)

    def pag_capa(c, doc):
        c.saveState()
        c.setFillColor(C(PALETA["tinta"]))
        c.rect(0, 0, W, H, stroke=0, fill=1)
        # grade decorativa (lembra o feed)
        tam, gap = 62, 9
        x0, y0 = W - 46 - 3 * tam - 2 * gap, H - 60 - 3 * tam - 2 * gap
        alfas = [0.10, 0.22, 0.14, 0.30, 0.55, 0.18, 0.12, 0.26, 0.40]
        for i in range(9):
            col, lin = i % 3, i // 3
            c.setFillColor(C(DEST), alpha=alfas[i])
            c.roundRect(x0 + col * (tam + gap), y0 + (2 - lin) * (tam + gap), tam, tam, 9, stroke=0, fill=1)
        c.setFillAlpha(1)
        t = c.beginText(46, H - 72)
        t.setFont(F_BOLD, 8.5)
        t.setCharSpace(2.2)
        t.setFillColor(C(DEST_CLARO))
        t.textOut("RAIO-X DO INSTAGRAM")
        t.setCharSpace(0)
        c.drawText(t)
        c.setFillColor(C("#B9B4CC"))
        c.setFont(F_REG, 9)
        c.drawString(46, H - 88, limpar(MODOS.get(modo, ""), F_REG))
        # título
        tam_t = 38
        while pdfmetrics.stringWidth(limpar(handle, F_TIT_B), F_TIT_B, tam_t) > W - 92 and tam_t > 18:
            tam_t -= 1
        c.setFillColor(colors.white)
        c.setFont(F_TIT_B, tam_t)
        c.drawString(46, 430, limpar(handle, F_TIT_B))
        c.setFont(F_REG, 13)
        c.setFillColor(C("#CFCBE0"))
        c.drawString(46, 404, limpar(SUBTITULO.get(modo, SUBTITULO_PADRAO), F_REG))
        c.setFillColor(C(DEST))
        c.rect(46, 384, 40, 3, stroke=0, fill=1)
        c.restoreState()
        # medidor e ficha
        m = Medidor(geral, d=150, fundo_escuro=True)
        m.canv = c
        c.saveState()
        c.translate(46, 170)
        m.draw()
        c.restoreState()
        c.saveState()
        c.setFont(F_BOLD, 8)
        c.setFillColor(C("#B9B4CC"))
        c.drawCentredString(46 + 75, 152, "NOTA GERAL")
        fic = [("Nicho", perfil.get("nicho", "")), ("Objetivo", OBJETIVOS[objetivo]),
               ("Dados", ("Insights e prints de " if base_alcance else "Dados públicos (prints) de ") + data_curta(met.get("data_prints"))),
               ("Posts analisados", str(len(posts)))]
        if perfil.get("cidade"):
            fic.insert(1, ("Cidade", perfil["cidade"]))
        y = 312
        for rot, val in fic:
            c.setFont(F_BOLD, 7.2)
            c.setFillColor(C(DEST_CLARO))
            c.drawString(236, y, limpar(rot.upper(), F_BOLD))
            c.setFont(F_REG, 9.6)
            c.setFillColor(colors.white)
            linhas = _quebrar(limpar(val, F_REG), F_REG, 9.6, W - 236 - 46)
            if len(linhas) > 3:
                linhas = linhas[:3]
                while linhas[2] and pdfmetrics.stringWidth(linhas[2] + "...", F_REG, 9.6) > W - 236 - 46:
                    linhas[2] = linhas[2].rsplit(" ", 1)[0] if " " in linhas[2] else linhas[2][:-1]
                linhas[2] = linhas[2].rstrip(",;: ") + "..."
            yy = y - 13
            for ln in linhas[:3]:
                c.drawString(236, yy, ln)
                yy -= 12
            y = yy - 10
        # rodapé
        c.setStrokeColor(C("#3A3550"))
        c.line(46, 92, W - 46, 92)
        c.setFont(F_BOLD, 9)
        c.setFillColor(colors.white)
        quem = prep.get("nome") or ""
        if prep.get("funcao"):
            quem += f"  ·  {prep['funcao']}"
        c.drawString(46, 72, limpar(("Preparado por " + quem) if quem else "Raio-X do Instagram", F_BOLD))
        c.setFont(F_REG, 8.5)
        c.setFillColor(C("#B9B4CC"))
        if prep.get("contato"):
            c.drawString(46, 58, limpar(prep["contato"], F_REG))
        c.drawRightString(W - 46, 72, limpar(data_longa(data_rel), F_REG))
        c.drawRightString(W - 46, 58, "Documento confidencial")
        c.restoreState()

    doc = BaseDocTemplate(str(saida), pagesize=A4, title=f"Raio-X do Instagram {handle}",
                          author=prep.get("nome") or "Raio-X do Instagram", subject="Diagnóstico de perfil do Instagram")
    fr = Frame(ML, MB, W - ML - MR, H - MT - MB, id="f", leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    frp = Frame(ML, 40, H - ML - MR, W - 50 - 40, id="fp", leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    frc = Frame(0, 0, W, H, id="fc")
    doc.addPageTemplates([
        PageTemplate(id="capa", frames=[frc], onPage=pag_capa, pagesize=A4),
        PageTemplate(id="retrato", frames=[fr], onPage=pag_retrato, pagesize=A4),
        PageTemplate(id="paisagem", frames=[frp], onPage=pag_paisagem, pagesize=landscape(A4)),
    ])
    LW = W - ML - MR
    ALTURA_UTIL = H - MT - MB

    story = [NextPageTemplate("retrato"), Spacer(1, 1), PageBreak()]
    secao = [0]

    def abrir(titulo, intro=None, nova_pagina=True):
        secao[0] += 1
        blocos = []
        if nova_pagina and secao[0] > 1:
            blocos.append(CondPageBreak(ALTURA_UTIL * 0.42))
        blocos += [Sobrelinha(f"{secao[0]:02d}  ·  {titulo}"), Spacer(1, 4), P(titulo, "h1")]
        if intro:
            blocos += [P(intro, "corpo_suave"), Spacer(1, 10)]
        else:
            blocos.append(Spacer(1, 6))
        return blocos

    def cartao(conteudo, fundo=PALETA["fundo"], pad=12, larg=None, borda=None, split=False):
        st = [("BACKGROUND", (0, 0), (-1, -1), C(fundo)),
              ("LEFTPADDING", (0, 0), (-1, -1), pad), ("RIGHTPADDING", (0, 0), (-1, -1), pad),
              ("TOPPADDING", (0, 0), (-1, -1), pad), ("BOTTOMPADDING", (0, 0), (-1, -1), pad),
              ("ROUNDEDCORNERS", [8, 8, 8, 8]), ("VALIGN", (0, 0), (-1, -1), "TOP")]
        if borda:
            st.append(("BOX", (0, 0), (-1, -1), 0.8, C(borda)))
        t = Table([[conteudo]], colWidths=[larg or LW], splitInRow=1 if split else 0)
        t.setStyle(TableStyle(st))
        if not split:
            _, alt = t.wrap(larg or LW, 10000)
            if alt > (H - MT - MB) * 0.9:  # maior que a página: deixa quebrar
                t = Table([[conteudo]], colWidths=[larg or LW], splitInRow=1)
                t.setStyle(TableStyle(st))
        return t

    def altura(fls):
        tot = 0
        for f in fls:
            if isinstance(f, (NextPageTemplate, PageBreak, CondPageBreak)):
                continue
            _, h_ = f.wrap(LW, ALTURA_UTIL)
            tot += h_ + f.getSpaceBefore() + f.getSpaceAfter()
        return tot

    # ------------------------------------------------ 1. resumo
    resumo = rx.get("resumo") or {}
    n_dat = res.get("n_posts_datados", res.get("n_posts"))
    texto_freq = (f"{n_dat} posts com data em {res.get('dias')} dias" if n_dat != res.get("n_posts") else
                  f"{n_dat} posts em {res.get('dias')} dias") if res.get("dias") else "faltam as datas dos posts"
    story += abrir("Resumo", "O retrato do perfil em uma página: onde ele está hoje, o que funciona e onde está a maior oportunidade.")
    if base_alcance and ins:
        blocos = [
            (br(met.get("seguidores"), 0), "Seguidores", f"Print de {data_curta(met.get('data_prints'))}"),
            (br(ins.get("contas_alcancadas"), 0), "Contas alcançadas", ins.get("periodo") or "período dos Insights"),
            ((br(ins.get("taxa_contas_engajadas"), 1, "%"), "Contas que engajaram", "contas com engajamento ÷ contas alcançadas")
             if ins.get("taxa_contas_engajadas") is not None else
             (br(res.get("mediana_principal"), 1, "%"), "Interação por alcance", "mediana de interações ÷ alcance dos posts")),
            (br(res.get("posts_semana"), 1), "Posts por semana", texto_freq),
        ]
        if ins.get("toques_por_visita") is not None:
            blocos.append((br(ins.get("toques_por_visita"), 1, "%"), "Visitas que clicam no link", "toques no link ÷ visitas ao perfil"))
    else:
        if base_alcance:
            tile2 = (br(res.get("mediana_principal"), 1, "%"), "Interação por alcance", "mediana de interações ÷ alcance dos posts")
        else:
            tile2 = (br(res.get("mediana_principal"), 2, "%"), "Interação pública", "mediana de (curtidas + comentários) ÷ seguidores; estimativa")
        blocos = [
            (br(met.get("seguidores"), 0), "Seguidores", f"Print de {data_curta(met.get('data_prints'))}"),
            tile2,
            (br(res.get("posts_semana"), 1), "Posts por semana", texto_freq),
            (br(res.get("pct_sem_cta"), 0, "%"), "Posts sem chamada", "posts sem CTA ÷ posts analisados"),
        ]
    story += [Blocos(blocos), Spacer(1, 16)]

    esquerda = [Medidor(geral, d=104), Spacer(1, 6),
                P(f"**{faixa(round(geral))[0] if geral is not None else 'Sem dados'}**", est("c1", alignment=TA_CENTER, fontSize=9)),
                P("nota geral", est("c2", alignment=TA_CENTER, fontSize=7.5, textColor=C(PALETA["suave"])))]
    direita = [P("Notas por área", "h3"), Spacer(1, 6),
               BarrasNotas([(t, n, w) for _, t, n, w in detalhes]),
               Spacer(1, 4),
               P(f"A nota geral é a média das áreas com peso pelo objetivo **{OBJETIVOS[objetivo].lower()}** (o número à direita de cada barra é o peso).", "peq_suave")]
    t = Table([[esquerda, direita]], colWidths=[126, LW - 126])
    t.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0),
                           ("RIGHTPADDING", (0, 0), (-1, -1), 0), ("ALIGN", (0, 0), (0, 0), "CENTER")]))
    story += [t, Spacer(1, 16)]
    def bloco_diagnostico(esc):
        """Diagnóstico + cartões. esc < 1 diminui a letra para caber na página do resumo."""
        lead = est("lead_d", fontSize=11 * esc, leading=16.5 * esc, textColor=C(PALETA["texto"]))
        fortes = [P("O que já funciona", "h3"), Spacer(1, 4)] + \
                 [marcador(x, 8.2 * max(esc, 0.92), 11.4 * max(esc, 0.92)) for x in resumo.get("pontos_fortes", [])]
        oport = [P("Maior oportunidade", est("h3b", fontName=F_BOLD, fontSize=10, leading=13, textColor=colors.white)), Spacer(1, 4),
                 P(resumo.get("maior_oportunidade", ""), est("op", fontSize=8.6 * max(esc, 0.92), leading=12 * max(esc, 0.92),
                                                           textColor=colors.white))]
        tt = Table([[cartao(fortes, larg=LW / 2 - 5), cartao(oport, fundo=DEST, larg=LW / 2 - 5)]], colWidths=[LW / 2, LW / 2])
        tt.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0),
                                ("RIGHTPADDING", (0, 0), (0, 0), 5), ("LEFTPADDING", (1, 0), (1, 0), 5),
                                ("RIGHTPADDING", (1, 0), (1, 0), 0)]))
        return [P("Diagnóstico", "h2"), P(resumo.get("diagnostico", ""), lead), Spacer(1, 10 * esc), tt]

    # Diagnóstico longo: diminui um pouco a letra para os cartões não ficarem sozinhos na página seguinte.
    sobra = ALTURA_UTIL - altura(story[3:]) - 6
    escolhido = bloco_diagnostico(1)
    for esc in (1, 0.95, 0.9, 0.86):
        b = bloco_diagnostico(esc)
        if altura(b) <= sobra:
            escolhido = b
            break
    story += escolhido

    # ------------------------------------------------ 2. cinco problemas
    story += abrir("Os 5 problemas que mais custam",
                   "Em ordem de impacto no objetivo. Cada um vem com a evidência que vimos e a correção passo a passo.")
    for i, p in enumerate(rx.get("problemas") or [], 1):
        corr = p["correcao"] if isinstance(p["correcao"], list) else [p["correcao"]]
        miolo = [P(p["titulo"], est("pt", fontName=F_TIT, fontSize=11.5, leading=15, textColor=C(PALETA["tinta"]))), Spacer(1, 5),
                 P(f"**O que vimos.** {p['evidencia']}", "peq"), Spacer(1, 3),
                 P(f"**Por que custa.** {p['por_que_custa']}", "peq"), Spacer(1, 5),
                 P("**Como corrigir**", "peq")]
        for k, passo in enumerate(corr, 1):
            miolo.append(P(f"{k}.  {passo}", est("passo", fontSize=8, leading=11, leftIndent=10, firstLineIndent=-10)))
        if p.get("esforco"):
            miolo += [Spacer(1, 5), Etiqueta(f"Esforço: {p['esforco']}", DEST_CLARO, DEST_ESCURO)]
        num = Paragraph(f'<font name="{F_TIT_B}" size="24" color="{DEST}">{i}</font>', est("n", leading=20))
        linha = Table([[num, miolo]], colWidths=[34, LW - 34 - 24])
        linha.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0),
                                   ("RIGHTPADDING", (0, 0), (-1, -1), 0), ("TOPPADDING", (0, 0), (-1, -1), 0)]))
        story += [cartao([linha]), Spacer(1, 8)]

    # ------------------------------------------------ 3. áreas
    story += abrir("Diagnóstico por área",
                   "Cada área recebe uma nota de 0 a 10 pelo critério descrito no cartão. A nota diz por quê; o cartão termina com o que fazer.")
    areas = rx.get("areas") or {}
    for aid, titulo, criterio in AREAS:
        a = areas.get(aid) or {}
        miolo = [P(titulo, est("at", fontName=F_TIT, fontSize=12, leading=15, textColor=C(PALETA["tinta"]))),
                 P(f"Critério: {criterio}", "peq_suave"), Spacer(1, 6),
                 P(f"**O que vimos.** {a.get('o_que_vimos', '')}", "peq"), Spacer(1, 3),
                 P(f"**Por que essa nota.** {a.get('por_que', '')}", "peq"), Spacer(1, 3),
                 P(f"**O que fazer.** {a.get('o_que_fazer', '')}", "peq")]
        linha = Table([[Selo(a.get("nota")), miolo]], colWidths=[48, LW - 48 - 24])
        linha.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0),
                                   ("RIGHTPADDING", (0, 0), (-1, -1), 0), ("TOPPADDING", (0, 0), (-1, -1), 0)]))
        story += [cartao([linha], fundo=PALETA["branco"], borda=PALETA["linha"]), Spacer(1, 7)]

    # ------------------------------------------------ 4. números
    eng = rx.get("engajamento") or {}
    story += abrir("Os números do perfil",
                   "Todas as taxas têm fórmula declarada e comparam o perfil com ele mesmo. Não usamos média de mercado: ela não existe de forma confiável e muda com nicho, tamanho e época.")
    formulas = met.get("formulas") or {}
    if base_alcance:
        linhas_f = [formulas.get("interacoes"), formulas.get("taxa_alcance"), formulas.get("util_alcance"), formulas.get("indice")]
    else:
        linhas_f = [formulas.get("taxa_seguidores"), formulas.get("indice")]
    if any(p.get("retencao_pct") is not None for p in posts):
        linhas_f.append(formulas.get("retencao"))
    story += [cartao([P("Como calculamos", "h3"), Spacer(1, 3)] + [marcador(x, 8, 11) for x in linhas_f if x],
                     fundo=DEST_CLARO), Spacer(1, 12)]

    cab = ["ID", "Data", "Formato", "Tema"]
    if base_alcance:
        cab += ["Alcance", "Interações", "Interações / alcance", "Salv. + comp. / alcance", "Índice"]
    else:
        cab += ["Curtidas", "Coment.", "(Curt.+com.)/seg.", "Índice"]
    dados = [[P(x, "cab") for x in cab]]
    for p in posts:
        idx = p.get("indice_mediana")
        seta, cor_idx = ("", PALETA["suave"])
        if p.get("classe") == "acima":
            seta, cor_idx = "▲ ", PALETA["bom"]
        elif p.get("classe") == "abaixo":
            seta, cor_idx = "▼ ", PALETA["critico"]
        idx_txt = f'<font color="{cor_idx}">{escape(limpar(seta, F_BOLD))}{br(idx, 2)}x</font>' if idx is not None else "–"
        linha = [P(p["id"], "celula_b"), P(data_curta(p.get("data")), "celula"), P(p["formato"], "celula"), P(p.get("tema", ""), "celula")]
        if base_alcance:
            linha += [P(br(p.get("alcance"), 0), "celula"), P(br(p.get("interacoes"), 0), "celula"),
                      P(br(p.get("taxa_alcance"), 1, "%"), "celula"), P(br(p.get("util_alcance"), 1, "%"), "celula")]
        else:
            linha += [P(br(p.get("curtidas"), 0), "celula"), P(br(p.get("comentarios"), 0), "celula"),
                      P(br(p.get("taxa_seguidores"), 2, "%"), "celula")]
        linha.append(Paragraph(f'<font name="{F_BOLD}">{idx_txt}</font>', S["celula"]))
        dados.append(linha)
    if base_alcance:
        larguras = [26, 34, 50, LW - 26 - 34 - 50 - 44 - 50 - 58 - 64 - 44, 44, 50, 58, 64, 44]
    else:
        larguras = [26, 34, 50, LW - 26 - 34 - 50 - 50 - 46 - 74 - 50, 50, 46, 74, 50]
    nomes_campo = {"curtidas": "curtidas", "comentarios": "comentários", "compartilhamentos": "compartilhamentos", "salvamentos": "salvamentos"}
    faltas = []
    for p in posts:
        if p.get("campos_faltando") and any(p.get(c) is not None for c in nomes_campo):
            faltas.append(f"{p['id']} sem {', '.join(nomes_campo.get(c, c) for c in p['campos_faltando'])}")
        elif not p.get("alcance") and not any(p.get(c) is not None for c in nomes_campo) and base_alcance:
            faltas.append(f"{p['id']} sem números legíveis")
    nota_faltas = (" Sem taxa (–): " + "; ".join(faltas) + ". Número oculto ou ilegível no print; o post fica fora da mediana e do ranking "
                   "para não parecer pior do que foi.") if faltas else ""
    tb = Table(dados, colWidths=larguras, repeatRows=1)
    st = [("BACKGROUND", (0, 0), (-1, 0), C(PALETA["tinta"])), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
          ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
          ("LEFTPADDING", (0, 0), (-1, -1), 4), ("RIGHTPADDING", (0, 0), (-1, -1), 4),
          ("LINEBELOW", (0, 1), (-1, -1), 0.5, C(PALETA["linha"])), ("ROUNDEDCORNERS", [6, 6, 0, 0])]
    for k in range(1, len(dados)):
        if k % 2 == 0:
            st.append(("BACKGROUND", (0, k), (-1, k), C("#FAF9FD")))
    tb.setStyle(TableStyle(st))
    story += [tb, Spacer(1, 4),
              P(f"Mediana do perfil na métrica principal ({met.get('nome_metrica')}): **{br(res.get('mediana_principal'), 2, '%' if met.get('metrica') not in ('alcance', 'views_por_seguidor') else '')}**. "
                "▲ = 1,2x a mediana ou mais; ▼ = 0,8x ou menos." + nota_faltas, "peq_suave"), Spacer(1, 14)]

    # por formato
    fmts = met.get("formatos") or []
    graf1 = BarrasSimples([(g["formato"], g.get("mediana_principal") or 0,
                            br(g.get("mediana_principal"), 1, "%" if met.get("metrica") != "alcance" else "")) for g in fmts])
    graf2 = BarrasSimples([(g["formato"], g.get("mediana_alcance") or 0, br(g.get("mediana_alcance"), 0)) for g in fmts]) if base_alcance else \
        BarrasSimples([(g["formato"], g["n"], f"{g['n']} posts") for g in fmts])
    mix = ", ".join(f"{g['formato']} {br(g['pct'], 0, '%')}" for g in fmts)
    col1 = [P("Mediana da métrica por formato", "h3"), Spacer(1, 6), graf1]
    col2 = [P("Mediana de alcance por formato" if base_alcance else "Posts por formato", "h3"), Spacer(1, 6), graf2]
    t = Table([[col1, col2]], colWidths=[LW / 2, LW / 2])
    t.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0),
                           ("RIGHTPADDING", (0, 0), (0, 0), 14), ("RIGHTPADDING", (1, 0), (1, 0), 0)]))
    story += [KeepTogether([t, Spacer(1, 4), P(f"Mix dos posts analisados: {mix}.", "peq_suave")]), Spacer(1, 14)]

    def lista_posts(ids, titulo, cor):
        itens = [P(titulo, est("lt", fontName=F_BOLD, fontSize=9.5, leading=12, textColor=C(cor))), Spacer(1, 4)]
        for i in ids:
            p = por_id.get(i)
            if not p:
                continue
            val = p.get("principal")
            suf = "%" if met.get("metrica") not in ("alcance", "views_por_seguidor") else ""
            itens.append(P(f"**{p['id']} · {p['formato']}** · {p.get('tema', '')} ({br(val, 1, suf)})", "peq"))
            itens.append(Spacer(1, 2))
        return itens

    t = Table([[cartao(lista_posts(met.get("top", []), "Os que mais funcionaram", PALETA["bom"]), larg=LW / 2 - 5),
                cartao(lista_posts(met.get("bottom", []), "Os que menos funcionaram", PALETA["critico"]), larg=LW / 2 - 5)]],
              colWidths=[LW / 2, LW / 2])
    t.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0),
                           ("RIGHTPADDING", (0, 0), (0, 0), 5), ("LEFTPADDING", (1, 0), (1, 0), 5), ("RIGHTPADDING", (1, 0), (1, 0), 0)]))
    story += [KeepTogether([t]), Spacer(1, 10)]
    if eng.get("padrao_melhores"):
        story += [P("**O padrão dos melhores.** " + eng["padrao_melhores"], "corpo"), Spacer(1, 5)]
    if eng.get("padrao_piores"):
        story += [P("**O padrão dos piores.** " + eng["padrao_piores"], "corpo"), Spacer(1, 5)]
    if eng.get("leitura"):
        story += [P("**Leitura geral.** " + eng["leitura"], "corpo"), Spacer(1, 5)]
    if base_alcance and ins:
        ind = []
        if ins.get("pct_nao_seguidores") is not None:
            ind.append(("Visualizações de não seguidores", br(ins["pct_nao_seguidores"], 1, "%"), "conforme o print dos Insights"))
        if ins.get("alcance_por_seguidor") is not None:
            ind.append(("Alcance por seguidor", br(ins["alcance_por_seguidor"], 2), "contas alcançadas ÷ seguidores"))
        if ins.get("seguidores_por_visita") is not None:
            ind.append(("Visitas que viram seguidor", br(ins["seguidores_por_visita"], 1, "%"), "novos seguidores ÷ visitas ao perfil"))
        if ins.get("toques_por_visita") is not None:
            ind.append(("Visitas que tocam no link", br(ins["toques_por_visita"], 1, "%"), "toques no link ÷ visitas ao perfil"))
        if ind:
            story += [Spacer(1, 6), CondPageBreak(90), P(f"Indicadores do perfil · {ins.get('periodo', '')}", "h3"), Spacer(1, 6),
                      Blocos([(v, r_, f) for r_, v, f in ind], altura=68)]

    # ------------------------------------------------ 5. concorrentes
    comp = met.get("comparacao") or []
    rcomp = rx.get("concorrentes") or {}
    if comp or rcomp.get("leitura"):
        story += abrir("Comparação com concorrentes",
                       "Mesma conta para todos, só com o que é público. Serve para achar moldes a adaptar, não para copiar conteúdo.")
        if comp:
            conc_perfil = {c.get("perfil"): c for c in (perfil.get("concorrentes") or [])}
            com_curtidas = any(c.get("n_posts_com_curtidas") for c in comp if not c.get("principal"))
            com_views = any(c.get("n_reels_com_views") for c in comp)
            colunas = ["Perfil", "Seguidores"]
            maior_at = max(pdfmetrics.stringWidth(limpar(c.get("perfil") or "", F_BOLD), F_BOLD, 7.6) for c in comp)
            larg_c = [min(190, max(112, maior_at + 14)), 58]
            if com_views:
                colunas.append("Views por seguidor (Reels, mediana)")
                larg_c.append(100)
            if com_curtidas:
                colunas.append("(Curt. + com.) ÷ seguidores (mediana)")
                larg_c.append(100)
            colunas.append("Destaques")
            larg_c.append(LW - sum(larg_c))

            def nomes_dest(lista):
                return ", ".join((limpar(x, F_REG) or "(só emoji)") for x in lista)

            dados = [[P(x, "cab") for x in colunas]]
            for c in comp:
                extra = conc_perfil.get(c["perfil"], {})
                dest = nomes_dest(extra.get("destaques", [])) if not c.get("principal") else nomes_dest(perfil.get("destaques_atuais", []))
                linha_c = [P(("**" + c["perfil"] + "**") + (" (analisado)" if c.get("principal") else ""), "celula"),
                           P(br(c.get("seguidores"), 0), "celula")]
                if com_views:
                    linha_c.append(P(f"{br(c.get('mediana_views_por_seguidor'), 2)} ({c.get('n_reels_com_views', 0)} Reels)", "celula"))
                if com_curtidas:
                    linha_c.append(P(f"{br(c.get('mediana_taxa_seguidores'), 2, '%')} ({c.get('n_posts_com_curtidas', 0)} posts)" if c.get("n_posts_com_curtidas") else "sem dado público", "celula"))
                linha_c.append(P(dest or "–", "celula"))
                dados.append(linha_c)
            tb = Table(dados, colWidths=larg_c, repeatRows=1)
            st = [("BACKGROUND", (0, 0), (-1, 0), C(PALETA["tinta"])), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                  ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                  ("LINEBELOW", (0, 1), (-1, -1), 0.5, C(PALETA["linha"])), ("ROUNDEDCORNERS", [6, 6, 0, 0]),
                  ("BACKGROUND", (0, 1), (-1, 1), C(DEST_CLARO))]
            tb.setStyle(TableStyle(st))
            story += [tb, Spacer(1, 4), P(formulas.get("views_por_seguidor", ""), "peq_suave"), Spacer(1, 12)]
        if rcomp.get("leitura"):
            story += [P(rcomp["leitura"], "corpo"), Spacer(1, 10)]
        if rcomp.get("modelar"):
            itens = [P("O que modelar (o molde, não o conteúdo)", "h3"), Spacer(1, 4)] + \
                    [marcador(x, 8.6, 12) for x in rcomp["modelar"]]
            story.append(cartao(itens, fundo=DEST_CLARO))

    # ------------------------------------------------ 6. bio e destaques
    story += abrir("Bio, nome e destaques",
                   "Três versões de bio no formato do curso: assunto, como ajuda e próximo passo. Escolha uma, publique e meça por 2 semanas antes de trocar.")
    if rx.get("nome_sugerido"):
        story += [cartao([P("**Nome pesquisável sugerido:** " + rx["nome_sugerido"], "corpo"),
                          P("O campo Nome aparece na busca do Instagram. Coloque a palavra que o cliente digitaria (serviço e, se for local, cidade ou bairro).", "peq_suave")],
                         fundo=DEST_CLARO), Spacer(1, 10)]
    nome_mock = rx.get("nome_sugerido") or perfil.get("nome_exibido") or handle
    for i, b in enumerate(rx.get("bios") or [], 1):
        mock = PerfilMock(handle, nome_mock, perfil.get("categoria", ""), b.get("texto", ""), rx.get("link_sugerido") or "", largura=240,
                          iniciais_de=perfil.get("nome_exibido") or handle.lstrip("@"),
                          numeros={k: perfil.get(k) for k in ("publicacoes", "seguidores", "seguindo")})
        n_car = len(b.get("texto", ""))
        expl = [P(f"Versão {i}", est("vt", fontName=F_TIT, fontSize=12, leading=15, textColor=C(PALETA["tinta"]))), Spacer(1, 4),
                P(f"**Prioriza:** {b.get('prioriza', '')}", "peq"), Spacer(1, 6),
                Etiqueta(f"{n_car}/{LIMITE_BIO} caracteres", PALETA["bom"] if n_car <= LIMITE_BIO else PALETA["critico"])]
        if b.get("observacao"):
            expl += [Spacer(1, 6), P(b["observacao"], "peq_suave")]
        t = Table([[mock, expl]], colWidths=[252, LW - 252])
        t.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0),
                               ("LEFTPADDING", (1, 0), (1, 0), 12)]))
        story += [KeepTogether([t]), Spacer(1, 12)]
    if rx.get("link_sugerido_explicacao"):
        story += [P("**Link:** " + rx["link_sugerido_explicacao"], "corpo"), Spacer(1, 10)]
    dest = rx.get("destaques") or []
    if dest:
        bloco = [CondPageBreak(200), P("Destaques sugeridos", "h2"), Spacer(1, 4), DestaquesMock([d.get("nome", "") for d in dest]), Spacer(1, 8)]
        dados = [[P(x, "cab") for x in ["Destaque", "Capa", "O que colocar"]]]
        for d in dest:
            dados.append([P("**" + d.get("nome", "") + "**", "celula"), P(d.get("capa", ""), "celula"), P(d.get("conteudo", ""), "celula")])
        tb = Table(dados, colWidths=[80, 120, LW - 200], repeatRows=1)
        tb.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), C(PALETA["tinta"])), ("VALIGN", (0, 0), (-1, -1), "TOP"),
                                ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                                ("LINEBELOW", (0, 1), (-1, -1), 0.5, C(PALETA["linha"])), ("ROUNDEDCORNERS", [6, 6, 0, 0])]))
        bloco.append(tb)
        story += bloco
    if rx.get("posts_fixados"):
        story += [Spacer(1, 12), CondPageBreak(90), P("Posts fixados (até 3)", "h2")] + \
                 [P(f"{k}.  {x}", est("fx", fontSize=8.8, leading=12.5, leftIndent=12, firstLineIndent=-12)) for k, x in enumerate(rx["posts_fixados"], 1)]

    # ------------------------------------------------ 7. calendário (paisagem)
    plano = rx.get("plano_30_dias") or {}
    d0 = datas_plano(rx, data_rel)
    story += [NextPageTemplate("paisagem"), PageBreak()]
    secao[0] += 1
    LWp = H - ML - MR
    story += [Sobrelinha(f"{secao[0]:02d}  ·  Plano de 30 dias"), Spacer(1, 2),
              P(f"Plano de 30 dias · {d0.strftime('%d/%m')} a {(d0 + timedelta(days=29)).strftime('%d/%m/%Y')}",
                est("h1p", fontName=F_TIT_B, fontSize=18, leading=22, textColor=C(PALETA["tinta"])))]
    if plano.get("rotina"):
        story += [P(plano["rotina"], est("rot", fontSize=7.6, leading=10, textColor=C(PALETA["suave"])))]
    story.append(Spacer(1, 6))
    story += [Linha([Etiqueta(f, COR_FORMATO[f], tam=6.6) for f in FORMATOS_PLANO], gap=6), Spacer(1, 6)]
    dias = {int(d.get("dia", i + 1)): d for i, d in enumerate(plano.get("dias") or [])}
    offset = d0.weekday()
    total_celulas = offset + 30
    semanas = (total_celulas + 6) // 7
    cw = LWp / 7
    grade = [[P(x, est("wd", fontName=F_BOLD, fontSize=7.6, textColor=colors.white, alignment=TA_CENTER)) for x in DIAS_SEMANA]]
    fundos = []
    for s in range(semanas):
        linha = []
        for wd in range(7):
            k = s * 7 + wd - offset + 1
            if 1 <= k <= 30:
                dd = d0 + timedelta(days=k - 1)
                it = dias.get(k, {})
                fmt = it.get("formato", "Descanso")
                cel = [PR(f"<b>{dd.day:02d}/{dd.month:02d}</b>  <font color='{PALETA['suave']}'>dia {k}</font>", "mini"), Spacer(1, 2),
                       Etiqueta(fmt, COR_FORMATO.get(fmt, PALETA["suave"]), tam=6.2), Spacer(1, 2),
                       P(it.get("pauta", ""), "mini")]
                linha.append(cel)
            else:
                linha.append("")
                fundos.append(("BACKGROUND", (wd, s + 1), (wd, s + 1), C("#F4F3F7")))
        grade.append(linha)
    tb = Table(grade, colWidths=[cw] * 7, repeatRows=1)
    tb.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), C(PALETA["tinta"])), ("VALIGN", (0, 0), (-1, -1), "TOP"),
                            ("GRID", (0, 1), (-1, -1), 0.6, C(PALETA["linha"])), ("BOX", (0, 0), (-1, -1), 0.6, C(PALETA["linha"])),
                            ("TOPPADDING", (0, 1), (-1, -1), 3), ("BOTTOMPADDING", (0, 1), (-1, -1), 4),
                            ("TOPPADDING", (0, 0), (-1, 0), 4), ("BOTTOMPADDING", (0, 0), (-1, 0), 4),
                            ("LEFTPADDING", (0, 0), (-1, -1), 4), ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                            ("ROUNDEDCORNERS", [6, 6, 6, 6])] + fundos))
    story.append(tb)
    story += [NextPageTemplate("retrato"), PageBreak()]

    # ------------------------------------------------ 8. ideias
    story += abrir("15 ideias de conteúdo com gancho",
                   "Pautas que nascem das perguntas e dores do público do perfil. O gancho é a primeira frase ou o texto da capa.", nova_pagina=False)
    dados = [[P(x, "cab") for x in ["#", "Pauta", "Gancho (primeira frase ou capa)", "Formato", "Pilar"]]]
    for i, d in enumerate(rx.get("ideias") or [], 1):
        fmt = d.get("formato", "")
        g = d.get("gancho", "")
        g = g if g[:1] in "\"'“‘" else f"“{g}”"
        dados.append([P(f"**{i:02d}**", "celula"), P(d.get("pauta", ""), "celula"), P(g, "celula"),
                      Etiqueta(fmt, COR_FORMATO.get(fmt, PALETA["suave"]), tam=6.2) if fmt else P("", "celula"),
                      P(d.get("pilar", ""), "celula")])
    tb = Table(dados, colWidths=[26, 150, LW - 26 - 150 - 62 - 82, 62, 82], repeatRows=1)
    st = [("BACKGROUND", (0, 0), (-1, 0), C(PALETA["tinta"])), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
          ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
          ("LINEBELOW", (0, 1), (-1, -1), 0.5, C(PALETA["linha"])), ("ROUNDEDCORNERS", [6, 6, 0, 0])]
    for k in range(1, len(dados)):
        if k % 2 == 0:
            st.append(("BACKGROUND", (0, k), (-1, k), C("#FAF9FD")))
    tb.setStyle(TableStyle(st))
    story.append(tb)

    # ------------------------------------------------ 9. roteiros
    story += abrir("3 roteiros de Reels no GPEC",
                   "Gancho, Promessa, Entrega e CTA (método do curso Ruptura Viral IA). Gancho nos 3 primeiros segundos, entrega cedo e uma única chamada no fim. Leia em voz alta antes de gravar.")
    cores_etapa = {"g": DEST, "p": misturar(DEST, "#FFFFFF", 0.3), "e": PALETA["tinta"], "c": PALETA["bom"]}
    for i, r in enumerate(rx.get("roteiros") or [], 1):
        tchips = Linha([Etiqueta(x, DEST_CLARO, DEST_ESCURO, tam=6.6) for x in [r.get("formato"), r.get("duracao"), r.get("objetivo")] if x])
        cab_r = [P(f"Roteiro {i} · {r.get('titulo', '')}", est("rt", fontName=F_TIT, fontSize=12.5, leading=16, textColor=C(PALETA["tinta"]))),
                 Spacer(1, 4), tchips, Spacer(1, 6)]
        dados = [[P(x, "cab") for x in ["Etapa", "Fala", "Ação visual", "Texto na tela"]]]
        estilo_extra = []
        for k, b in enumerate(r.get("blocos") or [], 1):
            et = (b.get("etapa") or "")
            cor = cores_etapa.get(et.lower()[:1], DEST)
            dados.append([PR(f"<font color='{cor}'><b>{T(et, F_BOLD)}</b></font><br/>{T(b.get('tempo', ''))}", "celula"),
                          P(b.get("fala", "") if (b.get("fala", "")[:1] in "\"'“‘") else f"“{b.get('fala', '')}”", "celula"),
                          P(b.get("visual", ""), "celula"), P(b.get("texto_tela", "") or "–", "celula")])
            estilo_extra.append(("LINEBEFORE", (0, k), (0, k), 3, C(cor)))
        tb = Table(dados, colWidths=[58, (LW - 58) * 0.42, (LW - 58) * 0.33, (LW - 58) * 0.25], repeatRows=1)
        tb.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), C(PALETA["tinta"])), ("VALIGN", (0, 0), (-1, -1), "TOP"),
                                ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                                ("LINEBELOW", (0, 1), (-1, -1), 0.5, C(PALETA["linha"])), ("ROUNDEDCORNERS", [6, 6, 0, 0])] + estilo_extra))
        fim = []
        if r.get("legenda"):
            fim += [Spacer(1, 5), P(f"**Legenda:** {r['legenda']}", "peq")]
        if r.get("por_que_funciona"):
            fim += [Spacer(1, 3), P(f"**Por que esse molde:** {r['por_que_funciona']}", "peq_suave")]
        story += [KeepTogether(cab_r + [tb] + fim), Spacer(1, 16)]

    # ------------------------------------------------ 10. próximos passos
    story += abrir("Como medir daqui para frente",
                   "O plano só vale se for medido do mesmo jeito. Use a ficha abaixo e revise o perfil em 30 dias com novos prints.")
    for x in rx.get("proximos_passos") or []:
        story += [marcador(x, 9, 13), Spacer(1, 2)]
    story += [Spacer(1, 10), P("Ficha de acompanhamento (7 dias depois de cada post)", "h3"), Spacer(1, 5)]
    cab_f = ["Peça", "Data", "Função", "Alcance", "Salv. + comp.", "Taxa (÷ alcance)", "Direct / link", "Decisão"]
    ficha = [[P(x, "cab") for x in cab_f]] + [[""] * len(cab_f) for _ in range(6)]
    tb = Table(ficha, colWidths=[LW * w for w in (0.19, 0.08, 0.12, 0.1, 0.11, 0.12, 0.11, 0.17)], rowHeights=[None] + [20] * 6)
    tb.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), C(PALETA["tinta"])), ("GRID", (0, 1), (-1, -1), 0.5, C(PALETA["linha"])),
                            ("ROUNDEDCORNERS", [6, 6, 0, 0])]))
    story += [tb, Spacer(1, 16)]
    sobre = [P("Sobre este diagnóstico", "h3"), Spacer(1, 4)]
    fonte_txt = ("Números transcritos dos prints e dos Insights enviados em " if base_alcance else "Números públicos transcritos dos prints enviados em ") + \
        data_curta(met.get("data_prints")) + f". Foram analisados {len(posts)} posts" + \
        (f" publicados entre {data_curta(res.get('periodo_inicio'))} e {data_curta(res.get('periodo_fim'))}." if res.get("periodo_inicio") else ".")
    sobre += [P(fonte_txt, "peq")]
    if not base_alcance:
        sobre += [P("Sem acesso aos Insights, as taxas são estimativas por seguidores. Com os Insights do dono do perfil, a auditoria mede por alcance, que é a conta certa.", "peq")]
    sobre += [P("As notas seguem critérios explícitos e comparam o perfil com ele mesmo; não usam média de mercado. Nomes de métricas e recursos do Instagram mudam: realidade de setembro de 2026, confira no app.", "peq"),
              P("Pontos marcados [CONFIRMAR] dependem de informação do dono do perfil antes de publicar.", "peq")]
    if met.get("avisos"):
        sobre += [P("Observações das contas: " + " ".join(met["avisos"]), "peq_suave")]
    story.append(cartao(sobre))
    if prep.get("nome"):
        story += [Spacer(1, 18), P(f"Preparado por **{prep.get('nome')}**" + (f" · {prep.get('funcao')}" if prep.get("funcao") else "") +
                                   (f" · {prep.get('contato')}" if prep.get("contato") else ""), est("assin", fontSize=9, textColor=C(PALETA["suave"])))]
    doc.build(story)
    return geral


# ---------------------------------------------------------------- HTML (plano B)
def gerar_html(perfil, met, rx, saida: Path, cor_destaque):
    e = lambda s: htmlmod.escape(str(s or ""))

    def mk(s):
        s = e(s)
        s = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s)
        s = re.sub(r"\[CONFIRMAR([^\]]*)\]", r'<mark>[CONFIRMAR\1]</mark>', s)
        return s.replace("\n", "<br>")

    modo = perfil.get("modo", "cliente")
    objetivo = objetivo_norm(perfil.get("objetivo"))
    geral, detalhes = nota_geral(rx, objetivo)
    data_rel = date.fromisoformat(rx.get("data_relatorio")) if rx.get("data_relatorio") else date.today()
    handle = perfil.get("perfil", "@perfil")
    prep = perfil.get("preparado_por") or {}
    posts = met.get("posts") or []
    res = met.get("resumo") or {}
    base_alcance = met.get("base") == "alcance"
    d0 = datas_plano(rx, data_rel)
    cf = dict(COR_FORMATO, Reels=cor_destaque)
    h = []
    h.append(f"""<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Raio-X do Instagram {e(handle)}</title><style>
:root{{--d:{cor_destaque};--t:{PALETA['tinta']};--x:{PALETA['texto']};--s:{PALETA['suave']};--l:{PALETA['linha']};--f:{PALETA['fundo']}}}
*{{box-sizing:border-box}} body{{margin:0;background:#fff;color:var(--x);font:15px/1.55 Inter,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}}
.pg{{max-width:860px;margin:0 auto;padding:40px 28px}} h1{{font-size:28px;line-height:1.2;color:var(--t);margin:.2em 0 .3em}}
h2{{font-size:19px;color:var(--t);margin:1.4em 0 .4em}} h3{{font-size:15px;color:var(--t);margin:.2em 0}}
.over{{font-size:11px;font-weight:700;letter-spacing:.14em;color:var(--d);text-transform:uppercase;margin-top:42px}}
.intro{{color:var(--s)}} .capa{{background:var(--t);color:#fff;border-radius:18px;padding:44px 36px;margin-bottom:24px}}
.capa h1{{color:#fff;font-size:40px;margin:.3em 0 .1em}} .capa .sub{{color:#CFCBE0}} .nota{{font-size:64px;font-weight:800;line-height:1}}
.card{{background:var(--f);border-radius:12px;padding:16px 18px;margin:10px 0}} .bor{{background:#fff;border:1px solid var(--l)}}
.selo{{display:inline-block;min-width:44px;text-align:center;color:#fff;border-radius:22px;padding:4px 10px;font-weight:800;margin-right:8px}}
.crit{{color:var(--s);font-size:13px}} table{{border-collapse:collapse;width:100%;font-size:13px}} th{{background:var(--t);color:#fff;text-align:left;padding:6px}}
td{{border-bottom:1px solid var(--l);padding:6px;vertical-align:top}} .pill{{display:inline-block;color:#fff;border-radius:10px;padding:1px 8px;font-size:11px;font-weight:700}}
.cal{{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}} .cel{{border:1px solid var(--l);border-radius:8px;padding:6px;font-size:11.5px;min-height:92px}}
.vazio{{background:#F4F3F7;border-color:#F4F3F7}} .wd{{background:var(--t);color:#fff;text-align:center;border-radius:6px;font-size:12px;font-weight:700;padding:4px}}
.bio{{border:1px solid var(--l);border-radius:12px;padding:14px;max-width:340px;white-space:pre-line}} mark{{background:#FFE9B8;color:#7A4E00}}
.tw{{overflow-x:auto;-webkit-overflow-scrolling:touch;margin:10px 0}} .tw table{{min-width:560px}}
.bar{{height:9px;border-radius:5px;background:var(--l);position:relative}} .bar i{{position:absolute;left:0;top:0;bottom:0;border-radius:5px}}
@media (max-width:640px){{.cal{{grid-template-columns:1fr}} .vazio,.wd{{display:none}} .capa h1{{font-size:28px}}}}
@page{{size:A4;margin:14mm}} @media print{{.over{{break-before:page}} .card,.cel,tr{{break-inside:avoid}}}}
</style></head><body><div class="pg">""")
    h.append(f"""<div class="capa"><div style="font-size:12px;letter-spacing:.2em;font-weight:700;color:#DCD3FF">RAIO-X DO INSTAGRAM</div>
<h1>{e(handle)}</h1><div class="sub">{e(SUBTITULO.get(modo, SUBTITULO_PADRAO))} · {e(MODOS.get(modo, ''))}</div>
<div style="margin-top:26px;display:flex;gap:28px;align-items:center;flex-wrap:wrap"><div><div class="nota">{br(geral, 1)}</div><div class="sub">nota geral de 10</div></div>
<div class="sub">Nicho: {e(perfil.get('nicho'))}<br>Objetivo: {e(OBJETIVOS[objetivo])}<br>Dados de {data_curta(met.get('data_prints'))} · {len(posts)} posts</div></div>
<div class="sub" style="margin-top:26px">{('Preparado por ' + e(prep.get('nome'))) if prep.get('nome') else ''} {(' · ' + e(prep.get('contato'))) if prep.get('contato') else ''} · {e(data_longa(data_rel))}</div></div>""")
    resumo = rx.get("resumo") or {}
    h.append(f"<div class='over'>01 · Resumo</div><h1>Resumo</h1><p style='font-size:17px'>{mk(resumo.get('diagnostico'))}</p>")
    h.append("<div class='card'><h3>Notas por área</h3><table>")
    for _, t, n, w in detalhes:
        _, cor = faixa(n)
        largura = 0 if n is None else n * 10
        h.append(f"<tr><td style='width:34%'>{e(t)}</td><td><div class='bar'><i style='width:{largura}%;background:{cor}'></i></div></td><td style='width:60px'><b>{'–' if n is None else int(n)}</b> <span class='crit'>x{br(w, 2)}</span></td></tr>")
    h.append(f"</table><p class='crit'>Média ponderada pelo objetivo {e(OBJETIVOS[objetivo].lower())}.</p></div>")
    h.append("<div class='card'><h3>O que já funciona</h3><ul>" + "".join(f"<li>{mk(x)}</li>" for x in resumo.get("pontos_fortes", [])) + "</ul>"
             f"<h3>Maior oportunidade</h3><p>{mk(resumo.get('maior_oportunidade'))}</p></div>")
    h.append("<div class='over'>02 · Problemas</div><h1>Os 5 problemas que mais custam</h1>")
    for i, p in enumerate(rx.get("problemas") or [], 1):
        corr = p["correcao"] if isinstance(p["correcao"], list) else [p["correcao"]]
        h.append(f"<div class='card'><h3><span style='color:var(--d);font-size:24px'>{i}</span> {mk(p['titulo'])}</h3><p><b>O que vimos.</b> {mk(p['evidencia'])}</p>"
                 f"<p><b>Por que custa.</b> {mk(p['por_que_custa'])}</p><ol>" + "".join(f"<li>{mk(x)}</li>" for x in corr) + "</ol>"
                 + (f"<p class='crit'>Esforço: {e(p.get('esforco'))}</p>" if p.get("esforco") else "") + "</div>")
    h.append("<div class='over'>03 · Áreas</div><h1>Diagnóstico por área</h1>")
    for aid, titulo, crit in AREAS:
        a = (rx.get("areas") or {}).get(aid, {})
        rot, cor = faixa(a.get("nota"))
        h.append(f"<div class='card bor'><h3><span class='selo' style='background:{cor}'>{'–' if a.get('nota') is None else int(a['nota'])}</span>{e(titulo)} · <span class='crit'>{e(rot)}</span></h3>"
                 f"<p class='crit'>Critério: {e(crit)}</p><p><b>O que vimos.</b> {mk(a.get('o_que_vimos'))}</p><p><b>Por que essa nota.</b> {mk(a.get('por_que'))}</p><p><b>O que fazer.</b> {mk(a.get('o_que_fazer'))}</p></div>")
    h.append("<div class='over'>04 · Números</div><h1>Os números do perfil</h1><div class='card'><h3>Como calculamos</h3><ul>")
    fm = met.get("formulas") or {}
    for k in (("interacoes", "taxa_alcance", "util_alcance", "indice") if base_alcance else ("taxa_seguidores", "indice")):
        h.append(f"<li>{e(fm.get(k))}</li>")
    h.append("</ul></div><div class='tw'><table><tr><th>ID</th><th>Data</th><th>Formato</th><th>Tema</th>")
    h.append("<th>Alcance</th><th>Int./alcance</th><th>Salv.+comp./alc.</th>" if base_alcance else "<th>Curt.</th><th>Com.</th><th>(Curt.+com.)/seg.</th>")
    h.append("<th>Índice</th></tr>")
    for p in posts:
        cor = PALETA["bom"] if p.get("classe") == "acima" else (PALETA["critico"] if p.get("classe") == "abaixo" else PALETA["suave"])
        h.append(f"<tr><td><b>{e(p['id'])}</b></td><td>{data_curta(p.get('data'))}</td><td>{e(p['formato'])}</td><td>{e(p.get('tema'))}</td>")
        if base_alcance:
            h.append(f"<td>{br(p.get('alcance'), 0)}</td><td>{br(p.get('taxa_alcance'), 1, '%')}</td><td>{br(p.get('util_alcance'), 1, '%')}</td>")
        else:
            h.append(f"<td>{br(p.get('curtidas'), 0)}</td><td>{br(p.get('comentarios'), 0)}</td><td>{br(p.get('taxa_seguidores'), 2, '%')}</td>")
        h.append(f"<td style='color:{cor};font-weight:700'>{br(p.get('indice_mediana'), 2)}x</td></tr>")
    h.append("</table></div>")
    eng = rx.get("engajamento") or {}
    for k, rot in (("padrao_melhores", "O padrão dos melhores."), ("padrao_piores", "O padrão dos piores."), ("leitura", "Leitura geral.")):
        if eng.get(k):
            h.append(f"<p><b>{rot}</b> {mk(eng[k])}</p>")
    rc = rx.get("concorrentes") or {}
    if met.get("comparacao") or rc.get("leitura"):
        h.append("<div class='over'>05 · Concorrentes</div><h1>Comparação com concorrentes</h1><div class='tw'><table><tr><th>Perfil</th><th>Seguidores</th><th>Views por seguidor (Reels)</th></tr>")
        for c in met.get("comparacao") or []:
            h.append(f"<tr><td>{e(c['perfil'])}</td><td>{br(c.get('seguidores'), 0)}</td><td>{br(c.get('mediana_views_por_seguidor'), 2)}</td></tr>")
        h.append(f"</table></div><p>{mk(rc.get('leitura'))}</p>")
        if rc.get("modelar"):
            h.append("<div class='card'><h3>O que modelar (o molde, não o conteúdo)</h3><ol>" + "".join(f"<li>{mk(x)}</li>" for x in rc["modelar"]) + "</ol></div>")
    h.append("<div class='over'>Bio e destaques</div><h1>Bio, nome e destaques</h1>")
    if rx.get("nome_sugerido"):
        h.append(f"<div class='card'><b>Nome pesquisável sugerido:</b> {mk(rx['nome_sugerido'])}</div>")
    for i, b in enumerate(rx.get("bios") or [], 1):
        h.append(f"<h3>Versão {i} <span class='crit'>({len(b.get('texto', ''))}/{LIMITE_BIO} caracteres)</span></h3><div class='bio'>{mk(b.get('texto'))}</div><p class='crit'>Prioriza: {mk(b.get('prioriza'))}</p>")
    if rx.get("link_sugerido_explicacao"):
        h.append(f"<p><b>Link:</b> {mk(rx['link_sugerido_explicacao'])}</p>")
    h.append("<h2>Destaques sugeridos</h2><div class='tw'><table><tr><th>Destaque</th><th>Capa</th><th>O que colocar</th></tr>")
    for d in rx.get("destaques") or []:
        h.append(f"<tr><td><b>{e(d.get('nome'))}</b></td><td>{mk(d.get('capa'))}</td><td>{mk(d.get('conteudo'))}</td></tr>")
    h.append("</table></div>")
    if rx.get("posts_fixados"):
        h.append("<h2>Posts fixados (até 3)</h2><ol>" + "".join(f"<li>{mk(x)}</li>" for x in rx["posts_fixados"]) + "</ol>")
    plano = rx.get("plano_30_dias") or {}
    h.append(f"<div class='over'>Plano</div><h1>Plano de 30 dias · {d0.strftime('%d/%m')} a {(d0 + timedelta(days=29)).strftime('%d/%m/%Y')}</h1><p class='intro'>{mk(plano.get('rotina'))}</p><div class='cal'>")
    h.extend(f"<div class='wd'>{x}</div>" for x in DIAS_SEMANA)
    dias = {int(d.get("dia", i + 1)): d for i, d in enumerate(plano.get("dias") or [])}
    for _ in range(d0.weekday()):
        h.append("<div class='cel vazio'></div>")
    for k in range(1, 31):
        dd = d0 + timedelta(days=k - 1)
        it = dias.get(k, {})
        fmt = it.get("formato", "Descanso")
        h.append(f"<div class='cel'><b>{dd.day:02d}/{dd.month:02d}</b> <span class='crit'>dia {k}</span><br><span class='pill' style='background:{cf.get(fmt, '#999')}'>{e(fmt)}</span><br>{mk(it.get('pauta'))}</div>")
    h.append("</div>")
    h.append("<div class='over'>Ideias</div><h1>15 ideias de conteúdo com gancho</h1><div class='tw'><table><tr><th>#</th><th>Pauta</th><th>Gancho</th><th>Formato</th><th>Pilar</th></tr>")
    for i, d in enumerate(rx.get("ideias") or [], 1):
        g = d.get("gancho") or ""
        g = mk(g) if g[:1] in "\"'“‘" else f"“{mk(g)}”"
        h.append(f"<tr><td>{i}</td><td>{mk(d.get('pauta'))}</td><td>{g}</td><td>{e(d.get('formato'))}</td><td>{e(d.get('pilar'))}</td></tr>")
    h.append("</table></div><div class='over'>Roteiros</div><h1>3 roteiros de Reels no GPEC</h1>")
    for i, r in enumerate(rx.get("roteiros") or [], 1):
        h.append(f"<h2>Roteiro {i} · {e(r.get('titulo'))}</h2><p class='crit'>{e(r.get('formato'))} · {e(r.get('duracao'))} · {e(r.get('objetivo'))}</p><div class='tw'><table><tr><th>Etapa</th><th>Fala</th><th>Ação visual</th><th>Texto na tela</th></tr>")
        for b in r.get("blocos") or []:
            h.append(f"<tr><td><b>{e(b.get('etapa'))}</b><br>{e(b.get('tempo'))}</td><td>“{mk(b.get('fala'))}”</td><td>{mk(b.get('visual'))}</td><td>{mk(b.get('texto_tela'))}</td></tr>")
        h.append("</table></div>" + (f"<p><b>Legenda:</b> {mk(r.get('legenda'))}</p>" if r.get("legenda") else ""))
    h.append("<div class='over'>Medição</div><h1>Como medir daqui para frente</h1><ul>" + "".join(f"<li>{mk(x)}</li>" for x in rx.get("proximos_passos") or []) + "</ul>")
    h.append("<div class='card'><h3>Sobre este diagnóstico</h3><p>Números transcritos dos prints de " + data_curta(met.get("data_prints")) +
             ". As notas seguem critérios explícitos e comparam o perfil com ele mesmo; não usam média de mercado. Realidade de setembro de 2026: nomes de métricas e recursos do Instagram mudam, confira no app.</p></div>")
    h.append("</div></body></html>")
    saida.write_text("".join(h), encoding="utf-8")
    return geral


# ---------------------------------------------------------------- prévia em PNG
def previa(pdf: Path, pasta: Path):
    pasta.mkdir(exist_ok=True)
    for velho in pasta.glob("pagina*.png"):
        velho.unlink()
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(pdf)
        for i, pg in enumerate(doc, 1):
            pg.get_pixmap(dpi=90).save(pasta / f"pagina-{i:02d}.png")
        return sorted(pasta.glob("*.png"))
    except Exception:
        pass
    if shutil.which("pdftoppm"):
        subprocess.run(["pdftoppm", "-png", "-r", "80", str(pdf), str(pasta / "pagina")], check=False)
        return sorted(pasta.glob("*.png"))
    if shutil.which("qlmanage"):
        try:
            from pypdf import PdfReader, PdfWriter
            leitor = PdfReader(str(pdf))
            tmp = pasta / "_tmp"
            tmp.mkdir(exist_ok=True)
            for i, pg in enumerate(leitor.pages, 1):
                w = PdfWriter()
                w.add_page(pg)
                arq = tmp / f"pagina-{i:02d}.pdf"
                with open(arq, "wb") as fh:
                    w.write(fh)
                subprocess.run(["qlmanage", "-t", "-s", "1300", "-o", str(pasta), str(arq)], capture_output=True)
                gerado = pasta / f"pagina-{i:02d}.pdf.png"
                if gerado.exists():
                    gerado.rename(pasta / f"pagina-{i:02d}.png")
            shutil.rmtree(tmp, ignore_errors=True)
            return sorted(pasta.glob("*.png"))
        except Exception as e:
            print("Prévia não gerada:", e)
    print("Prévia não gerada: instale PyMuPDF (pip install pymupdf) ou poppler (pdftoppm).")
    return []


# ---------------------------------------------------------------- principal
def main():
    ap = argparse.ArgumentParser(description="Gera o relatório do Raio-X do Instagram")
    ap.add_argument("--pasta", required=True, help="pasta com perfil.json, metricas.json e raio-x.json")
    ap.add_argument("--saida", default=None, help="pasta de saída (padrão: <pasta>/entrega)")
    ap.add_argument("--formato", choices=["pdf", "html", "ambos"], default="pdf")
    ap.add_argument("--previa", action="store_true", help="gera PNG de cada página para conferir o visual")
    ap.add_argument("--forcar", action="store_true", help="gera mesmo com erros na conferência (não recomendado)")
    a = ap.parse_args()
    pasta = Path(a.pasta)
    perfil, met, rx = carregar(pasta)
    erros, avisos = conferir(perfil, met, rx)
    for av in avisos:
        print("AVISO:", av)
    if erros:
        print("\nO raio-x.json precisa de ajustes antes de gerar o relatório:")
        for er in erros:
            print("  -", er)
        if not a.forcar:
            sys.exit(1)
    saida = Path(a.saida) if a.saida else pasta / "entrega"
    saida.mkdir(parents=True, exist_ok=True)
    cor = perfil.get("cor") or COR_PADRAO
    if not re.fullmatch(r"#[0-9A-Fa-f]{6}", cor):
        cor = COR_PADRAO
    nome_base = "raio-x-" + re.sub(r"[^a-z0-9]+", "-", (perfil.get("perfil") or "perfil").lower()).strip("-")
    gerados = []
    objetivo = objetivo_norm(perfil.get("objetivo"))
    geral, _ = nota_geral(rx, objetivo)
    formato = a.formato
    if formato in ("pdf", "ambos"):
        try:
            import reportlab  # noqa: F401
        except ImportError:
            print("AVISO: reportlab não está instalado aqui. Gerando o plano B em HTML (abra no navegador e use Imprimir > Salvar como PDF).")
            formato = "html"
    if formato in ("pdf", "ambos"):
        pdf = saida / f"{nome_base}.pdf"
        gerar_pdf(perfil, met, rx, pdf, cor)
        gerados.append(pdf)
        if a.previa:
            pngs = previa(pdf, saida / "previa")
            if pngs:
                print(f"Prévia: {len(pngs)} páginas em {saida / 'previa'}")
    if formato in ("html", "ambos"):
        arq = saida / f"{nome_base}.html"
        gerar_html(perfil, met, rx, arq, cor)
        gerados.append(arq)
    wa = saida / "resumo-whatsapp.txt"
    wa.write_text(texto_whatsapp(perfil, met, rx, geral), encoding="utf-8")
    gerados.append(wa)
    if perfil.get("modo") == "prospect" and rx.get("abordagem"):
        ab = saida / "mensagem-abordagem.txt"
        ab.write_text(rx["abordagem"].strip().replace("{nota_geral}", br(geral, 1)) + "\n", encoding="utf-8")
        gerados.append(ab)
    print(f"\nNota geral: {br(geral, 1)}/10 (pesos do objetivo: {OBJETIVOS[objetivo]})")
    for g in gerados:
        print("gerado:", g)


if __name__ == "__main__":
    main()
