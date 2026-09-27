export function storyByline(person?: string | null, city?: string | null) {
  return [person?.trim(), city?.trim()].filter(Boolean).join("\u2002·\u2002");
}
