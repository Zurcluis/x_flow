/**
 * Medidas e limiares do cenário Oficina X-Motion.
 *
 * A parede fica atrás da viatura e é escondida quando a câmara passa para o
 * lado de trás; o teto não existe como plano sólido, apenas calhas suspensas,
 * e é escondido nas vistas de topo. Manter estes valores puros permite testar
 * a lógica de oclusão sem WebGL.
 */
export const WORKSHOP_SCENE = {
  wallZ: -4.6,
  wallHideBelowZ: -3.9,
  wallWidth: 22,
  wallHeight: 9,
  wallCenterY: 4.5,
  wallColor: "#171b1d",
  floorY: -0.006,
  floorSize: 40,
  floorColor: "#4e5358",
  ceilingHideAboveY: 4.6,
  ceilingY: 5.45,
  ceilingRowsX: [-3.35, -2.65, -0.35, 0.35, 2.65, 3.35] as const,
  ceilingBarLength: 8.4,
  ceilingBarWidth: 0.16,
  ceilingColor: "#eaf4ff",
  neonZ: -4.52,
  neonMarkY: 2.64,
  neonTextY: 1.58,
  neonMarkScale: 0.0048,
  neonAmber: "#ff7a00",
  neonWhite: "#ffffff",
} as const;

/** A parede só é desenhada quando a câmara está do lado da frente. */
export function shouldShowWorkshopWall(cameraZ: number): boolean {
  return cameraZ >= WORKSHOP_SCENE.wallHideBelowZ;
}

/** As calhas de teto desaparecem antes de a câmara subir acima delas. */
export function shouldShowWorkshopCeiling(cameraY: number): boolean {
  return cameraY <= WORKSHOP_SCENE.ceilingHideAboveY;
}
