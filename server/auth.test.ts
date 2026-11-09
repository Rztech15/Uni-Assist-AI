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

test('user-specific KPI stats calculate accurately from dynamic database state', () => {
  const users = db.getUsers();
  const student = users.find((u) => u.role === 'student')!;

  const stats = db.getUserStats(student.id);
  assert.equal(typeof stats.totalConversations, 'number');
  assert.equal(typeof stats.questionsAnswered, 'number');
  assert.equal(typeof stats.savedResponses, 'number');
  assert.equal(typeof stats.studyProgress, 'number');
  assert.ok(stats.totalConversations >= 1, 'Initial seeded conversation exists');
  assert.ok(stats.questionsAnswered >= 1, 'Initial seeded assistant message exists');
  assert.ok(stats.savedResponses >= 1, 'Initial seeded saved response exists');
  assert.ok(stats.studyProgress >= 0 && stats.studyProgress <= 100);
});

test('user registration and retrieval by email works properly', () => {
  const testEmail = `test.user.${Date.now()}@uniassist.edu`;
  const created = db.createUser({
    fullName: 'Fatima Noor',
    email: testEmail,
    role: 'student',
    department: 'Artificial Intelligence',
    university: 'UniAssist Metropolitan University',
  });

  assert.ok(created.id);
  assert.equal(created.fullName, 'Fatima Noor');
  assert.equal(created.email, testEmail);

  const found = db.getUserByEmail(testEmail);
  assert.ok(found);
  assert.equal(found?.id, created.id);
});
