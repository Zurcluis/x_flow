export type AssistantVoiceGender = "female" | "male";

export interface AssistantVoice {
  id: string;
  label: string;
  gender: AssistantVoiceGender;
  description: string;
}

export const ASSISTANT_VOICES: ReadonlyArray<AssistantVoice> = [
  {
    id: "Charon",
    label: "Charon",
    gender: "male",
    description: "Grave, calma e natural",
  },
  {
    id: "Orus",
    label: "Orus",
    gender: "male",
    description: "Firme e direta",
  },
  {
    id: "Algenib",
    label: "Algenib",
    gender: "male",
    description: "Madura, com textura",
  },
  {
    id: "Puck",
    label: "Puck",
    gender: "male",
    description: "Mais leve e descontraída",
  },
  {
    id: "Kore",
    label: "Kore",
    gender: "female",
    description: "Firme e clara",
  },
  {
    id: "Aoede",
    label: "Aoede",
    gender: "female",
    description: "Suave e leve",
  },
  {
    id: "Sulafat",
    label: "Sulafat",
    gender: "female",
    description: "Calorosa e serena",
  },
];

export const DEFAULT_ASSISTANT_VOICE = "Charon";

export const ASSISTANT_SAMPLE_SPEECH =
  "Olá, sou o assistente X-Flow. Posso dar-te o resumo do dia, responder sobre produção, orçamentos e stock, ou ajudar-te a encontrar o que precisas.";

export function findAssistantVoice(
  id: string | null | undefined
): AssistantVoice | null {
  if (!id) return null;
  return ASSISTANT_VOICES.find((voice) => voice.id === id) ?? null;
}

export function assistantVoiceOrDefault(
  id: string | null | undefined
): AssistantVoice {
  return (
    findAssistantVoice(id) ??
    findAssistantVoice(DEFAULT_ASSISTANT_VOICE) ??
    ASSISTANT_VOICES[0]
  );
}

export function defaultVoiceForGender(
  gender: AssistantVoiceGender
): AssistantVoice {
  return (
    ASSISTANT_VOICES.find(
      (voice) => voice.gender === gender && voice.id === DEFAULT_ASSISTANT_VOICE
    ) ??
    ASSISTANT_VOICES.find((voice) => voice.gender === gender) ??
    assistantVoiceOrDefault(DEFAULT_ASSISTANT_VOICE)
  );
}
