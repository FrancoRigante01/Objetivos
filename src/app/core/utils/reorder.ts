export function moveItem<T extends { id: string }>(items: T[], id: string, targetId: string): T[] {
  const from = items.findIndex(item => item.id === id);
  const to = items.findIndex(item => item.id === targetId);
  if (from === -1 || to === -1 || from === to) {
    return items;
  }
  const result = [...items];
  const [moved] = result.splice(from, 1);
  result.splice(to, 0, moved);
  return result;
}
