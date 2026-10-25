import type { AssistantItem, SourceStatus } from "./types";

export interface NarrationInput {
  firstName: string;
  greeting: string;
  agenda: AssistantItem[];
  agendaStatus: SourceStatus;
  activeWorks: AssistantItem[];
  blocked: AssistantItem[];
  quality: AssistantItem[];
  delayed: AssistantItem[];
  deliveries: AssistantItem[];
  quotes: AssistantItem[];
  stock: AssistantItem[];
  priorities: AssistantItem[];
  unavailableLabels: string[];
}

export function greetingForHour(hour: number): string {
  if (hour < 12) return "Bom dia";
  if (hour < 20) return "Boa tarde";
  return "Boa noite";
}

function describePriority(item: AssistantItem): string {
  if (item.time) return `${item.title}, às ${item.time}`;
  if (item.detail) return `${item.title}, ${item.detail}`;
  return item.title;
}

function joinWithE(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} e ${items.at(-1)}`;
}

function countPhrase(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural.replace("{n}", String(count));
}

export function buildNarration(input: NarrationInput): string {
  const sentences: string[] = [`${input.greeting}, ${input.firstName}.`];

  if (input.priorities.length > 0) {
    if (input.priorities.length === 1) {
      sentences.push(`A tua prioridade é ${describePriority(input.priorities[0])}.`);
    } else {
      const described = input.priorities.map(describePriority);
      sentences.push(`As tuas prioridades são ${joinWithE(described)}.`);
    }
  }

  if (input.agendaStatus === "available" && input.agenda.length > 0) {
    const first = input.agenda[0];
    if (input.agenda.length === 1) {
      sentences.push(
        `Hoje tens uma marcação às ${first.time ?? "hora a confirmar"}, ${first.title}.`
      );
    } else {
      const next = input.agenda[1];
      sentences.push(
        `Hoje tens ${input.agenda.length} marcações. A primeira é às ${
          first.time ?? "hora a confirmar"
        }, ${first.title}${
          next ? `; a seguir, às ${next.time ?? "hora a confirmar"}, ${next.title}` : ""
        }.`
      );
    }
  } else if (input.agendaStatus === "empty") {
    sentences.push("Não há marcações para hoje.");
  }

  if (input.activeWorks.length > 0) {
    sentences.push(
      countPhrase(
        input.activeWorks.length,
        `Está em curso ${input.activeWorks[0].title}.`,
        "Estão {n} trabalhos em curso."
      )
    );
  }

  if (input.blocked.length > 0) {
    sentences.push(
      countPhrase(
        input.blocked.length,
        `Há um trabalho à espera de peças: ${input.blocked[0].title}.`,
        "Há {n} trabalhos à espera de peças."
      )
    );
  }

  if (input.quality.length > 0) {
    sentences.push(
      countPhrase(
        input.quality.length,
        `Há um trabalho em controlo de qualidade: ${input.quality[0].title}.`,
        "Há {n} trabalhos em controlo de qualidade."
      )
    );
  }

  if (input.delayed.length > 0) {
    sentences.push(
      countPhrase(
        input.delayed.length,
        `O trabalho ${input.delayed[0].title} está acima das horas previstas.`,
        "Há {n} trabalhos acima das horas previstas."
      )
    );
  }

  if (input.deliveries.length > 0) {
    sentences.push(
      countPhrase(
        input.deliveries.length,
        `A viatura ${input.deliveries[0].title} está pronta para entrega.`,
        "Há {n} viaturas prontas para entrega."
      )
    );
  }

  if (input.quotes.length > 0) {
    sentences.push(
      countPhrase(
        input.quotes.length,
        "Há um orçamento sem resposta há mais de quatro dias.",
        "Há {n} orçamentos sem resposta há mais de quatro dias."
      )
    );
  }

  if (input.stock.length > 0) {
    sentences.push(
      countPhrase(
        input.stock.length,
        `O material ${input.stock[0].title} está abaixo do stock mínimo.`,
        "Há {n} materiais abaixo do stock mínimo."
      )
    );
  }

  if (input.unavailableLabels.length > 0) {
    sentences.push(
      `Não consegui consultar ${joinWithE(input.unavailableLabels)}.`
    );
  }

  const hasRegisters =
    input.agenda.length > 0 ||
    input.activeWorks.length > 0 ||
    input.blocked.length > 0 ||
    input.quality.length > 0 ||
    input.delayed.length > 0 ||
    input.deliveries.length > 0 ||
    input.quotes.length > 0 ||
    input.stock.length > 0;

  if (!hasRegisters && input.unavailableLabels.length === 0) {
    sentences.push(
      "As fontes responderam e não encontrei marcações nem trabalhos ativos para hoje."
    );
  }

  return sentences.join(" ");
}
