/**
 * Subset Construction: NFA → DFA
 * 
 * Converts an ε-NFA to a DFA using the powerset/subset construction algorithm.
 * Each DFA state represents a set of NFA states.
 */

import type { NFA, DFA, DFAState, NFAState } from './types';

function epsilonClosure(nfa: NFA, stateIds: Set<number>): Set<number> {
  const closure = new Set(stateIds);
  const stack = Array.from(stateIds);

  while (stack.length > 0) {
    const stateId = stack.pop()!;
    const state = nfa.states.find(s => s.id === stateId);
    if (!state) continue;

    for (const t of state.transitions) {
      if (t.symbol === null && !closure.has(t.to)) {
        closure.add(t.to);
        stack.push(t.to);
      }
    }
  }

  return closure;
}

function move(nfa: NFA, stateIds: Set<number>, symbol: string): Set<number> {
  const result = new Set<number>();

  for (const stateId of stateIds) {
    const state = nfa.states.find(s => s.id === stateId);
    if (!state) continue;

    for (const t of state.transitions) {
      if (t.symbol === symbol) {
        result.add(t.to);
      }
    }
  }

  return result;
}

function setToKey(s: Set<number>): string {
  return Array.from(s).sort((a, b) => a - b).join(',');
}

function setToLabel(s: Set<number>): string {
  const arr = Array.from(s).sort((a, b) => a - b);
  return `{${arr.map(x => `q${x}`).join(', ')}}`;
}

export function nfaToDFA(nfa: NFA): DFA {
  // Use the NFA's alphabet, but ensure it's not empty
  const alphabet = nfa.alphabet.length > 0 ? nfa.alphabet : ['a', 'b'];

  const startClosure = epsilonClosure(nfa, new Set([nfa.startState]));
  const startKey = setToKey(startClosure);

  const dfaStatesMap = new Map<string, { id: number; nfaStates: Set<number> }>();
  let nextId = 0;

  dfaStatesMap.set(startKey, { id: nextId++, nfaStates: startClosure });

  const queue: string[] = [startKey];
  const dfaStates: DFAState[] = [];
  const acceptStates: number[] = [];

  // Build lookup for NFA states by id
  const nfaStateMap = new Map<number, NFAState>();
  for (const s of nfa.states) {
    nfaStateMap.set(s.id, s);
  }

  while (queue.length > 0) {
    const currentKey = queue.shift()!;
    const current = dfaStatesMap.get(currentKey)!;

    const isAccept = Array.from(current.nfaStates).some(id =>
      nfa.acceptStates.includes(id)
    );

    const dfaState: DFAState = {
      id: current.id,
      transitions: [],
      isAccept,
      label: setToLabel(current.nfaStates),
    };

    if (isAccept) {
      acceptStates.push(current.id);
    }

    for (const symbol of alphabet) {
      const moved = move(nfa, current.nfaStates, symbol);
      const closure = epsilonClosure(nfa, moved);

      if (closure.size === 0) {
        // Dead state — we'll add a dead state later if needed
        continue;
      }

      const key = setToKey(closure);

      if (!dfaStatesMap.has(key)) {
        dfaStatesMap.set(key, { id: nextId++, nfaStates: closure });
        queue.push(key);
      }

      dfaState.transitions.push({
        symbol,
        to: dfaStatesMap.get(key)!.id,
      });
    }

    dfaStates.push(dfaState);
  }

  // Sort states by id
  dfaStates.sort((a, b) => a.id - b.id);

  return {
    states: dfaStates,
    startState: 0,
    acceptStates,
    alphabet,
  };
}
