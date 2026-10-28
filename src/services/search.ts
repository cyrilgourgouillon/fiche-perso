import { SECTIONS } from '../data/sections';

export const normalized = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();

export const SECTION_FILTERS = SECTIONS.flatMap(({ id, label }) => {
  const aliases = {
    armes: ['arme', 'armes', 'weapon', 'weapons'],
    capacites: ['capacite', 'capacites'],
    emplacements_sorts: ['emplacement', 'emplacements'],
    sorts: ['sort', 'sorts', 'spell', 'spells'],
    pieces: ['piece', 'pieces', 'monnaie'],
    equipement: ['equipement', 'objet', 'objets', 'inventaire', 'item', 'items'],
    maitrises: ['maitrise', 'maitrises'],
    quetes: ['quete', 'quetes', 'quest', 'quests'],
    caracteristiques: ['caracteristique', 'caracteristiques', 'competence', 'competences'],
  }[id] || [normalized(label)];
  return aliases.map((alias) => ({ alias, section: id }));
});

function sentenceContainingMatch(text, needle) {
  const sentence = text.split(/(?<=[.!?])\s+|\n+/u)
    .find((part) => normalized(part).includes(needle))?.trim() || text.trim();
  if (sentence.length <= 180) return sentence;
  const matchIndex = normalized(sentence).indexOf(needle);
  const start = Math.max(0, Math.min(matchIndex - 70, sentence.length - 177));
  return `${start > 0 ? '…' : ''}${sentence.slice(start, start + 177).trim()}${start + 177 < sentence.length ? '…' : ''}`;
}

export function fuzzyScore(query, candidate) {
  const needle = normalized(query).trim();
  const haystack = normalized(candidate);
  if (!needle || !haystack) return Infinity;
  if (haystack.includes(needle)) return haystack.startsWith(needle) ? 0 : 1;

  const words = haystack.split(/[^a-z0-9]+/).filter(Boolean);
  const tokens = needle.split(/[^a-z0-9]+/).filter(Boolean);
  let total = 0;
  for (const token of tokens) {
    let best = Infinity;
    for (const word of words) {
      if (word.includes(token)) {
        best = 1;
        break;
      }
      if (Math.abs(word.length - token.length) <= 2) {
        let previous = Array.from({ length: word.length + 1 }, (_, index) => index);
        for (let row = 1; row <= token.length; row += 1) {
          const current = [row];
          for (let column = 1; column <= word.length; column += 1) {
            current[column] = Math.min(
              current[column - 1] + 1,
              previous[column] + 1,
              previous[column - 1] + (token[row - 1] === word[column - 1] ? 0 : 1),
            );
          }
          previous = current;
        }
        best = Math.min(best, previous[word.length]);
      }
    }
    const tolerance = token.length <= 4 ? 1 : 2;
    if (best <= tolerance) {
      total += best;
    } else {
      return Infinity;
    }
  }
  return total + 2;
}

export function matchingEntries(entries, query, limit = 8) {
  return entries
    .map((entry) => {
      const score = fuzzyScore(query, entry.searchText);
      const needle = normalized(query).trim();
      const matchingText = entry.largeText?.find(({ normalized: body }) => body.includes(needle));
      const matchedEntry = matchingText
        ? { ...entry, matchContext: sentenceContainingMatch(matchingText.text, needle) }
        : entry;
      let matchedScore = score;
      if (!Number.isFinite(score) && matchingText) matchedScore = 4;
      return {
        entry: matchedEntry,
        score: matchedScore,
      };
    })
    .filter(({ score }) => Number.isFinite(score))
    .sort((left, right) => left.score - right.score)
    .slice(0, limit)
    .map(({ entry }) => entry);
}

export function scopedSearch(query) {
  const match = /^([^:]+):\s*(.*)$/.exec(query.trim());
  if (!match) return { section: null, term: query.trim() };
  const prefix = normalized(match[1]);
  const filter = SECTION_FILTERS.find(({ alias }) => alias === prefix);
  return filter ? { section: filter.section, term: match[2].trim() } : { section: null, term: query.trim() };
}
