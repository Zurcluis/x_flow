#!/usr/bin/env python3
"""Contas do Raio-X do Instagram.

Lê a tabela de posts (posts.csv) e os dados do perfil (perfil.json) que a skill monta
com os números lidos dos prints, e calcula as taxas com a fórmula declarada.
Não acessa a internet e não precisa de bibliotecas extras (só Python 3).

Uso:
    python3 contas.py --pasta <pasta-do-trabalho>
    python3 contas.py --pasta <pasta> --metrica util_alcance   (muda a métrica do ranking)

Entrada:  <pasta>/posts.csv e <pasta>/perfil.json
Saída:    <pasta>/metricas.json  + um resumo em texto no terminal
"""
import argparse
import csv
import json
import re
import statistics
import sys
from datetime import date, datetime, timedelta
from pathlib import Path

MESES = {"jan": 1, "fev": 2, "mar": 3, "abr": 4, "mai": 5, "jun": 6, "jul": 7, "ago": 8,
         "set": 9, "out": 10, "nov": 11, "dez": 12}

FORMATOS = {
    "reels": "Reels", "reel": "Reels", "video": "Reels", "vídeo": "Reels",
    "carrossel": "Carrossel", "carousel": "Carrossel", "album": "Carrossel", "álbum": "Carrossel",
    "estatico": "Estático", "estático": "Estático", "imagem": "Estático", "foto": "Estático",
    "post": "Estático", "publicacao": "Estático", "publicação": "Estático",
    "live": "Live", "ao vivo": "Live",
}

FORMULAS = {
    "interacoes": "Interações do post = curtidas + comentários + compartilhamentos + salvamentos. Post com algum desses números oculto ou ilegível fica fora da taxa (a soma sairia menor que a real).",
    "taxa_alcance": "Taxa de interação por alcance = interações ÷ contas alcançadas pelo post × 100.",
    "util_alcance": "Sinal de utilidade = (salvamentos + compartilhamentos) ÷ contas alcançadas × 100.",
    "taxa_seguidores": "Estimativa pública = (curtidas + comentários) ÷ seguidores do perfil × 100. É estimativa: seguidor não é alcance e salvamentos e compartilhamentos não aparecem para quem vê de fora.",
    "views_por_seguidor": "Visualizações por seguidor (Reels, público) = visualizações do Reel ÷ seguidores. Visualização conta repetições; serve para comparar perfis entre si com a mesma conta.",
    "retencao": "Retenção = tempo médio de visualização ÷ duração do Reel × 100. Referência do curso: acima de 1/3 da duração é bom sinal.",
    "indice": "Índice = métrica do post ÷ mediana da mesma métrica nos posts analisados. 1,0 = igual à mediana do próprio perfil. Acima de 1,2 = acima; abaixo de 0,8 = abaixo.",
    "posts_semana": "Posts por semana = nº de posts com data ÷ (dias entre o primeiro e o último post + 1) × 7.",
    "taxa_contas_engajadas": "Contas com engajamento ÷ contas alcançadas no período × 100.",
    "toques_por_visita": "Toques no link ÷ visitas ao perfil × 100.",
    "seguidores_por_visita": "Novos seguidores ÷ visitas ao perfil × 100.",
}

NOMES_METRICA = {
    "taxa_alcance": "taxa de interação por alcance",
    "util_alcance": "salvamentos + compartilhamentos por alcance",
    "alcance": "contas alcançadas",
    "taxa_seguidores": "interações públicas por seguidor (estimativa)",
    "views_por_seguidor": "visualizações por seguidor",
}


