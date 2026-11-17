import { z } from "zod";

export const configSchema = z
  .object({
    service: z.enum(["vinil", "ppf", "color-ppf"]).default("vinil"),
    color: z.enum([
      "original",
      "#f4f4f0",
      "#acb4bb",
      "#555b62",
      "#202328",
      "#c32c35",
      "#eb6a2f",
      "#ecc53d",
      "#246451",
      "#2855a3",
      "#90becf",
      "#735486",
    ]),
    finish: z.enum(["Brilhante", "Fosco", "Acetinado", "Metálico"]),
    headlights: z
      .enum(["Original", "Transparente", "Fumado leve", "Fumado médio", "Fumado escuro"])
      .default("Original"),
    chromeDelete: z
      .object({
        doors: z.boolean().default(false),
        front: z.boolean().default(false),
        rear: z.boolean().default(false),
        mirrors: z.boolean().default(false),
        finish: z.enum(["Preto brilho", "Preto mate"]).default("Preto brilho"),
      })
      .strict()
      .default({
        doors: false,
        front: false,
        rear: false,
        mirrors: false,
        finish: "Preto brilho",
      }),
    model: z.enum(["nano-banana-pro", "gpt-image-2", "flux-kontext", "qwen-image-edit"]),
  })
  .strict();

export const aspectRatios = [
  "1:1",
  "2:3",
  "3:2",
  "3:4",
  "4:3",
  "9:16",
  "16:9",
  "21:9",
] as const;

export type AspectRatio = (typeof aspectRatios)[number];

export function nearestAspectRatio(width: number, height: number): AspectRatio {
  return aspectRatios.reduce((best, ratio) => {
    const numeric = (r: string) => {
      const [w, h] = r.split(":").map(Number);
      return w / h;
    };
    return Math.abs(Math.log(width / height / numeric(ratio))) <
      Math.abs(Math.log(width / height / numeric(best)))
      ? ratio
      : best;
  }, aspectRatios[0] as AspectRatio);
}

export const requestSchema = z
  .object({
    image: z
      .string()
      .max(8_000_000)
      .regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/),
    config: configSchema,
    aspectRatio: z.enum(aspectRatios).default("3:2"),
  })
  .strict();

export type CarConfig = z.infer<typeof configSchema>;
