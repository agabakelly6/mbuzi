// src/lib/assistant/retrieval.ts
//
// A lightweight TF-IDF-style keyword-and-scoring retrieval engine — the
// "search all project knowledge, rank by relevance" step. No embeddings:
// this is a static site with no build-time ML pipeline, and the brief
// explicitly allows a scoring/keyword engine as the practical alternative.
// The whole knowledge base is a few hundred short chunks, so an index
// built once (module load) and scored per-question runs in well under a
// millisecond — there's nothing here that needs a vector database.
import type { KnowledgeChunk, ScoredChunk } from "../../types/assistant";

const STOPWORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
  "do", "does", "did", "have", "has", "had",
  "i", "you", "he", "she", "it", "we", "they", "me", "him", "her", "us", "them",
  "my", "your", "our", "their", "this", "that", "these", "those",
  "and", "or", "but", "if", "so", "of", "at", "by", "for", "with", "about",
  "to", "from", "in", "on", "up", "out", "as", "into", "than", "then",
  "can", "could", "would", "should", "will", "shall", "may", "might",
  "what", "which", "who", "whom", "how", "when", "where", "why",
  "some", "any", "just", "very", "really", "please", "get", "got",
  // Generic filler verbs that show up across almost any question phrasing
  // ("do you offer...", "I want...", "can I get...") without carrying
  // domain-specific meaning — left in, they can coincidentally match an
  // unrelated chunk's title and outweigh the fact that the question's
  // actual subject matched nothing at all.
  "offer", "offers", "offering", "want", "wanted", "wants", "need", "needed",
  "needs", "like", "looking", "give", "provide", "provides",
]);

/** Lowercase, strip punctuation, split, drop stopwords/1-char tokens. Deliberately simple — no stemming library. */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOPWORDS.has(token));
}

/** True if two tokens should count as a match — exact, or a shared 4+ character prefix (cheap stand-in for stemming: "fresh"~"freshness", "deliver"~"delivery"). */
function tokensMatch(a: string, b: string): boolean {
  if (a === b) return true;
  const minLen = 4;
  if (a.length >= minLen && b.length >= minLen) {
    const shorter = a.length < b.length ? a : b;
    const longer = a.length < b.length ? b : a;
    return longer.startsWith(shorter);
  }
  return false;
}

interface Index {
  /** chunk.id -> term frequency map, built from title + text + keywords. */
  termFrequency: Map<string, Map<string, number>>;
  /** term -> inverse document frequency across the whole knowledge base. */
  idf: Map<string, number>;
  /** chunk.id -> tokenized title, for the title-match bonus. */
  titleTokens: Map<string, string[]>;
}

let indexCache: { chunks: KnowledgeChunk[]; index: Index } | null = null;

function buildIndex(chunks: KnowledgeChunk[]): Index {
  const termFrequency = new Map<string, Map<string, number>>();
  const titleTokens = new Map<string, string[]>();
  const documentFrequency = new Map<string, number>();

  for (const chunk of chunks) {
    const tokens = tokenize(`${chunk.title} ${chunk.text} ${(chunk.keywords ?? []).join(" ")}`);
    const tf = new Map<string, number>();
    for (const token of tokens) tf.set(token, (tf.get(token) ?? 0) + 1);
    termFrequency.set(chunk.id, tf);
    titleTokens.set(chunk.id, tokenize(chunk.title));
    for (const token of tf.keys()) documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1);
  }

  // Capped so a term that's coincidentally rare in this small corpus (by
  // chance, not because it's actually distinctive) can't single-handedly
  // outweigh everything else in the score.
  const MAX_IDF = 3;
  const idf = new Map<string, number>();
  const totalDocs = chunks.length;
  for (const [term, count] of documentFrequency) {
    idf.set(term, Math.min(Math.log((totalDocs + 1) / (count + 1)) + 1, MAX_IDF));
  }

  return { termFrequency, idf, titleTokens };
}

function getIndex(chunks: KnowledgeChunk[]): Index {
  if (indexCache && indexCache.chunks === chunks) return indexCache.index;
  const index = buildIndex(chunks);
  indexCache = { chunks, index };
  return index;
}

function scoreChunk(
  queryTokens: string[],
  chunk: KnowledgeChunk,
  index: Index
): { score: number; matchedCount: number } {
  const tf = index.termFrequency.get(chunk.id);
  if (!tf) return { score: 0, matchedCount: 0 };

  let score = 0;
  let matchedCount = 0;
  const chunkTerms = [...tf.keys()];
  const titleTokens = index.titleTokens.get(chunk.id) ?? [];

  for (const queryToken of queryTokens) {
    let bestTermFreq = 0;
    let bestIdf = 0;
    for (const chunkToken of chunkTerms) {
      if (!tokensMatch(queryToken, chunkToken)) continue;
      const freq = tf.get(chunkToken) ?? 0;
      const idf = index.idf.get(chunkToken) ?? 1;
      if (freq * idf > bestTermFreq * bestIdf) {
        bestTermFreq = freq;
        bestIdf = idf;
      }
    }
    if (bestTermFreq > 0) {
      matchedCount += 1;
      score += bestTermFreq * bestIdf;
    }
    // The title bonus alone can't carry a chunk to relevance — it's added
    // only for tokens that already matched in the body, so one incidental
    // shared word (e.g. "offer" in both "any discounts?" and an unrelated
    // "Do you offer parking?" FAQ title) can't single-handedly outscore a
    // chunk that has no real connection to the question.
    if (bestTermFreq > 0 && titleTokens.some((t) => tokensMatch(queryToken, t))) {
      score += 1;
    }
  }

  return { score, matchedCount };
}

/** Minimum score for a chunk to be considered genuinely relevant, not a coincidental stopword-adjacent match. Used by synthesize.ts to decide whether to answer or admit the knowledge base has nothing on this. */
export const RELEVANCE_THRESHOLD = 1.2;

export function retrieve(query: string, chunks: KnowledgeChunk[], topK = 5): ScoredChunk[] {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  const index = getIndex(chunks);
  // Require most of the question's meaningful words to actually appear in
  // a chunk, not just one — otherwise a single coincidental shared word
  // between an unrelated FAQ and the question can outrank chunks with no
  // real connection to it at all. A short 1-2 word query only needs one
  // match; longer questions need at least half their content words found.
  const minMatches = queryTokens.length <= 2 ? 1 : Math.ceil(queryTokens.length / 2);

  const scored: ScoredChunk[] = chunks
    .map((chunk) => {
      const { score, matchedCount } = scoreChunk(queryTokens, chunk, index);
      return { chunk, score, matchedCount };
    })
    .filter((entry) => entry.score > 0 && entry.matchedCount >= minMatches)
    .sort((a, b) => b.score - a.score)
    .map(({ chunk, score }) => ({ chunk, score }));

  return scored.slice(0, topK);
}
