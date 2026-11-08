import test from 'node:test';
import assert from 'node:assert/strict';
import { db } from './db.ts';

test('database initializes with seeded university users and roles', () => {
  const users = db.getUsers();
  assert.ok(users.length >= 3, 'Should have student, faculty, and admin users');

  const student = users.find((u) => u.role === 'student');
  const faculty = users.find((u) => u.role === 'faculty');
  const admin = users.find((u) => u.role === 'admin');

  assert.ok(student, 'Student user exists');
  assert.ok(faculty, 'Faculty user exists');
  assert.ok(admin, 'Admin user exists');
  assert.equal(admin?.role, 'admin');
});

test('document management and chunk retrieval enforces indexed status', () => {
  const docs = db.getDocuments();
  assert.ok(docs.length >= 5, 'Should have seeded university policy documents');

  const indexedDocs = docs.filter((d) => d.status === 'indexed');
  assert.ok(indexedDocs.length >= 5, 'All seed documents should be indexed');

  const chunks = db.getAllChunks();
  assert.ok(chunks.length > 5, 'Indexed chunks should be available for RAG search');
});

test('study plan creation and progress tracking', () => {
  const users = db.getUsers();
  const student = users.find((u) => u.role === 'student')!;

  const plan = db.saveStudyPlan({
    userId: student.id,
    title: 'Unit Test Revision',
    subject: 'Algorithms',
    schedule: [{ day: 'Day 1', topic: 'Sorting', hours: 2, completed: false }],
    progress: 0,
  });

  assert.equal(plan.progress, 0);

  const updated = db.updateStudyPlan(plan.id, 50, [
    { day: 'Day 1', topic: 'Sorting', hours: 2, completed: true },
  ]);
  assert.equal(updated?.progress, 50);

  const deleted = db.deleteStudyPlan(plan.id);
  assert.equal(deleted, true);
});

test('analytics calculation provides valid numbers', () => {
  const analytics = db.getAnalytics();
  assert.ok(analytics.totalUsers > 0);
  assert.ok(analytics.totalDocuments > 0);
  assert.ok(analytics.indexedDocuments > 0);
  assert.ok(analytics.averageRatingScore >= 0 && analytics.averageRatingScore <= 100);
});
