/**
 * String Simulator — Run strings against a DFA
 * 
 * Tracks the path of states traversed for visualization.
 */

import type { DFA, SimulationResult, SimulationStep } from './types';

export function simulateString(dfa: DFA, input: string): SimulationResult {
  if (dfa.states.length === 0) {
    return { accepted: false, path: [], finalState: -1 };
  }

  const acceptSet = new Set(dfa.acceptStates);

  // Build transition lookup
  const transLookup = new Map<string, number>();
  for (const state of dfa.states) {
    for (const t of state.transitions) {
      transLookup.set(`${state.id},${t.symbol}`, t.to);
    }
  }

  let currentState = dfa.startState;
  const path: SimulationStep[] = [];

  for (const symbol of input) {
    const nextState = transLookup.get(`${currentState},${symbol}`);

    if (nextState === undefined) {
      // No transition — string is rejected (stuck)
      return {
        accepted: false,
        path,
        finalState: currentState,
      };
    }

    path.push({
      stateId: currentState,
      symbol,
      nextStateId: nextState,
    });

    currentState = nextState;
  }

  return {
    accepted: acceptSet.has(currentState),
    path,
    finalState: currentState,
  };
}
