/**
 * Trellis MVP Seed Script
 * Owner: Nicolo
 *
 * Seeds the database with:
 *   1. Three demo user accounts (from PRD §2.1)
 *   2. 20 published insight nodes with embeddings (from PRD §2.8)
 *   3. Entity nodes extracted from insights
 *   4. Edges connecting insights to entities
 *
 * Idempotent: checks for existing data before inserting.
 * Run: `npm run seed` or `POST /api/seed`
 */

import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local', override: true });

import bcrypt from 'bcrypt';
import pool from '../db/pool';
import { insertNode, insertEdge, getNodeCount } from '../db/queries';
import { generateEmbedding } from '../services/embedding';
import { seedInsights } from './insights';
import { deriveAllEdges } from './deriveEdges';

const BCRYPT_ROUNDS = 10;

// ─── Demo Accounts (PRD §2.1) ──────────────────────────────────────────────

const demoUsers = [
  {
    email: 'litigator@acme.law',
    password: 'demo',
    display_name: 'Ana Mendoza',
    role: 'lawyer',
  },
  {
    email: 'lead@acme.law',
    password: 'demo',
    display_name: 'Carlos Reyes',
    role: 'practice_group_lead',
  },
  {
    email: 'admin@acme.law',
    password: 'demo',
    display_name: 'Diana Santos',
    role: 'knowledge_admin',
  },
];

async function seedUsers(): Promise<string> {
  // Check if users exist
  const existing = await pool.query('SELECT COUNT(*)::int AS count FROM users');
  if (existing.rows[0].count > 0) {
    console.log('[seed] Users already exist, skipping.');
    const lawyerResult = await pool.query(
      "SELECT id FROM users WHERE email = 'litigator@acme.law'"
    );
    return lawyerResult.rows[0].id;
  }

  let lawyerId = '';
  for (const user of demoUsers) {
    const hash = await bcrypt.hash(user.password, BCRYPT_ROUNDS);
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, display_name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [user.email, hash, user.display_name, user.role]
    );
    if (user.role === 'lawyer') {
      lawyerId = result.rows[0].id;
    }
    console.log(`[seed] Created user: ${user.email} (${user.role})`);
  }

  return lawyerId;
}

async function seedTeamGraph(contributorId: string): Promise<void> {
  // Check if team graph already has data
  const count = await getNodeCount();
  if (count > 0) {
    console.log(`[seed] Team graph already has ${count} nodes, skipping.`);
    return;
  }

  console.log(`[seed] Seeding ${seedInsights.length} insights...`);

  for (let i = 0; i < seedInsights.length; i++) {
    const insight = seedInsights[i];
    console.log(`[seed] (${i + 1}/${seedInsights.length}) Embedding: "${insight.title}"`);

    // Generate embedding for insight
    const embeddingText = `${insight.title} ${insight.body}`;
    const embedding = await generateEmbedding(embeddingText);

    // Insert insight node
    const insightNodeId = await insertNode({
      node_type: 'insight',
      title: insight.title,
      body: insight.body,
      summary: insight.summary,
      contributor_id: contributorId,
      embedding,
      metadata: { classification: insight.classification },
    });

    // Insert entity nodes and edges
    for (const entity of insight.entities) {
      // Check if entity already exists (dedup by name + type)
      const existingEntity = await pool.query(
        `SELECT id FROM team_graph_nodes
         WHERE node_type = $1 AND LOWER(title) = LOWER($2)`,
        [entity.type, entity.name]
      );

      let entityNodeId: string;
      if (existingEntity.rows.length > 0) {
        entityNodeId = existingEntity.rows[0].id;
      } else {
        // Generate embedding for entity
        const entityEmbedding = await generateEmbedding(entity.name);
        entityNodeId = await insertNode({
          node_type: entity.type,
          title: entity.name,
          summary: entity.name,
          embedding: entityEmbedding,
        });
      }

      // Create edge from insight to entity
      await insertEdge({
        source_node_id: insightNodeId,
        target_node_id: entityNodeId,
        edge_type: 'mentions',
      });
    }
  }

  const finalCount = await getNodeCount();
  console.log(`[seed] Team graph seeded with ${finalCount} total nodes.`);
}

export async function runSeed(): Promise<{ users: number; nodes: number }> {
  console.log('[seed] Starting Trellis seed...');

  const contributorId = await seedUsers();
  await seedTeamGraph(contributorId);

  // Derive Obsidian-style connections (Phase 1, 3, 4)
  console.log('[seed] Deriving Obsidian-style graph connections...');
  const derived = await deriveAllEdges();
  console.log(`[seed] Derived edges: ${derived.sharedEntity} shared-entity, ${derived.embeddingSimilarity} embedding-similarity, ${derived.entityCooccurrence} co-occurrence`);

  const userCount = await pool.query('SELECT COUNT(*)::int AS count FROM users');
  const nodeCount = await getNodeCount();
  const edgeCount = await pool.query('SELECT COUNT(*)::int AS count FROM team_graph_edges');

  console.log('[seed] Seed complete.');
  console.log(`[seed] Users: ${userCount.rows[0].count}`);
  console.log(`[seed] Team graph nodes: ${nodeCount}`);
  console.log(`[seed] Team graph edges: ${edgeCount.rows[0].count}`);

  return { users: userCount.rows[0].count, nodes: nodeCount };
}

// Run directly if executed as a script
if (require.main === module) {
  runSeed()
    .then(() => pool.end())
    .catch((err) => {
      console.error('[seed] Fatal error:', err);
      pool.end();
      process.exit(1);
    });
}
