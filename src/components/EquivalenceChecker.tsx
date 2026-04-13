import { useState } from 'react';
import { RegexInput } from './RegexInput';
import { RegexPalette } from './RegexPalette';
import {
  parseRegex,
  regexToNFA,
  nfaToDFA,
  minimizeDFA,
  checkEquivalence,
  ParseError,
} from '../engine';
import type { EquivalenceResult } from '../engine/types';

export function EquivalenceChecker() {
  const [regexA, setRegexA] = useState('');
  const [regexB, setRegexB] = useState('');
  const [activeInput, setActiveInput] = useState<'a' | 'b'>('a');
  const [result, setResult] = useState<EquivalenceResult | null>(null);
  const [errorA, setErrorA] = useState<string | null>(null);
  const [errorB, setErrorB] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const handleCheck = () => {
    setResult(null);
    setErrorA(null);
    setErrorB(null);

    let minA;
    try {
      const astA = parseRegex(regexA);
      minA = minimizeDFA(nfaToDFA(regexToNFA(astA)));
    } catch (e) {
      setErrorA(e instanceof ParseError ? e.message : 'Invalid regex');
      return;
    }

    let minB;
    try {
      const astB = parseRegex(regexB);
      minB = minimizeDFA(nfaToDFA(regexToNFA(astB)));
    } catch (e) {
      setErrorB(e instanceof ParseError ? e.message : 'Invalid regex');
      return;
    }

    setChecking(true);
    setTimeout(() => {
      setResult(checkEquivalence(minA, minB));
      setChecking(false);
    }, 280);
  };

  const handleInsert = (symbol: string) => {
    if (activeInput === 'a') setRegexA(prev => prev + symbol);
    else setRegexB(prev => prev + symbol);
  };


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Dual inputs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {(['a', 'b'] as const).map(side => {
          const isActive = activeInput === side;
          return (
            <div
              key={side}
              className="glass-card"
              style={{
                padding: '18px',
                borderColor: isActive ? 'var(--color-accent-pink)' : undefined,
                cursor: 'pointer',
              }}
              onClick={() => setActiveInput(side)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '22px',
                  height: '22px',
                  borderRadius: '5px',
                  background: isActive ? 'var(--color-accent-red)' : 'var(--color-bg-tertiary)',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  color: isActive ? '#fff' : 'var(--color-text-muted)',
                  transition: 'all 0.15s',
                }}>
                  {side.toUpperCase()}
                </span>
                <span className="section-title" style={{ margin: 0 }}>Regex {side.toUpperCase()}</span>
              </div>
              <RegexInput
                value={side === 'a' ? regexA : regexB}
                onChange={v => { if (side === 'a') { setRegexA(v); } else { setRegexB(v); } setResult(null); }}
                error={side === 'a' ? errorA : errorB}
                placeholder={side === 'a' ? 'e.g. (a|b)*' : 'e.g. (b|a)*'}
                id={`regex-${side}-input`}
              />
            </div>
          );
        })}
      </div>

      {/* Shared palette */}
      <div className="glass-card" style={{ padding: '16px' }}>
        <div className="section-title" style={{ marginBottom: '8px' }}>
          Inserting into Regex {activeInput.toUpperCase()}
        </div>
        <RegexPalette onInsert={handleInsert} />
      </div>

      {/* Check button */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={handleCheck}
          className="btn-primary"
          disabled={!regexA || !regexB || checking}
          style={{
            padding: '12px 40px',
            fontSize: '0.9375rem',
            opacity: (!regexA || !regexB || checking) ? 0.45 : 1,
          }}
        >
          {checking ? 'Checking...' : 'Check Equivalence'}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div
          className={`glass-card animate-slide-up ${result.equivalent ? 'glow-success' : 'glow-error'}`}
          style={{
            padding: '24px',
            borderColor: result.equivalent ? '#b8e0ca' : '#f5c0c8',
            textAlign: 'center',
          }}
        >
          <div style={{
            fontSize: '1.375rem',
            fontWeight: 700,
            marginBottom: '8px',
            color: result.equivalent ? 'var(--color-success)' : 'var(--color-error)',
            letterSpacing: '-0.01em',
          }}>
            {result.equivalent ? 'Equivalent' : 'Not Equivalent'}
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', margin: 0 }}>
            {result.equivalent
              ? 'Both expressions define the same language — L(A) = L(B)'
              : (
                <>
                  Counterexample:{' '}
                  <span style={{
                    color: 'var(--color-error)',
                    fontWeight: 700,
                    background: '#fff5f6',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: '1px solid #f5c0c8',
                  }}>
                    "{result.counterexample}"
                  </span>
                </>
              )
            }
          </p>
        </div>
      )}
    </div>
  );
}
