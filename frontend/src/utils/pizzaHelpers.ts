const SAUCE_NAMES = new Set(["томатный", "сливочный", "барбекю", "острый"]);
const DOUGH_NAMES = new Set(["тонкое", "традиционное", "толстый край"]);

export function isCustomPizza(modifiers?: string[]): boolean {
  if (!modifiers?.length) return false;
  return modifiers.some((m) => DOUGH_NAMES.has(m.toLowerCase()));
}

export function getSauceFromModifiers(modifiers: string[]): string | null {
  return modifiers.find((m) => SAUCE_NAMES.has(m.toLowerCase())) ?? null;
}

export function getToppingsFromModifiers(modifiers: string[]): string[] {
  return modifiers.filter((m) => {
    const l = m.toLowerCase();
    return !SAUCE_NAMES.has(l) && !DOUGH_NAMES.has(l) && !m.includes("см");
  });
}
