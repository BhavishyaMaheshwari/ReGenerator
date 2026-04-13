/**
 * DFA Equivalence Checker
 * 
 * Two DFAs are equivalent iff they accept the same language.
 * We check this by building the product automaton and finding
 * a string accepted by one but not the other (symmetric difference).
 */

import type { DFA, EquivalenceResult } from './types';

interface ProductState {
  a: number; // state index in DFA A
  b: number; // state index in DFA B
}

export function checkEquivalence(dfaA: DFA, dfaB: DFA): EquivalenceResult {
  // Align alphabets — use the union
  const alphabet = Array.from(new Set([...dfaA.alphabet, ...dfaB.alphabet])).sort();

  // Build transition lookup tables
  const transA = buildTransLookup(dfaA, alphabet);
  const transB = buildTransLookup(dfaB, alphabet);

  const acceptA = new Set(dfaA.acceptStates);
  const acceptB = new Set(dfaB.acceptStates);

  // BFS through the product automaton
  const startA = dfaA.states.length > 0 ? dfaA.startState : -1;
  const startB = dfaB.states.length > 0 ? dfaB.startState : -1;

  if (startA === -1 && startB === -1) {
    return { equivalent: true };
  }

  const visited = new Set<string>();
  const queue: { state: ProductState; path: string }[] = [];

  const startState: ProductState = { a: startA, b: startB };
  const startKey = stateKey(startState);
  visited.add(startKey);
  queue.push({ state: startState, path: '' });

  // Check if start states disagree
  const startAAccept = startA !== -1 && acceptA.has(startA);
  const startBAccept = startB !== -1 && acceptB.has(startB);
  if (startAAccept !== startBAccept) {
    return { equivalent: false, counterexample: 'ε (empty string)' };
  }

  while (queue.length > 0) {
    const { state, path } = queue.shift()!;

    for (const symbol of alphabet) {
      const nextA = state.a !== -1 ? (transA.get(`${state.a},${symbol}`) ?? -1) : -1;
      const nextB = state.b !== -1 ? (transB.get(`${state.b},${symbol}`) ?? -1) : -1;

      const nextState: ProductState = { a: nextA, b: nextB };
      const key = stateKey(nextState);

      if (visited.has(key)) continue;
      visited.add(key);

      const nextAAccept = nextA !== -1 && acceptA.has(nextA);
      const nextBAccept = nextB !== -1 && acceptB.has(nextB);

      const newPath = path + symbol;

      if (nextAAccept !== nextBAccept) {
        return {
          equivalent: false,
          counterexample: newPath,
        };
      }

      // Only continue if at least one state is valid
      if (nextA !== -1 || nextB !== -1) {
        queue.push({ state: nextState, path: newPath });
      }
    }
  }

  return { equivalent: true };
}

function stateKey(state: ProductState): string {
  return `${state.a},${state.b}`;
}

function buildTransLookup(dfa: DFA, alphabet: string[]): Map<string, number> {
  const lookup = new Map<string, number>();

  for (const state of dfa.states) {
    for (const t of state.transitions) {
      if (alphabet.includes(t.symbol)) {
        lookup.set(`${state.id},${t.symbol}`, t.to);
      }
    }
  }

  return lookup;
}
