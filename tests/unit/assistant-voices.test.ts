import { describe, expect, it } from "vitest";
import {
  ASSISTANT_SAMPLE_SPEECH,
  ASSISTANT_VOICES,
  DEFAULT_ASSISTANT_VOICE,
  assistantVoiceOrDefault,
  defaultVoiceForGender,
  findAssistantVoice,
} from "@/domains/assistant/voices";

describe("assistant voice catalog", () => {
  it("has a unique id per voice and at least two options per gender", () => {
    const ids = ASSISTANT_VOICES.map((voice) => voice.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ASSISTANT_VOICES.filter((voice) => voice.gender === "male").length).toBeGreaterThan(1);
    expect(
      ASSISTANT_VOICES.filter((voice) => voice.gender === "female").length
    ).toBeGreaterThan(1);
  });

  it("includes the default voice", () => {
    expect(findAssistantVoice(DEFAULT_ASSISTANT_VOICE)).not.toBeNull();
  });

  it("falls back to the default for unknown or missing ids", () => {
    expect(assistantVoiceOrDefault("does-not-exist").id).toBe(
      DEFAULT_ASSISTANT_VOICE
    );
    expect(assistantVoiceOrDefault(null).id).toBe(DEFAULT_ASSISTANT_VOICE);
    expect(assistantVoiceOrDefault(undefined).id).toBe(DEFAULT_ASSISTANT_VOICE);
  });

  it("keeps a known selection", () => {
    const known = ASSISTANT_VOICES[ASSISTANT_VOICES.length - 1];
    expect(assistantVoiceOrDefault(known.id)).toEqual(known);
  });

  it("returns a voice of the requested gender", () => {
    expect(defaultVoiceForGender("female").gender).toBe("female");
    expect(defaultVoiceForGender("male").gender).toBe("male");
  });

  it("has a sample sentence suitable for previewing a voice", () => {
    expect(ASSISTANT_SAMPLE_SPEECH.length).toBeGreaterThan(40);
    expect(ASSISTANT_SAMPLE_SPEECH).toContain("X-Flow");
  });
});
