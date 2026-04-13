import { useState, useMemo, useCallback } from 'react';
import { RegexInput } from './components/RegexInput';
import { RegexPalette } from './components/RegexPalette';
import { RegexPreview } from './components/RegexPreview';
import { VisualizationPanel } from './components/VisualizationPanel';
import { StringGenerator } from './components/StringGenerator';
import { StringTester } from './components/StringTester';
import { EquivalenceChecker } from './components/EquivalenceChecker';
import { processRegex, ParseError } from './engine';
import type { RegexAST, DFA } from './engine/types';

type Tab = 'playground' | 'equivalence';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('playground');
  const [regexStr, setRegexStr] = useState('(a|b)*abb');

  const { ast, nfa, dfa, minDfa, error } = useMemo(() => {
    if (!regexStr.trim()) {
      return { ast: null, nfa: null, dfa: null, minDfa: null, error: null };
    }
    try {
      const result = processRegex(regexStr);
      return { ...result, error: null };
    } catch (e) {
      if (e instanceof ParseError) {
        return { ast: null, nfa: null, dfa: null, minDfa: null, error: e.message };
      }
      return { ast: null, nfa: null, dfa: null, minDfa: null, error: 'Invalid regex' };
    }
  }, [regexStr]) as {
    ast: RegexAST | null;
    nfa: NFA | null;
    dfa: DFA | null;
    minDfa: DFA | null;
    error: string | null;
  };

  const handlePaletteInsert = useCallback((symbol: string) => {
    setRegexStr(prev => prev + symbol);
  }, []);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'playground', label: 'Playground' },
    { key: 'equivalence', label: 'Equivalence' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-bg-primary)' }}>
      {/* Header */}
      <header style={{
        padding: '0 40px',
        borderBottom: '1px solid var(--color-border-subtle)',
        background: '#fff',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: 'var(--color-accent-red)',
          }} />
          <span style={{
            fontWeight: 700,
            fontSize: '0.9375rem',
            letterSpacing: '-0.01em',
            color: 'var(--color-text-primary)',
          }}>
            ReGenerator
          </span>
        </div>

        <nav className="tab-nav">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Main Content */}
      <main style={{
        flex: 1,
        padding: '28px 40px',
        maxWidth: '1360px',
        margin: '0 auto',
        width: '100%',
      }}>
        {activeTab === 'playground' ? (
          <PlaygroundView
            regexStr={regexStr}
            onRegexChange={setRegexStr}
            onPaletteInsert={handlePaletteInsert}
            ast={ast}
            minDfa={minDfa}
            error={error}
          />
        ) : (
          <EquivalenceChecker />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        padding: '14px 40px',
        borderTop: '1px solid var(--color-border-subtle)',
        background: '#fff',
      }}>
      </footer>
    </div>
  );
}

// ─── Playground View ──────────────────────────────────────────

interface PlaygroundViewProps {
  regexStr: string;
  onRegexChange: (value: string) => void;
  onPaletteInsert: (symbol: string) => void;
  ast: RegexAST | null;
  minDfa: DFA | null;
  error: string | null;
}

function PlaygroundView({ regexStr, onRegexChange, onPaletteInsert, ast, minDfa, error }: PlaygroundViewProps) {
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top: Input + Palette | Visualization */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', alignItems: 'start' }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-card" style={{ padding: '18px' }}>
            <RegexInput
              value={regexStr}
              onChange={onRegexChange}
              error={error}
              label="Regular Expression"
              id="main-regex-input"
            />
          </div>

          <div className="glass-card" style={{ padding: '16px' }}>
            <div className="section-title">Palette</div>
            <RegexPalette onInsert={onPaletteInsert} />
          </div>

          <RegexPreview ast={ast} error={error} rawInput={regexStr} />
        </div>

        {/* Right column: Visualization */}
        <VisualizationPanel minDfa={minDfa} />
      </div>

      {/* Bottom: Generator + Tester */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <StringGenerator dfa={minDfa} />
        <StringTester dfa={minDfa} />
      </div>
    </div>
  );
}

export default App;
