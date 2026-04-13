import { useState, useMemo } from 'react';
import type { DFA } from '../engine/types';
import { generateStrings } from '../engine';

interface StringGeneratorProps {
  dfa: DFA | null;
}

export function StringGenerator({ dfa }: StringGeneratorProps) {
  const [maxLength, setMaxLength] = useState(5);
  const [maxCount, setMaxCount] = useState(50);

  const strings = useMemo(() => {
    if (!dfa || dfa.states.length === 0) return [];
    return generateStrings(dfa, { maxLength, maxCount });
  }, [dfa, maxLength, maxCount]);

  const copyAll = () => {
    const text = strings.map(s => s || 'ε').join('\n');
    navigator.clipboard.writeText(text);
  };

  if (!dfa || dfa.states.length === 0) {
    return (
      <div className="glass-card" style={{ padding: '20px' }}>
        <div className="section-title">String Generator</div>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', margin: 0 }}>
          Enter a valid regex to generate accepted strings.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card animate-fade-in" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div className="section-title" style={{ margin: 0 }}>String Generator</div>
        {strings.length > 0 && (
          <button onClick={copyAll} className="btn-secondary" style={{ padding: '3px 10px', fontSize: '0.72rem' }}>
            Copy all
          </button>
        )}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '14px' }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
            Max length: <span style={{ color: 'var(--color-accent-red)', fontWeight: 600 }}>{maxLength}</span>
          </label>
          <input
            type="range" min={0} max={10} value={maxLength}
            onChange={e => setMaxLength(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--color-accent-red)' }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
            Max count: <span style={{ color: 'var(--color-accent-red)', fontWeight: 600 }}>{maxCount}</span>
          </label>
          <input
            type="range" min={10} max={100} step={10} value={maxCount}
            onChange={e => setMaxCount(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--color-accent-red)' }}
          />
        </div>
      </div>

      {strings.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', margin: 0, fontStyle: 'italic' }}>
          No strings found up to length {maxLength}.
        </p>
      ) : (
        <>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.72rem', marginBottom: '10px' }}>
            <span style={{ color: 'var(--color-accent-red)', fontWeight: 600 }}>{strings.length}</span> strings found
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '220px', overflowY: 'auto' }}>
            {strings.map((s, i) => (
              <span key={i} className="chip">
                {s === '' ? <span style={{ color: 'var(--color-accent-pink)', fontStyle: 'italic' }}>ε</span> : s}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
