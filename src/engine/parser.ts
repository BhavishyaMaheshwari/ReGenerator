/**
 * Regex Parser — Recursive Descent
 * 
 * Grammar:
 *   regex    → union
 *   union    → concat ('|' concat)*
 *   concat   → postfix postfix*
 *   postfix  → atom ('*' | '+' | '?')*
 *   atom     → LITERAL | '(' regex ')' | 'ε'
 * 
 * Supported literals: a, b, 0, 1
 * Supported operators: | (union), * (star), + (one-or-more), ? (optional)
 */

import type { RegexAST } from './types';

class ParseError extends Error {
  position: number;
  constructor(message: string, position: number) {
    super(message);
    this.name = 'ParseError';
    this.position = position;
  }
}

class RegexParser {
  private pos: number = 0;
  private input: string = '';

  parse(input: string): RegexAST {
    this.pos = 0;
    this.input = input.replace(/\s/g, ''); // strip whitespace

    if (this.input.length === 0) {
      return { type: 'epsilon' };
    }

    const ast = this.parseUnion();

    if (this.pos < this.input.length) {
      throw new ParseError(
        `Unexpected character '${this.input[this.pos]}' at position ${this.pos}`,
        this.pos
      );
    }

    return ast;
  }

  private peek(): string | null {
    if (this.pos >= this.input.length) return null;
    return this.input[this.pos];
  }

  private consume(expected?: string): string {
    const ch = this.peek();
    if (ch === null) {
      throw new ParseError(
        `Unexpected end of input${expected ? `, expected '${expected}'` : ''}`,
        this.pos
      );
    }
    if (expected && ch !== expected) {
      throw new ParseError(
        `Expected '${expected}' but found '${ch}' at position ${this.pos}`,
        this.pos
      );
    }
    this.pos++;
    return ch;
  }

  private parseUnion(): RegexAST {
    let left = this.parseConcat();

    while (this.peek() === '|') {
      this.consume('|');
      const right = this.parseConcat();
      left = { type: 'union', left, right };
    }

    return left;
  }

  private parseConcat(): RegexAST {
    const parts: RegexAST[] = [];

    while (
      this.peek() !== null &&
      this.peek() !== ')' &&
      this.peek() !== '|'
    ) {
      parts.push(this.parsePostfix());
    }

    if (parts.length === 0) {
      return { type: 'epsilon' };
    }

    // Build left-associative concat tree
    let result = parts[0];
    for (let i = 1; i < parts.length; i++) {
      result = { type: 'concat', left: result, right: parts[i] };
    }

    return result;
  }

  private parsePostfix(): RegexAST {
    let operand = this.parseAtom();

    while (this.peek() === '*' || this.peek() === '+' || this.peek() === '?') {
      const op = this.consume();
      if (op === '*') {
        operand = { type: 'star', operand };
      } else if (op === '+') {
        // a+ = a·a*
        operand = { type: 'concat', left: operand, right: { type: 'star', operand } };
      } else if (op === '?') {
        // a? = a|ε
        operand = { type: 'union', left: operand, right: { type: 'epsilon' } };
      }
    }

    return operand;
  }

  private parseAtom(): RegexAST {
    const ch = this.peek();

    if (ch === null) {
      throw new ParseError('Unexpected end of input', this.pos);
    }

    // Grouped expression
    if (ch === '(') {
      this.consume('(');
      const inner = this.parseUnion();
      this.consume(')');
      return inner;
    }

    // Epsilon literal
    if (ch === 'ε' || ch === 'ϵ') {
      this.consume();
      return { type: 'epsilon' };
    }

    // Empty set
    if (ch === '∅') {
      this.consume();
      return { type: 'empty' };
    }

    // Literal characters
    if (this.isLiteral(ch)) {
      this.consume();
      return { type: 'literal', value: ch };
    }

    // Invalid character
    throw new ParseError(
      `Unexpected character '${ch}' at position ${this.pos}. Valid characters: a, b, 0, 1, |, *, +, ?, (, ), ε`,
      this.pos
    );
  }

  private isLiteral(ch: string): boolean {
    return /^[a-z0-9]$/.test(ch);
  }
}

// ─── Public API ─────────────────────────────────────────────────

const parser = new RegexParser();

export function parseRegex(input: string): RegexAST {
  return parser.parse(input);
}

export function astToString(ast: RegexAST): string {
  switch (ast.type) {
    case 'literal':
      return ast.value;
    case 'epsilon':
      return 'ε';
    case 'empty':
      return '∅';
    case 'concat':
      return `${wrapIfNeeded(ast.left, 'concat')}${wrapIfNeeded(ast.right, 'concat')}`;
    case 'union':
      return `${astToString(ast.left)}|${astToString(ast.right)}`;
    case 'star':
      return `${wrapIfNeeded(ast.operand, 'star')}*`;
    case 'plus':
      return `${wrapIfNeeded(ast.operand, 'star')}+`;
    case 'optional':
      return `${wrapIfNeeded(ast.operand, 'star')}?`;
  }
}

function wrapIfNeeded(ast: RegexAST, parentType: string): string {
  const s = astToString(ast);
  if (parentType === 'star' && (ast.type === 'concat' || ast.type === 'union')) {
    return `(${s})`;
  }
  if (parentType === 'concat' && ast.type === 'union') {
    return `(${s})`;
  }
  return s;
}

export function getAlphabet(ast: RegexAST): string[] {
  const chars = new Set<string>();
  collectAlphabet(ast, chars);
  return Array.from(chars).sort();
}

function collectAlphabet(ast: RegexAST, chars: Set<string>): void {
  switch (ast.type) {
    case 'literal':
      chars.add(ast.value);
      break;
    case 'concat':
    case 'union':
      collectAlphabet(ast.left, chars);
      collectAlphabet(ast.right, chars);
      break;
    case 'star':
    case 'plus':
    case 'optional':
      collectAlphabet(ast.operand, chars);
      break;
  }
}

export { ParseError };
