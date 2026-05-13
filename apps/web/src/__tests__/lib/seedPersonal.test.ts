import { describe, it, expect, beforeEach } from 'vitest';
// fake-indexeddb via vitest setup
import { seedPersonalNotes } from '../../lib/seedPersonal';
import { getAllNotes, createNote, _resetDB } from '../../lib/idb';

beforeEach(async () => {
  _resetDB();
});

describe('seedPersonalNotes', () => {
  it('creates notes when IndexedDB is empty', async () => {
    await seedPersonalNotes();
    const notes = await getAllNotes();
    expect(notes).toHaveLength(6);
  });

  it('is idempotent — does not re-seed if notes exist', async () => {
    await createNote({
      title: 'Existing note',
      body: 'body',
      contentType: 'text',
      extractedEntities: [],
      classification: 'observation',
      isPrivileged: false,
      isPublished: false,
    });
    await seedPersonalNotes();
    const notes = await getAllNotes();
    // Should only have the one pre-existing note, not the seed set on top
    expect(notes).toHaveLength(1);
  });

  it('each seeded note has extractedEntities populated', async () => {
    await seedPersonalNotes();
    const notes = await getAllNotes();
    const notesWithEntities = notes.filter(n => n.extractedEntities.length > 0);
    expect(notesWithEntities.length).toBeGreaterThan(0);
  });
});
