import { create } from 'zustand';
import * as idb from '../lib/idb';
import type { PersonalNote, OrganizeResponse } from '../types/index';

interface NoteState {
  notes: PersonalNote[];
  activeNoteId: string | null;
  loadNotes: () => Promise<void>;
  saveNote: (
    data: Omit<PersonalNote, 'id' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => Promise<PersonalNote>;
  setActiveNote: (id: string | null) => void;
  updateNoteOrganization: (id: string, result: OrganizeResponse) => Promise<void>;
  removeEntity: (noteId: string, entityId: string) => Promise<void>;
}

export const useNoteStore = create<NoteState>((set, get) => ({
  notes: [],
  activeNoteId: null,

  loadNotes: async () => {
    const notes = await idb.getAllNotes();
    set({ notes });
  },

  saveNote: async (data, existingId) => {
    if (existingId) {
      const updated = await idb.updateNote(existingId, data);
      set(state => ({
        notes: state.notes.map(n => (n.id === existingId ? updated : n)),
      }));
      return updated;
    }
    const note = await idb.createNote(data);
    set(state => ({ notes: [note, ...state.notes] }));
    return note;
  },

  setActiveNote: (id) => set({ activeNoteId: id }),

  updateNoteOrganization: async (id, result) => {
    const updated = await idb.updateNote(id, {
      extractedEntities: result.entities,
      classification: result.classification,
      isPrivileged: result.isPrivileged,
    });
    set(state => ({
      notes: state.notes.map(n => (n.id === id ? updated : n)),
    }));
    for (const entity of result.entities) {
      await idb.saveEntity(entity);
    }
  },

  removeEntity: async (noteId, entityId) => {
    const note = get().notes.find(n => n.id === noteId);
    if (!note) return;
    const nextEntities = note.extractedEntities.filter(e => e.id !== entityId);
    const updated = await idb.updateNote(noteId, { extractedEntities: nextEntities });
    set(state => ({
      notes: state.notes.map(n => (n.id === noteId ? updated : n)),
    }));
  },
}));
