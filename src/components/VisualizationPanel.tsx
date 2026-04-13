import { useMemo } from 'react';
import { AutomataGraph } from './AutomataGraph';
import type { DFA, AutomataGraphData } from '../engine/types';
import { dfaToGraphData } from '../engine';

interface VisualizationPanelProps {
  minDfa: DFA | null;
  highlightedPath?: number[];
}

export function VisualizationPanel({ minDfa, highlightedPath }: VisualizationPanelProps) {
  const graphData: AutomataGraphData | null = useMemo(() => {
    return minDfa ? dfaToGraphData(minDfa) : null;
  }, [minDfa]);

  const stats = useMemo(() => {
    if (!graphData) return null;
    return { states: graphData.nodes.length, transitions: graphData.edges.length };
  }, [graphData]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div className="section-title" style={{ margin: 0 }}>Min DFA</div>
        {stats && (
          <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
            {stats.states} states · {stats.transitions} transitions
          </span>
        )}
      </div>

      <AutomataGraph
        data={graphData}
        highlightedPath={highlightedPath}
      />
    </div>
  );
}
