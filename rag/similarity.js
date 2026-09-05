/**
 * Cosine similarity between two equal-length numeric vectors.
 *
 * Measures the angle between the vectors, not the distance between their
 * endpoints — magnitude is deliberately divided out so that two embeddings
 * pointing in nearly the same direction score close to 1, regardless of
 * how long either vector happens to be. See rag/README.md (Step 1) for why
 * that property is specifically what we want for comparing text embeddings.
 *
 * Returns a value in [-1, 1]: 1 = same direction, 0 = unrelated
 * (perpendicular), -1 = opposite direction.
 */
function cosineSimilarity(a, b) {
  if (a.length !== b.length) {
    throw new Error(`Vector length mismatch: ${a.length} vs ${b.length}`);
  }

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  magA = Math.sqrt(magA);
  magB = Math.sqrt(magB);

  if (magA === 0 || magB === 0) return 0; // guard against a zero vector

  return dot / (magA * magB);
}

module.exports = { cosineSimilarity };
