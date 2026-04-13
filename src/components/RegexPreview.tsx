import React from 'react';
import type { RegexAST } from '../engine/types';

interface RegexPreviewProps {
  ast: RegexAST | null;
  error: string | null;
  rawInput: string;
}

export function RegexPreview({ ast, error, rawInput }: RegexPreviewProps) {
  if (!rawInput) {
    return (
      <div className="glass-card" style={{ padding: '14px 16px' }}>
        <div className="section-title">Preview</div>
        <p style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', margin: 0 }}>
          Type a regex to see the parsed structure...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card animate-fade-in" style={{ padding: '14px 16px', borderColor: '#f5c0c8' }}>
        <div className="section-title" style={{ color: 'var(--color-error)' }}>Parse Error</div>
        <p style={{ color: 'var(--color-error)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', margin: 0, lineHeight: 1.5 }}>
          {error}
        </p>
      </div>
    );
  }

  if (!ast) return null;

  return (
    <div className="glass-card animate-fade-in" style={{ padding: '14px 16px' }}>
      <div className="section-title">Parsed Structure</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9375rem', lineHeight: 2 }}>
        {renderAST(ast)}
      </div>
    </div>
  );
}

function renderAST(ast: RegexAST): React.JSX.Element {
  switch (ast.type) {
    case 'literal':
      return (
        <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
          {ast.value}
        </span>
      );
    case 'epsilon':
      return (
        <span style={{ color: 'var(--color-accent-pink)', fontStyle: 'italic' }}>ε</span>
      );
    case 'empty':
      return (
        <span style={{ color: 'var(--color-text-muted)' }}>∅</span>
      );
    case 'concat':
      return (
        <span>
          {renderAST(ast.left)}
          <span style={{ color: 'var(--color-text-muted)', margin: '0 1px' }}>·</span>
          {renderAST(ast.right)}
        </span>
      );
    case 'union':
      return (
        <span>
          {needsWrap(ast.left) ? <span style={{ color: 'var(--color-accent-pink)' }}>(</span> : null}
          {renderAST(ast.left)}
          {needsWrap(ast.left) ? <span style={{ color: 'var(--color-accent-pink)' }}>)</span> : null}
          <span style={{ color: 'var(--color-accent-red)', fontWeight: 700, margin: '0 3px' }}>|</span>
          {needsWrap(ast.right) ? <span style={{ color: 'var(--color-accent-pink)' }}>(</span> : null}
          {renderAST(ast.right)}
          {needsWrap(ast.right) ? <span style={{ color: 'var(--color-accent-pink)' }}>)</span> : null}
        </span>
      );
    case 'star':
      return (
        <span>
          {needsWrapForPostfix(ast.operand) ? (
            <>
              <span style={{ color: 'var(--color-accent-pink)' }}>(</span>
              {renderAST(ast.operand)}
              <span style={{ color: 'var(--color-accent-pink)' }}>)</span>
            </>
          ) : renderAST(ast.operand)}
          <span style={{ color: 'var(--color-accent-red)', fontWeight: 700 }}>*</span>
        </span>
      );
    case 'plus':
      return (
        <span>
          {needsWrapForPostfix(ast.operand) ? (
            <>
              <span style={{ color: 'var(--color-accent-pink)' }}>(</span>
              {renderAST(ast.operand)}
              <span style={{ color: 'var(--color-accent-pink)' }}>)</span>
            </>
          ) : renderAST(ast.operand)}
          <span style={{ color: 'var(--color-accent-red)', fontWeight: 700 }}>+</span>
        </span>
      );
    case 'optional':
      return (
        <span>
          {needsWrapForPostfix(ast.operand) ? (
            <>
              <span style={{ color: 'var(--color-accent-pink)' }}>(</span>
              {renderAST(ast.operand)}
              <span style={{ color: 'var(--color-accent-pink)' }}>)</span>
            </>
          ) : renderAST(ast.operand)}
          <span style={{ color: 'var(--color-accent-red)', fontWeight: 700 }}>?</span>
        </span>
      );
  }
}

function needsWrap(_ast: RegexAST): boolean {
  return false;
}

function needsWrapForPostfix(ast: RegexAST): boolean {
  return ast.type === 'concat' || ast.type === 'union';
}
