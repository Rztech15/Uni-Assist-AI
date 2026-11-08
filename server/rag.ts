import type { DocumentChunk, Citation } from '../src/types.ts';

/**
 * Clean and normalize text extracted from documents.
 */
export function cleanDocumentText(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[ \u00A0]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Split text into meaningful chunks with overlap.
 * Uses approximate token/word length and paragraph boundaries.
 */
export function chunkText(
  text: string,
  documentId: string,
  documentTitle: string,
  category: any,
  chunkSize: number = 400,
  chunkOverlap: number = 60
): DocumentChunk[] {
  const paragraphs = text.split(/\n\n+/);
  const chunks: DocumentChunk[] = [];

  let currentWords: string[] = [];
  let chunkIndex = 0;
  let estimatedPage = 1;

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    // Detect section header or page markers
    const pageMatch = trimmed.match(/page\s+(\d+)/i);
    if (pageMatch) {
      estimatedPage = parseInt(pageMatch[1], 10);
    }

    const words = trimmed.split(/\s+/);
    if (currentWords.length + words.length <= chunkSize) {
      currentWords.push(...words);
    } else {
      if (currentWords.length > 0) {
        chunks.push({
          id: `${documentId}-chunk-${chunkIndex++}`,
          documentId,
          documentTitle,
          category,
          chunkIndex: chunkIndex - 1,
          chunkText: currentWords.join(' '),
          pageNumber: estimatedPage,
        });
      }

      // Keep overlap
      const overlapWords = currentWords.slice(Math.max(0, currentWords.length - chunkOverlap));
      currentWords = [...overlapWords, ...words];

      // Advance page counter roughly every ~350 words if no explicit marker
      if (chunks.length % 2 === 0) {
        estimatedPage++;
      }
    }
  }

  if (currentWords.length > 0) {
    chunks.push({
      id: `${documentId}-chunk-${chunkIndex++}`,
      documentId,
      documentTitle,
      category,
      chunkIndex: chunkIndex - 1,
      chunkText: currentWords.join(' '),
      pageNumber: estimatedPage,
    });
  }

  return chunks;
}

/**
 * Cosine similarity between two vector embeddings.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * BM25 / Keyword term matching score to supplement vector retrieval.
 * Creates a robust hybrid search.
 */
export function keywordRelevanceScore(query: string, text: string): number {
  if (!query || !text) return 0;
  const queryTerms = query
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((t) => t.length > 2);

  if (queryTerms.length === 0) return 0;

  const targetText = text.toLowerCase();
  let matches = 0;

  for (const term of queryTerms) {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    const count = (targetText.match(regex) || []).length;
    if (count > 0) {
      matches += Math.min(count, 3); // capped term frequency
    }
  }

  return Math.min(1.0, matches / (queryTerms.length * 1.5));
}

/**
 * Filter and rank chunks against query vector and terms.
 */
export function rankChunks(
  query: string,
  queryEmbedding: number[] | null,
  chunks: DocumentChunk[],
  topK: number = 4,
  minThreshold: number = 0.25
): { chunk: DocumentChunk; score: number }[] {
  const scored = chunks.map((chunk) => {
    let vectorScore = 0;
    if (queryEmbedding && chunk.embedding && chunk.embedding.length > 0) {
      vectorScore = cosineSimilarity(queryEmbedding, chunk.embedding);
    }

    const kwScore = keywordRelevanceScore(query, chunk.chunkText);

    // Hybrid score weighted: vector 60%, keyword 40% (or 100% keyword if no embedding)
    const hybridScore = queryEmbedding && chunk.embedding
      ? vectorScore * 0.65 + kwScore * 0.35
      : kwScore;

    return { chunk, score: hybridScore };
  });

  return scored
    .filter((item) => item.score >= minThreshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/**
 * Format retrieved chunks into verified citations for the UI and model context.
 */
export function buildCitations(ranked: { chunk: DocumentChunk; score: number }[]): Citation[] {
  return ranked.map((item) => {
    const { chunk, score } = item;
    const snippet = chunk.chunkText.length > 220
      ? chunk.chunkText.slice(0, 220) + '...'
      : chunk.chunkText;

    return {
      documentId: chunk.documentId,
      documentTitle: chunk.documentTitle,
      category: chunk.category,
      pageNumber: chunk.pageNumber,
      section: chunk.section || `Section ${chunk.chunkIndex + 1}`,
      excerpt: snippet,
      relevanceScore: Math.round(score * 100) / 100,
    };
  });
}
