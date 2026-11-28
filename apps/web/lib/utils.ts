// Esqueleto do RED: sem comportamento. O GREEN troca por clsx + tailwind-merge.
export function cn(...inputs: Array<string | false | null | undefined>): string {
  return inputs.filter(Boolean).join(' ');
}