# ---------------------------------------------------------------- leitura de números
def num(v):
    """Converte números como aparecem nos prints: '3.140', '12,4 mil', '1,2 mi', '5k', '38%', '–'."""
    if v is None:
        return None
    if isinstance(v, (int, float)):
        return float(v)
    s = str(v).strip().lower().replace(" ", " ")
    if s in ("", "-", "–", "—", "n/d", "nd", "?", "[?]", "sem dado"):
        return None
    s = s.replace("%", "").replace("+", "").strip()
    mult = 1
    if re.search(r"\s*(mi|milhão|milhões|m)$", s) and not s.endswith("mil"):
        mult, s = 1_000_000, re.sub(r"\s*(mi|milhão|milhões|m)$", "", s)
    elif re.search(r"\s*(mil|k)$", s):
        mult, s = 1000, re.sub(r"\s*(mil|k)$", "", s)
    s = s.replace(" ", "")
    if mult > 1:
        s = s.replace(".", "").replace(",", ".") if "," in s else s
        try:
            return float(s) * mult
        except ValueError:
            return None
    if re.fullmatch(r"\d{1,3}(\.\d{3})+", s):
        s = s.replace(".", "")
    elif re.fullmatch(r"\d{1,3}(\.\d{3})+,\d+", s):
        s = s.replace(".", "").replace(",", ".")
    else:
        s = s.replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return None


def segundos(v):
    """'0:38' -> 38 ; '1:05' -> 65 ; '38' -> 38 ; '38 s' -> 38."""
    if v is None:
        return None
    s = str(v).strip().lower().replace("s", "").strip()
    if not s or s in ("-", "–", "—"):
        return None
    if ":" in s:
        partes = [p for p in s.split(":")]
        try:
            total = 0
            for p in partes:
                total = total * 60 + float(p.replace(",", "."))
            return total
        except ValueError:
            return None
    return num(s)


RELATIVA = re.compile(r"(?:há\s*)?(\d{1,3})\s*(h|hr|hs|hora|horas|min|mins|minuto|minutos|d|dia|dias|sem|semana|semanas)\.?(?:\s*atrás)?")


def data_relativa(v):
    """'há 2 dias', '4 d', '1 sem', '5 h', 'ontem' -> dias antes do print (semanas são aproximadas)."""
    s = str(v or "").strip().lower()
    if s in ("hoje", "agora"):
        return 0, False
    if s == "ontem":
        return 1, False
    m = RELATIVA.fullmatch(s)
    if not m:
        return None
    n, unid = int(m.group(1)), m.group(2)
    if unid.startswith(("h", "min")):
        return 0, False
    if unid.startswith("d"):
        return n, False
    return n * 7, True


def data_br(v, ano_padrao, ref=None):
    """Datas como aparecem no print. Com `ref` (dia dos prints), aceita também datas relativas."""
    if not v:
        return None
    s = str(v).strip().lower()
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d/%m/%y"):
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            pass
    try:
        m = re.fullmatch(r"(\d{1,2})/(\d{1,2})", s)
        if m:
            return date(ano_padrao, int(m.group(2)), int(m.group(1)))
        m = re.fullmatch(r"(\d{1,2})\s*(?:de\s*)?([a-zç]{3})[a-zç]*\.?(?:\s*(?:de\s*)?(\d{4}))?", s)
        if m and m.group(2) in MESES:
            return date(int(m.group(3) or ano_padrao), MESES[m.group(2)], int(m.group(1)))
    except ValueError:  # dia que não existe (ex.: 31/09): trata como data ilegível
        return None
    rel = data_relativa(s)
    if rel and ref:
        return ref - timedelta(days=rel[0])
    return None


def formato_norm(v):
    s = (v or "").strip().lower()
    return FORMATOS.get(s, (v or "").strip().capitalize() or "Não informado")


def med(valores):
    vs = [v for v in valores if v is not None]
    return statistics.median(vs) if vs else None


def r(v, casas=2):
    return None if v is None else round(v, casas)


def br(v, casas=1, sufixo=""):
    if v is None:
        return "sem dado"
    from decimal import Decimal, ROUND_HALF_UP
    v = float(Decimal(repr(float(v))).quantize(Decimal(1).scaleb(-casas), rounding=ROUND_HALF_UP))  # 19,45 -> 19,5
    if casas == 0:
        s = f"{v:,.0f}".replace(",", ".")
    else:
        s = f"{v:,.{casas}f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return s + sufixo


# ---------------------------------------------------------------- contas
CAMPOS_INT = ("curtidas", "comentarios", "compartilhamentos", "salvamentos")
NOMES_CAMPO = {"curtidas": "curtidas", "comentarios": "comentários", "compartilhamentos": "compartilhamentos",
               "salvamentos": "salvamentos"}


