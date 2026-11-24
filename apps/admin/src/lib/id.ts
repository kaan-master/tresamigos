export function createSlugId(label: string, prefix: string) {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  return `${prefix}-${slug || "item"}-${suffix}`;
}

/** Unieke id t.o.v. bestaande ids (voorkomt upsert-overschrijven bij “Nieuwe vestiging”). */
export function createUniqueSlugId(label: string, prefix: string, existingIds: Iterable<string>) {
  const taken = new Set(existingIds);
  let id = createSlugId(label, prefix);
  let guard = 0;
  while (taken.has(id) && guard < 8) {
    id = createSlugId(label, prefix);
    guard += 1;
  }
  return id;
}
