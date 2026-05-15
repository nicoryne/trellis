import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export function loadPrompt(filename: string): string {
  const localPath = join(__dirname, '../prompts', filename);
  if (existsSync(localPath)) return readFileSync(localPath, 'utf-8');

  const cwdPath = join(process.cwd(), 'src/prompts', filename);
  if (existsSync(cwdPath)) return readFileSync(cwdPath, 'utf-8');

  throw new Error(`[promptLoader] Cannot find prompt file: ${filename}`);
}
