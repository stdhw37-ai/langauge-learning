export const DAY = 86400000;
export function complete(records, id, now = Date.now()) {
  if (records[id]) return records;
  return { ...records, [id]: { completedAt: now, due: now + DAY, stage: 0 } };
}
export function review(records, id, remembered, now = Date.now()) {
  const old = records[id];
  if (!old) return records;
  const stage = remembered ? Math.min(old.stage + 1, 3) : 0;
  return { ...records, [id]: { ...old, stage, due: now + [1, 3, 7, 14][stage] * DAY } };
}
export function dueLessons(lessons, records, now = Date.now()) {
  return lessons.filter(l => records[l.id] && records[l.id].due <= now);
}
