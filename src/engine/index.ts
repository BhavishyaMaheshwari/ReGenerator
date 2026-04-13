/**
 * Engine Index — convenience re-exports and pipeline functions
 */

export { parseRegex, astToString, getAlphabet, ParseError } from './parser';
export { regexToNFA } from './thompson';
export { nfaToDFA } from './subset';
export { minimizeDFA } from './minimizer';
export { checkEquivalence } from './equivalence';
export { generateStrings } from './generator';
export type { GeneratorOptions } from './generator';
export { simulateString } from './simulator';
export type {
  RegexAST,
  NFA,
  DFA,
  NFAState,
  DFAState,
  NFATransition,
  DFATransition,
  SimulationResult,
  SimulationStep,
  EquivalenceResult,
  GraphNode,
  GraphEdge,
  AutomataGraphData,
} from './types';

import type { RegexAST, NFA, DFA, AutomataGraphData, GraphEdge } from './types';
import { parseRegex } from './parser';
import { regexToNFA } from './thompson';
import { nfaToDFA } from './subset';
import { minimizeDFA } from './minimizer';

/**
 * Full pipeline: regex string → { ast, nfa, dfa, minDfa }
 */
export function processRegex(regexStr: string): {
  ast: RegexAST;
  nfa: NFA;
  dfa: DFA;
  minDfa: DFA;
} {
  const ast = parseRegex(regexStr);
  const nfa = regexToNFA(ast);
  const dfa = nfaToDFA(nfa);
  const minDfa = minimizeDFA(dfa);
  return { ast, nfa, dfa, minDfa };
}

/**
 * Convert NFA to graph data for visualization
 */
export function nfaToGraphData(nfa: NFA): AutomataGraphData {
  const nodes = nfa.states.map(s => ({
    id: s.id,
    label: `q${s.id}`,
    isStart: s.id === nfa.startState,
    isAccept: nfa.acceptStates.includes(s.id),
  }));

  // Merge parallel edges (same source, same target) into one edge with combined labels
  const edgeMap = new Map<string, GraphEdge>();

  for (const state of nfa.states) {
    for (const t of state.transitions) {
      const key = `${state.id}->${t.to}`;
      const label = t.symbol === null ? 'ε' : t.symbol;

      if (edgeMap.has(key)) {
        const existing = edgeMap.get(key)!;
        if (!existing.label.split(', ').includes(label)) {
          existing.label += `, ${label}`;
        }
      } else {
        edgeMap.set(key, {
          source: state.id,
          target: t.to,
          label,
        });
      }
    }
  }

  return { nodes, edges: Array.from(edgeMap.values()) };
}

/**
 * Convert DFA to graph data for visualization
 */
export function dfaToGraphData(dfa: DFA): AutomataGraphData {
  const nodes = dfa.states.map(s => ({
    id: s.id,
    label: s.label || `q${s.id}`,
    isStart: s.id === dfa.startState,
    isAccept: dfa.acceptStates.includes(s.id),
  }));

  // Merge parallel edges
  const edgeMap = new Map<string, GraphEdge>();

  for (const state of dfa.states) {
    for (const t of state.transitions) {
      const key = `${state.id}->${t.to}`;

      if (edgeMap.has(key)) {
        const existing = edgeMap.get(key)!;
        if (!existing.label.split(', ').includes(t.symbol)) {
          existing.label += `, ${t.symbol}`;
        }
      } else {
        edgeMap.set(key, {
          source: state.id,
          target: t.to,
          label: t.symbol,
        });
      }
    }
  }

  return { nodes, edges: Array.from(edgeMap.values()) };
}
