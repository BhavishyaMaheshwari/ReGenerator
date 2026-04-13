/**
 * String Generator — BFS on DFA
 * 
 * Enumerates all strings accepted by the DFA up to a maximum length,
 * sorted by length then lexicographically.
 */

import type { DFA } from './types';

export interface GeneratorOptions {
  maxLength: number;  // Maximum string length (default 5)
  maxCount: number;   // Maximum number of strings to generate (default 50)
}

const DEFAULT_OPTIONS: GeneratorOptions = {
  maxLength: 5,
  maxCount: 50,
};

export function generateStrings(dfa: DFA, options: Partial<GeneratorOptions> = {}): string[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { maxLength, maxCount } = opts;

  if (dfa.states.length === 0) return [];

  const alphabet = [...dfa.alphabet].sort();
  const acceptSet = new Set(dfa.acceptStates);
  const results: string[] = [];

  // BFS: each entry is (currentStateId, currentString)
  const queue: { stateId: number; str: string }[] = [];
  queue.push({ stateId: dfa.startState, str: '' });

  // Build transition lookup
  const transLookup = new Map<string, number>();
  for (const state of dfa.states) {
    for (const t of state.transitions) {
      transLookup.set(`${state.id},${t.symbol}`, t.to);
    }
  }

  while (queue.length > 0 && results.length < maxCount) {
    const { stateId, str } = queue.shift()!;

    // Check if current state is accepting
    if (acceptSet.has(stateId)) {
      results.push(str);
      if (results.length >= maxCount) break;
    }

    // Don't extend beyond max length
    if (str.length >= maxLength) continue;

    // Extend with each symbol in the alphabet
    for (const symbol of alphabet) {
      const nextState = transLookup.get(`${stateId},${symbol}`);
      if (nextState !== undefined) {
        queue.push({ stateId: nextState, str: str + symbol });
      }
    }
  }

  return results;
}
