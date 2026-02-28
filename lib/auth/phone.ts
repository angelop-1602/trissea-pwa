export function normalizePhoneE164(raw: string): string {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, '');

  if (!digits) {
    return trimmed;
  }

  if (digits.startsWith('63')) {
    return `+${digits}`;
  }

  if (digits.startsWith('0') && digits.length === 11) {
    return `+63${digits.slice(1)}`;
  }

  return `+${digits}`;
}

export function buildPhoneVariants(...values: string[]): string[] {
  const variants = new Set<string>();

  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) continue;

    const normalized = normalizePhoneE164(trimmed);
    variants.add(trimmed);
    variants.add(normalized);
    variants.add(normalized.replace(/^\+/, ''));
  }

  return Array.from(variants);
}
