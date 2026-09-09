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

// The new course has different lesson meanings; never mark its lessons complete
// from v1's single-sentence records. The old storage key remains untouched.
export const STORAGE_KEY = 'pharma-talk-situations-v2';
export function restoreState(saved, lessons, cards) {
  const result = { version: 2, language: 'ja', ja: { completed: {}, reviews: {} }, en: { completed: {}, reviews: {} } };
  if (!saved || saved.version !== 2) return result;
  if (['ja', 'en'].includes(saved.language)) result.language = saved.language;
  const ids = { completed: new Set(lessons.map(l => String(l.id))), reviews: new Set(cards.map(p => p.id)) };
  for (const language of ['ja', 'en']) for (const kind of ['completed', 'reviews']) {
    for (const [id, record] of Object.entries(saved[language]?.[kind] || {})) {
      if (ids[kind].has(id) && Number.isFinite(record?.completedAt) && Number.isFinite(record?.due) && Number.isInteger(record?.stage) && record.stage >= 0 && record.stage <= 3) {
        result[language][kind][id] = { completedAt: record.completedAt, due: record.due, stage: record.stage };
      }
    }
  }
  return result;
}
export function completeLesson(journal, lesson, now = Date.now()) {
  let reviews = journal.reviews;
  for (const phrase of lesson.phrases) reviews = complete(reviews, phrase.id, now);
  return { completed: complete(journal.completed, lesson.id, now), reviews };
}
