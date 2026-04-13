/**
 * Thompson's Construction: RegexAST → ε-NFA
 * 
 * Each AST node produces an NFA fragment with a unique start and accept state.
 * Fragments are combined according to regex operations.
 */

import type { RegexAST, NFA, NFAState } from './types';
import { getAlphabet } from './parser';

let stateCounter = 0;

function newState(isAccept: boolean = false): NFAState {
  return {
    id: stateCounter++,
    transitions: [],
    isAccept,
  };
}

interface NFAFragment {
  start: NFAState;
  accept: NFAState;
  states: NFAState[];
}

function buildFragment(ast: RegexAST): NFAFragment {
  switch (ast.type) {
    case 'literal':
      return buildLiteral(ast.value);
    case 'epsilon':
      return buildEpsilon();
    case 'empty':
      return buildEmpty();
    case 'concat':
      return buildConcat(ast.left, ast.right);
    case 'union':
      return buildUnion(ast.left, ast.right);
    case 'star':
      return buildStar(ast.operand);
    case 'plus':
      // a+ is already desugared to a·a* in the parser, but handle it here too
      return buildConcat(ast.operand, { type: 'star', operand: ast.operand });
    case 'optional':
      // a? is already desugared to a|ε in the parser, but handle it here too
      return buildUnion(ast.operand, { type: 'epsilon' });
  }
}

function buildLiteral(symbol: string): NFAFragment {
  const start = newState();
  const accept = newState(true);
  start.transitions.push({ symbol, to: accept.id });
  return { start, accept, states: [start, accept] };
}

function buildEpsilon(): NFAFragment {
  const start = newState();
  const accept = newState(true);
  start.transitions.push({ symbol: null, to: accept.id });
  return { start, accept, states: [start, accept] };
}

function buildEmpty(): NFAFragment {
  const start = newState();
  const accept = newState(true);
  // No transitions — accepts nothing
  return { start, accept, states: [start, accept] };
}

function buildConcat(leftAST: RegexAST, rightAST: RegexAST): NFAFragment {
  const left = buildFragment(leftAST);
  const right = buildFragment(rightAST);

  // Connect left's accept to right's start via ε
  left.accept.isAccept = false;
  left.accept.transitions.push({ symbol: null, to: right.start.id });

  return {
    start: left.start,
    accept: right.accept,
    states: [...left.states, ...right.states],
  };
}

function buildUnion(leftAST: RegexAST, rightAST: RegexAST): NFAFragment {
  const left = buildFragment(leftAST);
  const right = buildFragment(rightAST);

  const start = newState();
  const accept = newState(true);

  // New start ε-transitions to both branches
  start.transitions.push({ symbol: null, to: left.start.id });
  start.transitions.push({ symbol: null, to: right.start.id });

  // Both accept states ε-transition to new accept
  left.accept.isAccept = false;
  left.accept.transitions.push({ symbol: null, to: accept.id });
  right.accept.isAccept = false;
  right.accept.transitions.push({ symbol: null, to: accept.id });

  return {
    start,
    accept,
    states: [start, ...left.states, ...right.states, accept],
  };
}

function buildStar(operandAST: RegexAST): NFAFragment {
  const inner = buildFragment(operandAST);

  const start = newState();
  const accept = newState(true);

  // ε from new start to inner start
  start.transitions.push({ symbol: null, to: inner.start.id });
  // ε from new start to new accept (for zero repetitions)
  start.transitions.push({ symbol: null, to: accept.id });
  // ε from inner accept to inner start (for repetition)
  inner.accept.isAccept = false;
  inner.accept.transitions.push({ symbol: null, to: inner.start.id });
  // ε from inner accept to new accept
  inner.accept.transitions.push({ symbol: null, to: accept.id });

  return {
    start,
    accept,
    states: [start, ...inner.states, accept],
  };
}

// ─── Public API ─────────────────────────────────────────────────

export function regexToNFA(ast: RegexAST): NFA {
  stateCounter = 0;
  const fragment = buildFragment(ast);

  const alphabet = getAlphabet(ast);

  // Ensure all states have consistent IDs
  const states = fragment.states;
  const acceptStates = states.filter(s => s.isAccept).map(s => s.id);

  return {
    states,
    startState: fragment.start.id,
    acceptStates,
    alphabet,
  };
}
