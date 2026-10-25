import { describe, expect, it } from "vitest";
import { pcmToWav, readWavInfo, wavFromPcmResponse } from "@/server/ai/audio";
import { downsamplePcm, encodeWavBlob } from "@/lib/wav";

describe("readWavInfo", () => {
  it("reads the sample rate and duration of a generated WAV", () => {
    const pcm = Buffer.alloc(3200);
    const info = readWavInfo(pcmToWav(pcm, 16000));

    expect(info).not.toBeNull();
    expect(info?.sampleRate).toBe(16000);
    expect(info?.channels).toBe(1);
    expect(info?.bitsPerSample).toBe(16);
    expect(info?.durationSeconds).toBeCloseTo(0.1, 3);
  });

  it("rejects files that are not WAV", () => {
    expect(readWavInfo(Buffer.from("not a wav file"))).toBeNull();
    expect(readWavInfo(Buffer.alloc(10))).toBeNull();
  });
});

describe("encodeWavBlob", () => {
  it("produces a 16 kHz mono WAV recognised by the server", async () => {
    const samples = new Float32Array(1600);
    for (let index = 0; index < samples.length; index += 1) {
      samples[index] = Math.sin((index / 1600) * Math.PI * 2 * 440) * 0.5;
    }

    const blob = encodeWavBlob(samples, 16000);
    const buffer = Buffer.from(await blob.arrayBuffer());
    const info = readWavInfo(buffer);

    expect(blob.type).toBe("audio/wav");
    expect(buffer.length).toBe(44 + samples.length * 2);
    expect(info?.sampleRate).toBe(16000);
    expect(info?.channels).toBe(1);
    expect(info?.bitsPerSample).toBe(16);
    expect(info?.durationSeconds).toBeCloseTo(0.1, 3);
  });
});

describe("downsamplePcm", () => {
  it("reduces 48 kHz audio to 16 kHz and averages each window", () => {
    const samples = new Float32Array(4800).fill(0.25);
    const result = downsamplePcm(samples, 48000, 16000);

    expect(result.length).toBe(1600);
    expect(result[0]).toBeCloseTo(0.25, 5);
  });

  it("returns the same samples when rates match", () => {
    const samples = new Float32Array([0.1, 0.2, 0.3]);
    expect(downsamplePcm(samples, 16000, 16000)).toBe(samples);
  });
});

describe("wavFromPcmResponse", () => {
  it("keeps an audio/wav response untouched", () => {
    const data = Buffer.from("wav-data");
    const result = wavFromPcmResponse(data, "audio/wav");

    expect(result.mimeType).toBe("audio/wav");
    expect(result.data).toBe(data);
  });

  it("wraps raw L16 PCM in a WAV header at the declared rate", () => {
    const data = Buffer.alloc(4800);
    const result = wavFromPcmResponse(data, "audio/L16;codec=pcm;rate=24000");

    expect(result.mimeType).toBe("audio/wav");
    const info = readWavInfo(result.data);
    expect(info?.sampleRate).toBe(24000);
    expect(info?.durationSeconds).toBeCloseTo(0.1, 3);
  });
});
