// ─── Regex AST ──────────────────────────────────────────────────

export type RegexAST =
  | { type: 'literal'; value: string }
  | { type: 'epsilon' }
  | { type: 'empty' }
  | { type: 'concat'; left: RegexAST; right: RegexAST }
  | { type: 'union'; left: RegexAST; right: RegexAST }
  | { type: 'star'; operand: RegexAST }
  | { type: 'plus'; operand: RegexAST }
  | { type: 'optional'; operand: RegexAST };

// ─── NFA ────────────────────────────────────────────────────────

export interface NFATransition {
  symbol: string | null; // null = epsilon transition
  to: number;
}

export interface NFAState {
  id: number;
  transitions: NFATransition[];
  isAccept: boolean;
}

export interface NFA {
  states: NFAState[];
  startState: number;
  acceptStates: number[];
  alphabet: string[];
}

// ─── DFA ────────────────────────────────────────────────────────

export interface DFATransition {
  symbol: string;
  to: number;
}

export interface DFAState {
  id: number;
  transitions: DFATransition[];
  isAccept: boolean;
  label?: string; // e.g. "{q0, q1}" for visualization
}

export interface DFA {
  states: DFAState[];
  startState: number;
  acceptStates: number[];
  alphabet: string[];
}

// ─── Simulation ─────────────────────────────────────────────────

export interface SimulationStep {
  stateId: number;
  symbol: string;
  nextStateId: number;
}

export interface SimulationResult {
  accepted: boolean;
  path: SimulationStep[];
  finalState: number;
}

// ─── Equivalence ────────────────────────────────────────────────

export interface EquivalenceResult {
  equivalent: boolean;
  counterexample?: string; // A string accepted by one but not the other
}

// ─── Graph Visualization ────────────────────────────────────────

export interface GraphNode {
  id: number;
  label: string;
  isStart: boolean;
  isAccept: boolean;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphEdge {
  source: number;
  target: number;
  label: string;
}

export interface AutomataGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
