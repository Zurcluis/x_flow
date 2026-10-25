import type {
  AssistantAnswer,
  AssistantBriefing,
  AssistantItem,
  AssistantSource,
  AssistantSourceId,
  SourceStatus,
} from "./types";

export function normalizeQuestion(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sourceOf(
  briefing: AssistantBriefing,
  id: AssistantSourceId
): AssistantSource | undefined {
  return briefing.sources.find((source) => source.id === id);
}

function statusOf(briefing: AssistantBriefing, id: AssistantSourceId): SourceStatus {
  return sourceOf(briefing, id)?.status ?? "unavailable";
}

function referencesFrom(items: AssistantItem[], limit = 3): AssistantAnswer["references"] {
  return items.slice(0, limit).map((item) => ({ label: item.title, href: item.href }));
}

function listLine(item: AssistantItem): string {
  const time = item.time ? `Às ${item.time}, ` : "";
  const detail = item.detail ? ` (${item.detail})` : "";
  return `${time}${item.title}${detail}`;
}

function listItems(items: AssistantItem[], limit = 5): string {
  return items
    .slice(0, limit)
    .map(listLine)
    .join("; ");
}

function lisbonTimeOf(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("pt-PT", {
    timeZone: "Europe/Lisbon",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function unavailableAnswer(label: string, fallbackHref: string): AssistantAnswer {
  return {
    text: `Não consegui consultar ${label} agora. Podes tentar novamente ou abrir a área correspondente.`,
    references: [{ label: `Abrir ${label}`, href: fallbackHref }],
  };
}

function agendaAnswer(
  briefing: AssistantBriefing,
  question: string
): AssistantAnswer {
  const status = statusOf(briefing, "agenda");
  if (status === "unavailable") return unavailableAnswer("a agenda", "/calendar");

  const asksForNext = /\b(proxima|proximo|seguinte)\b/.test(question);

  let items = briefing.agenda;
  if (asksForNext && items.length > 0) {
    const now = lisbonTimeOf(briefing.generatedAt);
    const upcoming = items.filter((item) => !item.time || item.time >= now);
    if (upcoming.length === 0) {
      return {
        text: "Não há mais marcações para hoje.",
        references: [{ label: "Abrir Agenda", href: "/calendar" }],
      };
    }
    items = upcoming;
  }

  if (status === "empty" || items.length === 0) {
    return {
      text: "A agenda respondeu e não tem marcações para hoje.",
      references: [{ label: "Abrir Agenda", href: "/calendar" }],
    };
  }

  const lead =
    items.length === 1 ? "Hoje há uma marcação." : `Hoje há ${items.length} marcações.`;

  return {
    text: `${lead} ${listLine(items[0])}${
      items.length > 1 ? `; depois, ${listLine(items[1])}` : ""
    }.`,
    references: referencesFrom(items),
  };
}

function deliveriesAnswer(briefing: AssistantBriefing): AssistantAnswer {
  const status = statusOf(briefing, "production");
  if (status === "unavailable") return unavailableAnswer("a produção", "/production");

  if (briefing.deliveries.length === 0) {
    return {
      text: "Não tenho uma previsão de entrega registada na aplicação e não há viaturas concluídas à espera de entrega.",
      references: [{ label: "Abrir Produção", href: "/production" }],
    };
  }

  return {
    text: `Não tenho uma previsão de entrega registada na aplicação. Há ${
      briefing.deliveries.length
    } ${
      briefing.deliveries.length === 1
        ? "viatura pronta para entrega"
        : "viaturas prontas para entrega"
    }: ${listItems(briefing.deliveries)}.`,
    references: referencesFrom(briefing.deliveries),
  };
}

function prioritiesAnswer(briefing: AssistantBriefing): AssistantAnswer {
  if (briefing.priorities.length === 0) {
    return {
      text: "Não há prioridades calculadas para hoje: as fontes consultadas não têm bloqueios nem compromissos pendentes.",
      references: [],
    };
  }

  const first = briefing.priorities[0];
  const rest = briefing.priorities.slice(1);
  const detail = first.detail ? ` ${first.detail}.` : "";
  const following =
    rest.length > 0
      ? ` A seguir: ${rest.map((item) => item.title).join(" e ")}.`
      : "";

  return {
    text: `A primeira prioridade é ${first.title}.${detail}${following}`,
    references: referencesFrom(briefing.priorities),
  };
}

function blockedAnswer(briefing: AssistantBriefing): AssistantAnswer {
  const status = statusOf(briefing, "production");
  if (status === "unavailable") {
    return unavailableAnswer("a produção", "/production");
  }
  if (briefing.blocked.length === 0) {
    return {
      text: "A produção respondeu e não há trabalhos bloqueados neste momento.",
      references: [{ label: "Abrir Produção", href: "/production" }],
    };
  }
  return {
    text: `Há ${briefing.blocked.length} ${
      briefing.blocked.length === 1 ? "trabalho bloqueado" : "trabalhos bloqueados"
    }: ${listItems(briefing.blocked)}.`,
    references: referencesFrom(briefing.blocked),
  };
}

function quotesAnswer(briefing: AssistantBriefing): AssistantAnswer {
  const status = statusOf(briefing, "quotes");
  if (status === "not_applicable") {
    return {
      text: "O teu perfil não tem acesso aos orçamentos.",
      references: [],
    };
  }
  if (status === "unavailable") {
    return unavailableAnswer("os orçamentos", "/quotes");
  }
  if (briefing.quotes.length === 0) {
    return {
      text: "Não há orçamentos sem resposta há mais de quatro dias.",
      references: [{ label: "Abrir Orçamentos", href: "/quotes" }],
    };
  }
  return {
    text: `Há ${briefing.quotes.length} ${
      briefing.quotes.length === 1
        ? "orçamento à espera de seguimento"
        : "orçamentos à espera de seguimento"
    }: ${listItems(briefing.quotes)}.`,
    references: referencesFrom(briefing.quotes),
  };
}

function stockAnswer(briefing: AssistantBriefing): AssistantAnswer {
  const status = statusOf(briefing, "stock");
  if (status === "not_applicable") {
    return {
      text: "O teu perfil não tem acesso ao stock.",
      references: [],
    };
  }
  if (status === "unavailable") {
    return unavailableAnswer("o stock", "/stock");
  }
  if (briefing.stock.length === 0) {
    return {
      text: "Não há materiais abaixo do stock mínimo.",
      references: [{ label: "Abrir Stock", href: "/stock" }],
    };
  }
  return {
    text: `Há ${briefing.stock.length} ${
      briefing.stock.length === 1
        ? "material abaixo do mínimo"
        : "materiais abaixo do mínimo"
    }: ${listItems(briefing.stock)}.`,
    references: referencesFrom(briefing.stock),
  };
}

export function answerQuestion(
  rawQuestion: string,
  briefing: AssistantBriefing
): AssistantAnswer {
  const question = normalizeQuestion(rawQuestion);
  if (!question) {
    return {
      text: "Escreve ou dita uma pergunta sobre a agenda, a produção, os orçamentos ou o stock.",
      references: [],
    };
  }

  if (/\b(prioridade|prioridades|primeiro|mais importante)\b/.test(question)) {
    return prioritiesAnswer(briefing);
  }
  if (/\b(bloquead\w*|bloqueio|pecas|parado|espera de material)\b/.test(question)) {
    return blockedAnswer(briefing);
  }
  if (/\b(orcamento|orcamentos|proposta|propostas|seguimento|sem resposta)\b/.test(question)) {
    return quotesAnswer(briefing);
  }
  if (/\b(stock|material|materiais|minimo|reposicao|pelicula|peliculas)\b/.test(question)) {
    return stockAnswer(briefing);
  }
  if (/\b(entrega|entregas|entregar|pronta|prontas)\b/.test(question)) {
    return deliveriesAnswer(briefing);
  }
  if (
    /\b(agenda|hoje|planeado|planejado|marcacao|marcacoes|compromisso|compromissos|proxima|proximo)\b/.test(
      question
    )
  ) {
    return agendaAnswer(briefing, question);
  }
  if (/\b(resumo|briefing|dia)\b/.test(question)) {
    return {
      text: briefing.narration,
      references: referencesFrom(briefing.priorities),
    };
  }
  if (/\b(repet\w*|outra vez|de novo)\b/.test(question)) {
    return {
      text: briefing.narration,
      references: referencesFrom(briefing.priorities),
    };
  }

  return {
    text: "Não tenho dados que respondam a isso. Posso falar sobre a agenda de hoje, trabalhos bloqueados, orçamentos sem seguimento e stock abaixo do mínimo.",
    references: [],
  };
}
