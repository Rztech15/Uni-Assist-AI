import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanDocumentText, chunkText, cosineSimilarity, keywordRelevanceScore, rankChunks } from './rag.ts';

test('cleanDocumentText normalizes line breaks and excess whitespace', () => {
  const dirty = 'Hello \t world!\r\n\r\n\r\nThis is    a   test.\n\n\n\nFinal.';
  const cleaned = cleanDocumentText(dirty);
  assert.equal(cleaned.includes('\r'), false);
  assert.equal(cleaned.includes('   '), false);
  assert.equal(cleaned.includes('\n\n\n'), false);
});

test('chunkText splits text by paragraph and maintains overlap', () => {
  const sample = `
Paragraph 1 discusses examination rules and grading curves at the university.
Students must achieve at least 50% marks to pass any course.

Paragraph 2 explains makeup exam criteria. A student who misses an exam due to a documented medical emergency may petition the Academic Committee within 7 days.

Paragraph 3 outlines the procedure for filing an exam grade appeal with the department dean within two weeks of result declaration.
`;
  const chunks = chunkText(sample, 'doc-123', 'Exam Regulations', 'Examination Policies', 40, 10);
  assert.ok(chunks.length >= 2, 'Expected at least 2 chunks');
  assert.equal(chunks[0].documentId, 'doc-123');
  assert.equal(chunks[0].category, 'Examination Policies');
  assert.ok(chunks[0].chunkText.includes('examination rules'));
});

test('cosineSimilarity computes exact vector similarity', () => {
  const v1 = [1, 0, 0];
  const v2 = [1, 0, 0];
  const v3 = [0, 1, 0];
  const v4 = [0.6, 0.8, 0];

  assert.equal(Math.round(cosineSimilarity(v1, v2) * 100) / 100, 1.0);
  assert.equal(cosineSimilarity(v1, v3), 0.0);
  assert.equal(Math.round(cosineSimilarity(v1, v4) * 100) / 100, 0.6);
});

test('keywordRelevanceScore rewards query matches', () => {
  const query = 'examination grading rules';
  const text1 = 'The university examination grading rules state that grades A through F are assigned.';
  const text2 = 'The university cafeteria menu offers vegetarian sandwiches and tea.';

  const score1 = keywordRelevanceScore(query, text1);
  const score2 = keywordRelevanceScore(query, text2);

  assert.ok(score1 > score2, 'Relevant text should score higher than irrelevant text');
  assert.ok(score1 > 0.5, 'Exact matches should have high keyword relevance');
});

test('rankChunks filters below threshold and orders by relevance', () => {
  const chunks = [
    {
      id: 'c1',
      documentId: 'd1',
      documentTitle: 'Syllabus CS101',
      category: 'Course Outlines' as const,
      chunkIndex: 0,
      chunkText: 'CS101 Introduction to Programming covers Python data structures, algorithms, recursion, and object oriented programming.',
      pageNumber: 1,
    },
    {
      id: 'c2',
      documentId: 'd2',
      documentTitle: 'Parking Handbook',
      category: 'Student Handbook' as const,
      chunkIndex: 0,
      chunkText: 'Campus parking decals must be affixed to the rear bumper. Violators will receive a citation.',
      pageNumber: 1,
    },
  ];

  const results = rankChunks('Python programming recursion algorithms', null, chunks, 3, 0.1);
  assert.equal(results.length, 1);
  assert.equal(results[0].chunk.id, 'c1');
});
