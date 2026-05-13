import { openDB, type IDBPDatabase } from 'idb';
import type { PersonalNote, Entity } from '../types/index';

const DB_NAME = 'trellis-personal';
const DB_VERSION = 1;

type TrellisDB = {
  notes: { key: string; value: PersonalNote };
  entities: { key: string; value: Entity };
  personalGraph: { key: string; value: { id: string; data: unknown } };
};

let dbPromise: Promise<IDBPDatabase<TrellisDB>> | null = null;

function getDB(): Promise<IDBPDatabase<TrellisDB>> {
  if (!dbPromise) {
    dbPromise = openDB<TrellisDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('notes')) {
          db.createObjectStore('notes', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('entities')) {
          db.createObjectStore('entities', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('personalGraph')) {
          db.createObjectStore('personalGraph', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export async function createNote(
  data: Omit<PersonalNote, 'id' | 'createdAt' | 'updatedAt'>
): Promise<PersonalNote> {
  const db = await getDB();
  const note: PersonalNote = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await db.put('notes', note);
  return note;
}

export async function getNote(id: string): Promise<PersonalNote | undefined> {
  const db = await getDB();
  return db.get('notes', id);
}

export async function getAllNotes(): Promise<PersonalNote[]> {
  const db = await getDB();
  return db.getAll('notes');
}

export async function updateNote(
  id: string,
  updates: Partial<Omit<PersonalNote, 'id' | 'createdAt'>>
): Promise<PersonalNote> {
  const db = await getDB();
  const existing = await db.get('notes', id);
  if (!existing) throw new Error(`Note ${id} not found`);
  const updated: PersonalNote = { ...existing, ...updates, id, updatedAt: Date.now() };
  await db.put('notes', updated);
  return updated;
}

export async function deleteNote(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('notes', id);
}

export async function saveEntity(entity: Entity): Promise<void> {
  const db = await getDB();
  await db.put('entities', entity);
}

export async function getAllEntities(): Promise<Entity[]> {
  const db = await getDB();
  return db.getAll('entities');
}

/** Resets the DB connection for test isolation. Call in beforeEach when using fake-indexeddb. */
export function _resetDB(): void {
  dbPromise = null;
}