def calcular(pasta: Path, metrica_escolhida=None):
    perfil = json.loads((pasta / "perfil.json").read_text(encoding="utf-8"))
    avisos = []
    seguidores = num(perfil.get("seguidores"))
    if not seguidores:
        avisos.append("Número de seguidores ausente: as estimativas por seguidor não foram calculadas.")
    data_prints = data_br(perfil.get("data_prints"), date.today().year) or date.today()
    ano = data_prints.year

    linhas = []
    with open(pasta / "posts.csv", encoding="utf-8-sig", newline="") as fh:
        leitor = csv.DictReader(fh)
        for i, row in enumerate(leitor, 1):
            row = {(k or "").strip().lower(): (v or "").strip() for k, v in row.items()}
            if not any(row.values()):
                continue
            linhas.append(row)
    if not linhas:
        sys.exit("posts.csv está vazio. Monte a tabela com pelo menos 6 posts antes de rodar as contas.")

    posts = []
    datas_relativas, datas_aprox, datas_ilegiveis = [], [], []
    for i, row in enumerate(linhas, 1):
        p = {
            "id": row.get("id") or f"P{i:02d}",
            "data": None,
            "formato": formato_norm(row.get("formato")),
            "tema": row.get("tema", ""),
            "pilar": row.get("pilar", "") or "Não classificado",
            "gancho": row.get("gancho", ""),
            "cta": (row.get("cta", "") or "nenhum").lower(),
        }
        bruto = row.get("data", "")
        d = data_br(bruto, ano, ref=data_prints)
        rel = data_relativa(bruto)
        if rel and d:
            (datas_aprox if rel[1] else datas_relativas).append(f"{p['id']} ('{bruto}')")
        elif d and d > data_prints + timedelta(days=1):
            d = d.replace(year=d.year - 1)  # "24/12" lido em janeiro é do ano anterior
        elif bruto and not d:
            datas_ilegiveis.append(f"{p['id']} ('{bruto}')")
        p["data"] = d.isoformat() if d else None
        for campo in ("alcance", "visualizacoes", "curtidas", "comentarios", "compartilhamentos", "salvamentos"):
            p[campo] = num(row.get(campo))
        p["duracao_s"] = segundos(row.get("duracao_s") or row.get("duracao"))
        p["tempo_medio_s"] = segundos(row.get("tempo_medio_s") or row.get("tempo_medio"))
        posts.append(p)

    # Campos de interação que o perfil mostra (presentes na maioria dos posts). Post em que um
    # deles está oculto ou ilegível fica FORA das taxas: somar só o que sobrou daria uma taxa
    # menor que a real e o post pareceria "abaixo da mediana" sem ser.
    com_algum = [p for p in posts if any(p[c] is not None for c in CAMPOS_INT)]
    esperados = [c for c in CAMPOS_INT if com_algum and sum(1 for p in com_algum if p[c] is not None) >= len(com_algum) / 2]
    incompletos, sem_numeros = [], []
    for p in posts:
        partes = [p[c] for c in CAMPOS_INT if p[c] is not None]
        faltam = [c for c in esperados if p[c] is None]
        p["campos_faltando"] = faltam
        if partes and faltam:
            p["interacoes"] = None
            incompletos.append(f"{p['id']} (sem {', '.join(NOMES_CAMPO[c] for c in faltam)})")
        else:
            p["interacoes"] = sum(partes) if partes else None
        if not partes and not p["alcance"]:
            sem_numeros.append(p["id"])
        a = p["alcance"]
        p["taxa_alcance"] = r(p["interacoes"] / a * 100) if (a and p["interacoes"] is not None) else None
        util = [p[c] for c in ("salvamentos", "compartilhamentos") if p[c] is not None]
        p["util_alcance"] = r(sum(util) / a * 100) if (a and len(util) == 2) else None
        p["salv_alcance"] = r(p["salvamentos"] / a * 100) if (a and p["salvamentos"] is not None) else None
        p["comp_alcance"] = r(p["compartilhamentos"] / a * 100) if (a and p["compartilhamentos"] is not None) else None
        pub = [p[c] for c in ("curtidas", "comentarios") if p[c] is not None]
        pub_ok = pub and not any(c in faltam for c in ("curtidas", "comentarios"))
        p["taxa_seguidores"] = r(sum(pub) / seguidores * 100) if (seguidores and pub_ok) else None
        p["views_por_seguidor"] = r(p["visualizacoes"] / seguidores) if (seguidores and p["visualizacoes"]) else None
        if p["duracao_s"] and p["tempo_medio_s"] is not None:
            p["retencao_pct"] = r(p["tempo_medio_s"] / p["duracao_s"] * 100, 1)
            p["retencao_ok"] = p["tempo_medio_s"] >= p["duracao_s"] / 3
        else:
            p["retencao_pct"], p["retencao_ok"] = None, None
    if incompletos:
        avisos.append("Posts com algum número oculto ou ilegível ficaram fora das taxas de interação e do ranking "
                      "(a conta sairia menor que a real): " + "; ".join(incompletos) + ".")
    if sem_numeros:
        avisos.append("Posts sem alcance nem interações legíveis (entram só no mix de formatos e, se houver, nas visualizações): " + ", ".join(sem_numeros) + ".")
    if datas_relativas:
        avisos.append("Datas relativas convertidas a partir do dia dos prints (" + data_prints.strftime("%d/%m/%Y") + "): " + ", ".join(datas_relativas) + ".")
    if datas_aprox:
        avisos.append("Datas em semanas são aproximadas (o app arredonda): " + ", ".join(datas_aprox) + ". Se der, confirme a data exata abrindo o post.")
    if datas_ilegiveis:
        avisos.append("Datas que não deu para ler: " + ", ".join(datas_ilegiveis) + ". Use o formato '24 set', '24/09' ou 'há 3 dias'.")
    if seguidores and re.search(r"(mil|mi|k|m)\s*$", str(perfil.get("seguidores", "")).strip().lower()):
        avisos.append(f"O app mostra os seguidores arredondados ('{perfil.get('seguidores')}'): as contas por seguidor são aproximadas.")

    com_alcance = sum(1 for p in posts if p["alcance"])
    base = "alcance" if com_alcance >= max(1, len(posts) / 2) else "seguidores"
    if com_alcance and base == "seguidores":
        avisos.append(f"Só {com_alcance} de {len(posts)} posts têm alcance: o ranking usa a estimativa por seguidores.")
    metrica = metrica_escolhida or ("taxa_alcance" if base == "alcance" else "taxa_seguidores")
    if metrica not in NOMES_METRICA:
        sys.exit(f"Métrica desconhecida: {metrica}. Use uma de: {', '.join(NOMES_METRICA)}")

    mediana = med([p.get(metrica) for p in posts])
    for p in posts:
        v = p.get(metrica)
        p["principal"] = v
        p["indice_mediana"] = r(v / mediana, 2) if (v is not None and mediana) else None
        idx = p["indice_mediana"]
        p["classe"] = None if idx is None else ("acima" if idx >= 1.2 else ("abaixo" if idx <= 0.8 else "na média"))

    # frequência
    datas = sorted((date.fromisoformat(p["data"]), p["id"]) for p in posts if p["data"])
    resumo = {"n_posts": len(posts), "n_posts_datados": len(datas), "base": base, "metrica": metrica, "nome_metrica": NOMES_METRICA[metrica]}
    if len(datas) >= 2:
        dias = (datas[-1][0] - datas[0][0]).days + 1
        resumo.update({
            "periodo_inicio": datas[0][0].isoformat(), "periodo_fim": datas[-1][0].isoformat(), "dias": dias,
            "posts_semana": r(len(datas) / dias * 7, 1),
        })
        maior = max(((datas[k + 1][0] - datas[k][0]).days, datas[k][1], datas[k + 1][1]) for k in range(len(datas) - 1))
        resumo["maior_intervalo"] = {"dias": maior[0], "entre": [maior[1], maior[2]]}
        resumo["dias_desde_ultimo_post"] = (data_prints - datas[-1][0]).days
    else:
        avisos.append("Sem datas suficientes: frequência não calculada. Peça as datas (abrindo cada post ou pela lista de conteúdos dos Insights).")
    resumo["mediana_principal"] = r(mediana)
    resumo["mediana_alcance"] = r(med([p["alcance"] for p in posts]), 0)
    resumo["mediana_util"] = r(med([p["util_alcance"] for p in posts]))
    sem_cta = sum(1 for p in posts if p["cta"] in ("", "nenhum", "não", "nao", "-"))
    resumo["pct_sem_cta"] = r(sem_cta / len(posts) * 100, 0)
    reels_ret = [p for p in posts if p["retencao_pct"] is not None]
    if reels_ret:
        resumo["reels_com_retencao"] = len(reels_ret)
        resumo["reels_retencao_ok"] = sum(1 for p in reels_ret if p["retencao_ok"])

    def agrupar(chave):
        grupos = {}
        for p in posts:
            grupos.setdefault(p[chave], []).append(p)
        saida = []
        for k, ps in sorted(grupos.items(), key=lambda kv: -len(kv[1])):
            saida.append({
                chave: k, "n": len(ps), "pct": r(len(ps) / len(posts) * 100, 0),
                "mediana_principal": r(med([x["principal"] for x in ps])),
                "mediana_alcance": r(med([x["alcance"] for x in ps]), 0),
                "mediana_util": r(med([x["util_alcance"] for x in ps])),
                "ids": [x["id"] for x in ps],
            })
        return saida

    def ranking(campo, n=3, reverso=True):
        validos = [p for p in posts if p.get(campo) is not None]
        return [p["id"] for p in sorted(validos, key=lambda x: x[campo], reverse=reverso)[:n]]

    ctas = {}
    for p in posts:
        ctas[p["cta"] or "nenhum"] = ctas.get(p["cta"] or "nenhum", 0) + 1

    # perfil (Insights do período)
    ins = perfil.get("insights") or {}
    insights = {}
    if ins:
        alc = num(ins.get("contas_alcancadas"))
        eng = num(ins.get("contas_com_engajamento"))
        vis = num(ins.get("visitas_perfil"))
        toq = num(ins.get("toques_link"))
        novos = num(ins.get("novos_seguidores"))
        views = num(ins.get("visualizacoes"))
        insights = {
            "periodo": ins.get("periodo", ""),
            "visualizacoes": views, "contas_alcancadas": alc, "interacoes": num(ins.get("interacoes")),
            "contas_com_engajamento": eng, "visitas_perfil": vis, "toques_link": toq, "novos_seguidores": novos,
            "pct_nao_seguidores": num(ins.get("pct_nao_seguidores")),
            "taxa_contas_engajadas": r(eng / alc * 100) if (eng is not None and alc) else None,
            "alcance_por_seguidor": r(alc / seguidores) if (alc and seguidores) else None,
            "toques_por_visita": r(toq / vis * 100) if (toq is not None and vis) else None,
            "seguidores_por_visita": r(novos / vis * 100) if (novos is not None and vis) else None,
            "visualizacoes_por_conta": r(views / alc) if (views and alc) else None,
        }

    # concorrentes: mesma conta pública para todos
    def publico(nome, seg, lista):
        reels_v = [num(x.get("visualizacoes")) / seg for x in lista
                   if seg and num(x.get("visualizacoes")) and formato_norm(x.get("formato")) == "Reels"]
        inter = []
        pares = [(num(x.get("curtidas")), num(x.get("comentarios"))) for x in lista]
        com_algum_p = [pp for pp in pares if pp[0] is not None or pp[1] is not None]
        exige_c = sum(1 for pp in com_algum_p if pp[0] is not None) >= len(com_algum_p) / 2 if com_algum_p else False
        exige_cm = sum(1 for pp in com_algum_p if pp[1] is not None) >= len(com_algum_p) / 2 if com_algum_p else False
        for c, cm in com_algum_p:
            if (exige_c and c is None) or (exige_cm and cm is None):
                continue  # número oculto ou ilegível: fora da mediana, senão a taxa sai menor que a real
            if seg:
                inter.append(((c or 0) + (cm or 0)) / seg * 100)
        formatos = {}
        for x in lista:
            fm = formato_norm(x.get("formato"))
            formatos[fm] = formatos.get(fm, 0) + 1
        return {
            "perfil": nome, "seguidores": seg, "n_posts": len(lista),
            "mediana_views_por_seguidor": r(med(reels_v)), "n_reels_com_views": len(reels_v),
            "mediana_taxa_seguidores": r(med(inter)), "n_posts_com_curtidas": len(inter),
            "formatos": formatos,
        }

    comparacao = []
    concorrentes = perfil.get("concorrentes") or []
    if concorrentes:
        proprios = [{"formato": p["formato"], "visualizacoes": p["visualizacoes"], "curtidas": p["curtidas"],
                     "comentarios": p["comentarios"]} for p in posts]
        comparacao.append(dict(publico(perfil.get("perfil", "perfil analisado"), seguidores, proprios), principal=True))
        for c in concorrentes:
            seg_c = num(c.get("seguidores"))
            if not seg_c:
                avisos.append(f"Concorrente {c.get('perfil')} sem nº de seguidores: fora da comparação numérica.")
            comparacao.append(dict(publico(c.get("perfil", "?"), seg_c, c.get("posts") or []), principal=False,
                                   publicacoes=num(c.get("publicacoes"))))

    saida = {
        "gerado_em": datetime.now().isoformat(timespec="seconds"),
        "perfil": perfil.get("perfil"), "seguidores": seguidores, "data_prints": data_prints.isoformat(),
        "base": base, "metrica": metrica, "nome_metrica": NOMES_METRICA[metrica],
        "formulas": FORMULAS,
        "posts": posts, "resumo": resumo,
        "formatos": agrupar("formato"), "pilares": agrupar("pilar"),
        "ctas": [{"cta": k, "n": v, "pct": r(v / len(posts) * 100, 0)} for k, v in sorted(ctas.items(), key=lambda kv: -kv[1])],
        "top": ranking("principal"), "bottom": ranking("principal", reverso=False),
        "top_alcance": ranking("alcance"), "top_util": ranking("util_alcance"),
        "insights": insights, "comparacao": comparacao, "avisos": avisos,
    }
    (pasta / "metricas.json").write_text(json.dumps(saida, ensure_ascii=False, indent=2), encoding="utf-8")
    return saida


