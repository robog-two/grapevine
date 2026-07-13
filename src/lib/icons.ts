/**
 * Stock vector icons (The Noun Project, attribution embedded in each SVG —
 * see public/icons/*.svg) used to visually differentiate people & folders,
 * per the product spec: "used by the end user to basically differentiate
 * people and folders visually."
 */
export const PERSON_ICONS = [
  'noun-cat-8144321.svg',
  'noun-cat-8217251.svg',
  'noun-dog-1567382.svg',
  'noun-fish-1585670.svg',
  'noun-flower-1567356.svg',
  'noun-jellyfish-1585683.svg',
  'noun-snail-1585637.svg',
  'noun-spider-1607747.svg',
  'noun-star-1607744.svg',
  'noun-tree-branch-1567357.svg',
] as const;

export function iconSrc(iconKey: string): string {
  return `/icons/${iconKey}`;
}

export function pickIcon(seed: number): string {
  return PERSON_ICONS[Math.abs(seed) % PERSON_ICONS.length];
}
