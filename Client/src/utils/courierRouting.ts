import type { Letter } from '../types/api';

/** Mirrors mock-server/server.cjs's DHL_LIABILITY_THRESHOLD /
 *  requiresDhl - kept in sync BY HAND, same as the two files'
 *  PASSWORD_POLICY_PATTERN copies (a CommonJS server and a TS module
 *  can't share code across that boundary). Used here purely to show a
 *  "DHL Priority" hint before auto-assign runs; the server is what
 *  actually enforces the routing. */
const DHL_LIABILITY_THRESHOLD = 25_000_000;

export function requiresDhl(letter: Pick<Letter, 'priority' | 'liabilityValue'>): boolean {
  return letter.priority === 'High' || Number(letter.liabilityValue) > DHL_LIABILITY_THRESHOLD;
}