def imprimir(m):
    res = m["resumo"]
    por_id = {p["id"]: p for p in m["posts"]}
    print(f"\n=== CONTAS DO RAIO-X · {m['perfil']} ===")
    print(f"Base: {'Insights (por alcance)' if m['base'] == 'alcance' else 'dados públicos (estimativa por seguidores)'}")
    print(f"Métrica do ranking: {m['nome_metrica']} | mediana do perfil: {br(res.get('mediana_principal'), 2, '%' if m['metrica'] != 'alcance' and m['metrica'] != 'views_por_seguidor' else '')}")
    if "posts_semana" in res:
        print(f"Frequência: {br(res['posts_semana'], 1)} posts/semana ({res.get('n_posts_datados', res['n_posts'])} posts com data em {res['dias']} dias); "
              f"maior intervalo: {res['maior_intervalo']['dias']} dias; último post há {res['dias_desde_ultimo_post']} dias")
    print(f"Posts sem CTA: {br(res['pct_sem_cta'], 0, '%')}")
    if res.get("reels_com_retencao"):
        print(f"Reels com retenção acima de 1/3: {res['reels_retencao_ok']} de {res['reels_com_retencao']}")
    print("\nPOR POST")
    for p in m["posts"]:
        extra = []
        if p["alcance"]:
            extra.append(f"alcance {br(p['alcance'], 0)}")
        if p["taxa_alcance"] is not None:
            extra.append(f"interação/alcance {br(p['taxa_alcance'], 1, '%')}")
        if p["util_alcance"] is not None:
            extra.append(f"salv+comp/alcance {br(p['util_alcance'], 1, '%')}")
        if p["taxa_seguidores"] is not None:
            extra.append(f"públ./seguidor {br(p['taxa_seguidores'], 2, '%')}")
        if p["retencao_pct"] is not None:
            extra.append(f"retenção {br(p['retencao_pct'], 0, '%')}")
        if p["indice_mediana"] is not None:
            extra.append(f"índice {br(p['indice_mediana'], 2)}x ({p['classe']})")
        if p.get("campos_faltando") and p["interacoes"] is None and any(p[c] is not None for c in CAMPOS_INT):
            extra.append("FORA da taxa: sem " + ", ".join(NOMES_CAMPO[c] for c in p["campos_faltando"]))
        if not extra:
            extra.append("sem alcance nem interações legíveis" + (f" (visualizações {br(p['visualizacoes'], 0)})" if p["visualizacoes"] else ""))
        print(f"  {p['id']} {p['data'] or 's/ data'} {p['formato']:<9} {p['tema'][:38]:<38} | " + " · ".join(extra))
    print("\nPOR FORMATO")
    for g in m["formatos"]:
        print(f"  {g['formato']:<10} {g['n']} {'post' if g['n'] == 1 else 'posts'} ({br(g['pct'], 0, '%')}) · mediana da métrica {br(g['mediana_principal'], 2)} · "
              f"mediana alcance {br(g['mediana_alcance'], 0)} · mediana salv+comp/alcance {br(g['mediana_util'], 1, '%')}")
    print("\nPOR PILAR")
    for g in m["pilares"]:
        print(f"  {g['pilar'][:28]:<28} {g['n']} {'post' if g['n'] == 1 else 'posts'} ({br(g['pct'], 0, '%')}) · mediana da métrica {br(g['mediana_principal'], 2)} · mediana alcance {br(g['mediana_alcance'], 0)}")
    print("\nTOP 3:", ", ".join(f"{i} ({por_id[i]['tema'][:30]})" for i in m["top"]))
    print("PIORES 3:", ", ".join(f"{i} ({por_id[i]['tema'][:30]})" for i in m["bottom"]))
    if m["top_alcance"]:
        print("MAIS ALCANCE:", ", ".join(m["top_alcance"]))
    if m["top_util"]:
        print("MAIS SALV+COMP/ALCANCE:", ", ".join(m["top_util"]))
    ins = m["insights"]
    if ins:
        print(f"\nINSIGHTS ({ins.get('periodo')})")
        print(f"  contas com engajamento/alcançadas: {br(ins.get('taxa_contas_engajadas'), 1, '%')} · alcance por seguidor: {br(ins.get('alcance_por_seguidor'), 2)}")
        print(f"  toques no link por visita: {br(ins.get('toques_por_visita'), 1, '%')} · novos seguidores por visita: {br(ins.get('seguidores_por_visita'), 1, '%')}")
    if m["comparacao"]:
        print("\nCOMPARAÇÃO PÚBLICA (mesma conta para todos)")
        for c in m["comparacao"]:
            print(f"  {c['perfil']:<24} seg {br(c['seguidores'], 0)} · views/seguidor (Reels, mediana) {br(c['mediana_views_por_seguidor'], 2)} "
                  f"[{c['n_reels_com_views']} Reels] · (curt+com)/seg {br(c['mediana_taxa_seguidores'], 2, '%')} [{c['n_posts_com_curtidas']} posts]")
    for a in m["avisos"]:
        print("AVISO:", a)
    print("\nmetricas.json salvo.")


def main():
    ap = argparse.ArgumentParser(description="Contas do Raio-X do Instagram")
    ap.add_argument("--pasta", required=True, help="pasta com posts.csv e perfil.json")
    ap.add_argument("--metrica", default=None, help="taxa_alcance | util_alcance | alcance | taxa_seguidores | views_por_seguidor")
    a = ap.parse_args()
    pasta = Path(a.pasta)
    for arq in ("posts.csv", "perfil.json"):
        if not (pasta / arq).exists():
            sys.exit(f"Falta {pasta / arq}. Use os modelos da pasta modelos/ da skill.")
    imprimir(calcular(pasta, a.metrica))


if __name__ == "__main__":
    main()
