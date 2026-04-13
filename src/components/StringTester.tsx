import { useState, useMemo } from 'react';
import type { DFA, SimulationResult } from '../engine/types';
import { simulateString } from '../engine';

interface StringTesterProps {
  dfa: DFA | null;
}

export function StringTester({ dfa }: StringTesterProps) {
  const [testString, setTestString] = useState('');
  const [batchMode, setBatchMode] = useState(false);
  const [batchInput, setBatchInput] = useState('');

  const result: SimulationResult | null = useMemo(() => {
    if (!dfa || dfa.states.length === 0 || batchMode) return null;
    return simulateString(dfa, testString);
  }, [dfa, testString, batchMode]);

  const batchResults: { str: string; result: SimulationResult }[] = useMemo(() => {
    if (!dfa || dfa.states.length === 0 || !batchMode) return [];
    return batchInput.split('\n')
      .filter(l => l.trim() !== '')
      .map(str => ({ str: str.trim(), result: simulateString(dfa, str.trim()) }));
  }, [dfa, batchInput, batchMode]);

  if (!dfa || dfa.states.length === 0) {
    return (
      <div className="glass-card" style={{ padding: '20px' }}>
        <div className="section-title">String Tester</div>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', margin: 0 }}>
          Enter a valid regex to test string acceptance.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card animate-fade-in" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div className="section-title" style={{ margin: 0 }}>String Tester</div>
        <button
          onClick={() => setBatchMode(!batchMode)}
          className="btn-secondary"
          style={{ padding: '3px 10px', fontSize: '0.72rem' }}
        >
          {batchMode ? 'Single' : 'Batch'}
        </button>
      </div>

      {!batchMode ? (
        <>
          <input
            type="text"
            value={testString}
            onChange={e => setTestString(e.target.value)}
            placeholder="Enter string to test (empty = ε)..."
            className="input-field"
            spellCheck={false}
            id="test-string-input"
            style={{ marginBottom: '14px' }}
          />

          {result && (
            <div className="animate-fade-in">
              <div style={{ marginBottom: '14px' }}>
                <span className={`badge ${result.accepted ? 'badge-success' : 'badge-error'}`}
                  style={{ fontSize: '0.875rem', padding: '6px 16px' }}>
                  {result.accepted ? 'Accepted' : 'Rejected'}
                </span>
              </div>

              {result.path.length > 0 && (
                <div>
                  <div className="section-title" style={{ fontSize: '0.65rem' }}>State Path</div>
                  <div className="state-path">
                    <div className="state-node">q{dfa.startState}</div>
                    {result.path.map((step, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div className="transition-arrow">
                          <span className="symbol">{step.symbol}</span>
                          <span>→</span>
                        </div>
                        <div className={`state-node ${i === result.path.length - 1 ? (result.accepted ? 'accept' : 'reject') : ''}`}>
                          q{step.nextStateId}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.path.length === 0 && (
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', margin: 0 }}>
                  Empty string — start state {result.accepted ? 'is' : 'is not'} accepting.
                </p>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          <textarea
            value={batchInput}
            onChange={e => setBatchInput(e.target.value)}
            placeholder="One string per line..."
            className="input-field"
            style={{ minHeight: '100px', resize: 'vertical', marginBottom: '14px' }}
            spellCheck={false}
            id="batch-test-input"
          />

          {batchResults.length > 0 && (
            <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border-default)' }}>
                    <th style={{ textAlign: 'left', padding: '6px 10px', color: 'var(--color-text-muted)', fontWeight: 600 }}>String</th>
                    <th style={{ textAlign: 'center', padding: '6px 10px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {batchResults.map(({ str, result: r }, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                      <td style={{ padding: '6px 10px' }}>
                        {str || <span style={{ color: 'var(--color-accent-pink)', fontStyle: 'italic' }}>ε</span>}
                      </td>
                      <td style={{ textAlign: 'center', padding: '6px 10px' }}>
                        <span className={`badge ${r.accepted ? 'badge-success' : 'badge-error'}`}>
                          {r.accepted ? 'Accepted' : 'Rejected'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
