export interface WavInfo {
  sampleRate: number;
  channels: number;
  bitsPerSample: number;
  durationSeconds: number;
}

export function readWavInfo(buffer: Buffer): WavInfo | null {
  if (buffer.length < 44) return null;
  if (buffer.toString("ascii", 0, 4) !== "RIFF") return null;
  if (buffer.toString("ascii", 8, 12) !== "WAVE") return null;

  let offset = 12;
  let sampleRate = 0;
  let channels = 0;
  let bitsPerSample = 0;
  let byteRate = 0;
  let dataSize = 0;

  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString("ascii", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const dataOffset = offset + 8;

    if (chunkId === "fmt ") {
      if (chunkSize < 16 || dataOffset + 16 > buffer.length) return null;
      channels = buffer.readUInt16LE(dataOffset + 2);
      sampleRate = buffer.readUInt32LE(dataOffset + 4);
      byteRate = buffer.readUInt32LE(dataOffset + 8);
      bitsPerSample = buffer.readUInt16LE(dataOffset + 14);
    } else if (chunkId === "data") {
      dataSize = Math.min(chunkSize, Math.max(0, buffer.length - dataOffset));
      break;
    }

    offset = dataOffset + chunkSize + (chunkSize % 2);
    if (chunkSize === 0) break;
  }

  if (sampleRate <= 0 || channels <= 0 || bitsPerSample <= 0 || byteRate <= 0) {
    return null;
  }

  return {
    sampleRate,
    channels,
    bitsPerSample,
    durationSeconds: dataSize / byteRate,
  };
}

export function pcmToWav(
  pcm: Buffer,
  sampleRate: number,
  channels = 1,
  bitsPerSample = 16
): Buffer {
  const blockAlign = channels * (bitsPerSample / 8);
  const byteRate = sampleRate * blockAlign;
  const header = Buffer.alloc(44);

  header.write("RIFF", 0, "ascii");
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8, "ascii");
  header.write("fmt ", 12, "ascii");
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36, "ascii");
  header.writeUInt32LE(pcm.length, 40);

  return Buffer.concat([header, pcm]);
}

export function wavFromPcmResponse(
  data: Buffer,
  mimeType: string
): { data: Buffer; mimeType: string } {
  if (!/l16|pcm/i.test(mimeType)) {
    return { data, mimeType };
  }

  const rateMatch = /rate=(\d+)/i.exec(mimeType);
  const sampleRate = rateMatch ? Number(rateMatch[1]) : 24000;
  return {
    data: pcmToWav(data, Number.isFinite(sampleRate) && sampleRate > 0 ? sampleRate : 24000),
    mimeType: "audio/wav",
  };
}
