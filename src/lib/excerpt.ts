/** Shorten text without splitting a word. A word that would be cut is left out. */
export function excerpt(text: string, limit: number) {
  const value = text.replace(/\s+/g, " ").trim();
  if (value.length <= limit) return value;
  const head = value.slice(0, limit);
  const next = value[limit];
  const complete = !next || /\s/.test(next);
  const cut = (
    complete ? head : head.slice(0, Math.max(head.lastIndexOf(" "), 0))
  ).trimEnd();
  return cut ? `${cut}…` : "";
}
