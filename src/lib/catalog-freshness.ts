type Dated = { addedAt?: string | null; publishedAt?: string | null };

export function newestDate(item: Dated) {
  return Math.max(
    Date.parse(item.addedAt ?? "") || 0,
    Date.parse(item.publishedAt ?? "") || 0,
  );
}

export function isNewTemplate(item: Dated) {
  const elapsed = Date.now() - newestDate(item);
  return elapsed >= 0 && elapsed < 30 * 24 * 60 * 60 * 1000;
}
