import { useState } from 'react';

interface PaletteItem {
  symbol: string;
  display: string;
  tooltip: string;
  category: 'alphabet' | 'operator' | 'grouping';
}

const PALETTE_ITEMS: PaletteItem[] = [
  { symbol: 'a', display: 'a', tooltip: 'Literal character a', category: 'alphabet' },
  { symbol: 'b', display: 'b', tooltip: 'Literal character b', category: 'alphabet' },
  { symbol: '0', display: '0', tooltip: 'Literal character 0', category: 'alphabet' },
  { symbol: '1', display: '1', tooltip: 'Literal character 1', category: 'alphabet' },
  { symbol: '|', display: '|', tooltip: 'Union — matches either left or right', category: 'operator' },
  { symbol: '*', display: '*', tooltip: 'Kleene star — zero or more repetitions', category: 'operator' },
  { symbol: '+', display: '+', tooltip: 'One or more — at least one repetition', category: 'operator' },
  { symbol: '?', display: '?', tooltip: 'Optional — zero or one occurrence', category: 'operator' },
  { symbol: '(', display: '(', tooltip: 'Open group', category: 'grouping' },
  { symbol: ')', display: ')', tooltip: 'Close group', category: 'grouping' },
  { symbol: 'ε', display: 'ε', tooltip: 'Epsilon — the empty string', category: 'grouping' },
];

interface RegexPaletteProps {
  onInsert: (symbol: string) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  alphabet: 'Alphabet',
  operator: 'Operators',
  grouping: 'Grouping',
};

const CATEGORY_COLORS: Record<string, { text: string; border: string; bg: string }> = {
  alphabet: { text: 'var(--color-accent-red)', border: 'var(--color-accent-blush)', bg: 'var(--color-accent-light)' },
  operator: { text: 'var(--color-text-secondary)', border: 'var(--color-border-default)', bg: 'var(--color-bg-tertiary)' },
  grouping: { text: 'var(--color-accent-pink)', border: 'var(--color-accent-blush)', bg: '#fff5f8' },
};

export function RegexPalette({ onInsert }: RegexPaletteProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const categories = ['alphabet', 'operator', 'grouping'] as const;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {categories.map((cat) => {
        const colors = CATEGORY_COLORS[cat];
        return (
          <div key={cat}>
            <div className="section-title" style={{ fontSize: '0.65rem', marginBottom: '6px' }}>
              {CATEGORY_LABELS[cat]}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {PALETTE_ITEMS.filter(item => item.category === cat).map((item) => {
                const key = item.symbol + item.category;
                const isHovered = hovered === key;
                return (
                  <div key={key} className="tooltip-container">
                    <button
                      onClick={() => onInsert(item.symbol)}
                      onMouseEnter={() => setHovered(key)}
                      onMouseLeave={() => setHovered(null)}
                      aria-label={item.tooltip}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '36px',
                        height: '36px',
                        borderRadius: '7px',
                        border: `1px solid ${isHovered ? colors.border : 'var(--color-border-default)'}`,
                        background: isHovered ? colors.bg : '#fff',
                        color: isHovered ? colors.text : 'var(--color-text-secondary)',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                        fontSize: '0.9375rem',
                        cursor: 'pointer',
                        transition: 'all 0.12s ease',
                        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                      }}
                    >
                      {item.display}
                    </button>
                    <div className="tooltip">{item.tooltip}</div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
