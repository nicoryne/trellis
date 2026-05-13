// Philippine litigation context — matches N-2 team graph seed data topics
import { getAllNotes, createNote } from './idb';
import type { Entity, NoteClassification } from '../types/index';

interface SeedEntry {
  title: string;
  body: string;
  extractedEntities: Entity[];
  classification: NoteClassification;
  isPrivileged: boolean;
}

const SEED_NOTES: SeedEntry[] = [
  {
    title: 'Judge Reyes — cross-examination latitude on expert testimony',
    body: 'Judge Reyes allows broad latitude during cross of expert witnesses but becomes visibly impatient with repetition. Best practice: limit cross to 3 key points, enter exhibits as you go, avoid extended foundations. She prefers counsel to preview the structure of cross before beginning. Objections from opposing counsel on leading questions are consistently overruled if the witness is certified as an expert.',
    extractedEntities: [
      { id: 'seed-e001', type: 'judge', name: 'Judge Reyes', confidence: 0.98 },
      { id: 'seed-e002', type: 'concept', name: 'expert witness cross-examination', confidence: 0.95 },
    ],
    classification: 'observation',
    isPrivileged: false,
  },
  {
    title: 'Damages calculation cross — Garcia & Partners expert pattern',
    body: 'When opposing expert is from Garcia & Partners, they almost always use discounted cash flow with an aggressive terminal growth rate. Most effective challenge: attack the growth rate assumption directly, then move to the discount rate. Request all underlying financial models in discovery early — they often fail to produce working Excel files. Their lead expert Dr. Santos tends to overclaim certainty; push him on confidence intervals and peer review status of his methodology.',
    extractedEntities: [
      { id: 'seed-e003', type: 'party', name: 'Garcia & Partners', confidence: 0.92 },
      { id: 'seed-e004', type: 'witness', name: 'Dr. Santos', confidence: 0.88 },
      { id: 'seed-e005', type: 'concept', name: 'discounted cash flow method', confidence: 0.90 },
      { id: 'seed-e006', type: 'concept', name: 'terminal growth rate', confidence: 0.85 },
    ],
    classification: 'strategy',
    isPrivileged: true,
  },
  {
    title: 'Motion practice — RTC Makati Branch 147 under Judge Soriano',
    body: 'Branch 147 moves fast on summary judgment. Judge Soriano self-imposes a 15-page limit, expects pinpoint citations, and absolutely no string citations. Replies limited to 7 pages. He has dismissed oral argument on MSJs twice in the past year, preferring to rule on papers. File reply briefs early — he sometimes rules before the deadline if both parties have filed.',
    extractedEntities: [
      { id: 'seed-e007', type: 'judge', name: 'Judge Soriano', confidence: 0.97 },
      { id: 'seed-e008', type: 'matter', name: 'RTC Makati Branch 147', confidence: 0.85 },
      { id: 'seed-e009', type: 'concept', name: 'summary judgment', confidence: 0.93 },
    ],
    classification: 'observation',
    isPrivileged: false,
  },
  {
    title: 'Lesson learned — Dela Cruz v. Multinational Corp timeline failure',
    body: 'We lost a critical deposition because we did not pin down the timeline early enough. Witness shifted her account of the key board meeting between depo and trial. For any witness with a complex timeline, create a visual chronology during prep, lock it down in the first 20 minutes of depo, then refer back to it throughout. Never let them re-characterize an event after it has been pinned. Use the prior depo testimony impeachment technique from Rivera v. Pacific Corp as a template.',
    extractedEntities: [
      { id: 'seed-e010', type: 'matter', name: 'Dela Cruz v. Multinational Corp', confidence: 0.94 },
      { id: 'seed-e011', type: 'precedent', name: 'Rivera v. Pacific Corp', confidence: 0.80 },
      { id: 'seed-e012', type: 'concept', name: 'deposition timeline strategy', confidence: 0.91 },
    ],
    classification: 'lesson_learned',
    isPrivileged: true,
  },
  {
    title: 'Opposing counsel — Atty. Bautista (Tan & Reyes) patterns',
    body: 'Atty. Bautista files late objections to exhibits but only in jury trials. In bench trials he rarely objects to foundation. He favors lengthy speaking objections — interrupt immediately; Judge Soriano loses patience with them. He tends to overload the record at trial start with motions in limine that he then waives in practice. His depositions are unfocused — he rarely follows up on admissions. If he opens a favorable topic on cross, let him run with it.',
    extractedEntities: [
      { id: 'seed-e013', type: 'lawyer', name: 'Atty. Bautista', confidence: 0.96 },
      { id: 'seed-e014', type: 'party', name: 'Tan & Reyes', confidence: 0.89 },
      { id: 'seed-e015', type: 'concept', name: 'motions in limine', confidence: 0.87 },
    ],
    classification: 'observation',
    isPrivileged: false,
  },
  {
    title: 'Settlement dynamics — commercial disputes above PHP 50M',
    body: 'In large commercial matters, opposing parties almost always want to settle within 90 days of a strong MSJ ruling or denial. The window is narrow. Push for mediation immediately after any dispositive ruling — after 6 weeks that leverage dissipates. Insurance counsel and client are often misaligned on settlement authority; probe that gap in early discussions. Lead negotiator should never be the same partner handling trial strategy.',
    extractedEntities: [
      { id: 'seed-e016', type: 'concept', name: 'settlement negotiation', confidence: 0.92 },
      { id: 'seed-e017', type: 'concept', name: 'summary judgment leverage', confidence: 0.88 },
    ],
    classification: 'strategy',
    isPrivileged: true,
  },
];

export async function seedPersonalNotes(): Promise<void> {
  const existing = await getAllNotes();
  if (existing.length > 0) return; // idempotent — do not overwrite user's notes

  for (const seed of SEED_NOTES) {
    await createNote({
      title: seed.title,
      body: seed.body,
      contentType: 'text',
      extractedEntities: seed.extractedEntities,
      classification: seed.classification,
      isPrivileged: seed.isPrivileged,
      isPublished: false,
    });
  }
}
