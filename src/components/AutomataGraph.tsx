import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { AutomataGraphData, GraphEdge } from '../engine/types';

interface AutomataGraphProps {
  data: AutomataGraphData | null;
  width?: number;
  height?: number;
  highlightedPath?: number[]; // state IDs to highlight
}

interface SimNode extends d3.SimulationNodeDatum {
  id: number;
  label: string;
  isStart: boolean;
  isAccept: boolean;
}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  label: string;
  sourceId: number;
  targetId: number;
}

interface HoverState {
  nodeId: number;
  label: string;
  isStart: boolean;
  isAccept: boolean;
  x: number;
  y: number;
  transitions: { edgeLabel: string; targetLabel: string }[];
}

export function AutomataGraph({ data, width = 600, height = 400, highlightedPath }: AutomataGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width, height });
  const [hoverState, setHoverState] = useState<HoverState | null>(null);

  // Responsive sizing
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w } = entry.contentRect;
        if (w > 0) {
          setDimensions({ width: w, height: Math.max(300, Math.min(w * 0.6, 500)) });
        }
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!data || !svgRef.current) return;
    if (data.nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width: w, height: h } = dimensions;
    const nodeRadius = 24;

    // ─── Defs (arrowheads) ─────────────────────────────────────

    const defs = svg.append('defs');

    const arrowPath = 'M0,-4.5 L9,0 L0,4.5';
    const arrowRefX = nodeRadius + 12;

    // Start arrow
    defs.append('marker')
      .attr('id', 'arrowhead-start')
      .attr('markerUnits', 'userSpaceOnUse')
      .attr('viewBox', '0 -6 12 12')
      .attr('refX', arrowRefX)
      .attr('refY', 0)
      .attr('markerWidth', 9)
      .attr('markerHeight', 9)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', arrowPath)
      .attr('fill', '#d63051');
      
    defs.append('filter')
      .attr('id', 'drop-shadow')
      .attr('x', '-30%')
      .attr('y', '-30%')
      .attr('width', '160%')
      .attr('height', '160%')
      .append('feDropShadow')
      .attr('dx', 0)
      .attr('dy', 4)
      .attr('stdDeviation', 6)
      .attr('flood-opacity', 0.15)
      .attr('flood-color', '#d63051');

    // ─── Prepare data ──────────────────────────────────────────

    const nodes: SimNode[] = data.nodes.map(n => ({
      ...n,
      x: w / 2 + (Math.random() - 0.5) * w * 0.4,
      y: h / 2 + (Math.random() - 0.5) * h * 0.4,
    }));

    const nodeMap = new Map<number, SimNode>();
    nodes.forEach(n => nodeMap.set(n.id, n));

    // Merge edges with same source and target
    const edgeMap = new Map<string, GraphEdge>();
    for (const e of data.edges) {
      const key = `${e.source}->${e.target}`;
      if (edgeMap.has(key)) {
        const existing = edgeMap.get(key)!;
        existing.label += `, ${e.label}`;
      } else {
        edgeMap.set(key, { ...e });
      }
    }

    const links: SimLink[] = Array.from(edgeMap.values()).map(e => ({
      source: nodeMap.get(e.source)!,
      target: nodeMap.get(e.target)!,
      label: e.label,
      sourceId: e.source,
      targetId: e.target,
    })).filter(l => l.source && l.target);

    const highlightSet = new Set(highlightedPath || []);

    // ─── Zoom ──────────────────────────────────────────────────

    const g = svg.append('g');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // ─── Force simulation ──────────────────────────────────────

    const simulation = d3.forceSimulation<SimNode>(nodes)
      .force('link', d3.forceLink<SimNode, SimLink>(links)
        .id(d => d.id)
        .distance(120))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(w / 2, h / 2))
      .force('collision', d3.forceCollide(nodeRadius + 20))
      .force('x', d3.forceX(w / 2).strength(0.05))
      .force('y', d3.forceY(h / 2).strength(0.05));

    // ─── Draw edges ────────────────────────────────────────────

    const linkGroup = g.append('g').attr('class', 'edges');

    const linkPaths = linkGroup.selectAll('.edge-group')
      .data(links)
      .enter()
      .append('g')
      .attr('class', 'edge-group');

    const paths = linkPaths.append('path')
      .attr('class', 'edge-path')
      .attr('fill', 'none')
      .attr('stroke-width', 1.5)
      .each(function(d) {
        const isHighlighted = highlightSet.has(d.sourceId) && highlightSet.has(d.targetId);
        d3.select(this)
          .attr('stroke', isHighlighted ? '#e05a6e' : '#c8a8a8')
          .attr('stroke-width', isHighlighted ? 2.5 : 1.5);
      });

    const linkArrows = linkPaths.append('path')
      .attr('class', 'edge-arrow')
      .attr('d', 'M -5.5 -4.5 L 5.5 0 L -5.5 4.5 Z')
      .attr('fill', d => {
        const isHighlighted = highlightSet.has(d.sourceId) && highlightSet.has(d.targetId);
        return isHighlighted ? '#e05a6e' : '#a87070';
      });

    const linkLabels = linkPaths.append('text')
      .attr('class', 'edge-label')
      .text(d => d.label)
      .attr('fill', '#d63051')
      .style('font-family', 'var(--font-mono)')
      .style('font-size', '11.5px')
      .style('font-weight', '700')
      .style('paint-order', 'stroke')
      .style('stroke', '#ffffff')
      .style('stroke-width', '4px')
      .style('stroke-linecap', 'round')
      .style('stroke-linejoin', 'round')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central');

    // ─── Draw start arrow ──────────────────────────────────────

    const startNode = nodes.find(n => n.isStart);
    let startArrow: d3.Selection<SVGLineElement, unknown, null, undefined> | null = null;
    if (startNode) {
      startArrow = g.append('line')
        .attr('class', 'start-arrow')
        .attr('stroke', '#d63051')
        .attr('stroke-width', 2)
        .attr('marker-end', 'url(#arrowhead-start)');
    }

    // ─── Draw nodes ────────────────────────────────────────────

    const nodeGroup = g.append('g').attr('class', 'nodes');

    const nodeG = nodeGroup.selectAll('.node-group')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node-group')
      .style('cursor', 'pointer')
      .on('mouseenter', (event, d) => {
        const outgoingEdges = data.edges.filter(e => e.source === d.id);
        const transitions = outgoingEdges.flatMap(e => {
          const targetNode = nodes.find(n => n.id === e.target);
          return e.label.split(', ').map(l => ({ edgeLabel: l, targetLabel: targetNode?.label || '?' }));
        });
        
        setHoverState({
          nodeId: d.id,
          label: d.label,
          isStart: d.isStart,
          isAccept: d.isAccept,
          x: event.clientX,
          y: event.clientY,
          transitions
        });

        d3.select(event.currentTarget).select('.bg-circle')
          .transition().duration(200)
          .attr('filter', 'url(#drop-shadow)')
          .attr('r', nodeRadius + 3)
          .attr('stroke-width', 2.5);
      })
      .on('mousemove', (event) => {
        setHoverState(prev => prev ? { ...prev, x: event.clientX, y: event.clientY } : null);
      })
      .on('mouseleave', (event) => {
        setHoverState(null);
        d3.select(event.currentTarget).select('.bg-circle')
          .transition().duration(200)
          .attr('filter', null)
          .attr('r', nodeRadius)
          .attr('stroke-width', (d: any) => (highlightSet.has(d.id) || d.isStart || d.isAccept) ? 2.5 : 1.5);
      })
      .call(d3.drag<SVGGElement, SimNode>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
          setHoverState(null);
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      );

    // Main circle
    nodeG.append('circle')
      .attr('class', 'bg-circle')
      .attr('r', nodeRadius)
      .attr('fill', d => highlightSet.has(d.id) ? '#fff0f2' : '#ffffff')
      .attr('stroke', d => {
        if (highlightSet.has(d.id)) return '#e05a6e';
        if (d.isAccept) return '#d63051';
        if (d.isStart) return '#d63051';
        return '#cca3a3';
      })
      .attr('stroke-width', d => (highlightSet.has(d.id) || d.isStart || d.isAccept) ? 2.5 : 1.5)
      .style('transition', 'fill 0.3s ease, stroke 0.3s ease');

    // Accept state double circle
    nodeG.filter(d => d.isAccept)
      .append('circle')
      .attr('r', nodeRadius - 6)
      .attr('fill', 'none')
      .attr('stroke', d => highlightSet.has(d.id) ? '#e05a6e' : '#d63051')
      .attr('stroke-width', 1.5)
      .style('opacity', 0.6);

    // State label
    nodeG.append('text')
      .text(d => d.label)
      .attr('fill', d => (highlightSet.has(d.id) || d.isStart || d.isAccept) ? '#d63051' : '#333333')
      .style('font-family', 'var(--font-mono)')
      .style('font-size', '12px')
      .style('font-weight', '700')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .style('pointer-events', 'none');

    // ─── Tick ──────────────────────────────────────────────────

    simulation.on('tick', () => {
      // Update edge paths
      paths.attr('d', (d) => {
        const source = d.source as SimNode;
        const target = d.target as SimNode;

        if (source.id === target.id) {
          // Self-loop
          const x = source.x!;
          const y = source.y!;
          return `M ${x} ${y - nodeRadius} A ${nodeRadius + 8} ${nodeRadius + 8} 0 1 1 ${x + nodeRadius} ${y}`;
        }

        // Check for reverse edge
        const hasReverse = links.some(l =>
          (l.source as SimNode).id === target.id &&
          (l.target as SimNode).id === source.id
        );

        if (hasReverse) {
          // Curved path
          const dx = target.x! - source.x!;
          const dy = target.y! - source.y!;
          const dr = Math.sqrt(dx * dx + dy * dy) * 0.8;
          return `M ${source.x},${source.y} A ${dr},${dr} 0 0,1 ${target.x},${target.y}`;
        }

        // Straight line
        return `M ${source.x},${source.y} L ${target.x},${target.y}`;
      });

      // Update midpoint arrows dynamically based on exact D3 path len
      const pathNodes = paths.nodes() as SVGPathElement[];
      linkArrows.attr('transform', function(d, i) {
        const pathNode = pathNodes[i];
        if (!pathNode) return '';
        const len = pathNode.getTotalLength();
        if (len === 0) return '';
        
        const midPoint = pathNode.getPointAtLength(len / 2);
        
        // Calculate tangent angle slightly around the midpoint
        const p1 = pathNode.getPointAtLength(Math.max(0, len / 2 - 1));
        const p2 = pathNode.getPointAtLength(Math.min(len, len / 2 + 1));
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI);
        
        return `translate(${midPoint.x}, ${midPoint.y}) rotate(${angle})`;
      });

      // Update edge labels
      linkLabels.attr('x', (d) => {
        const source = d.source as SimNode;
        const target = d.target as SimNode;
        if (source.id === target.id) return source.x!;
        return (source.x! + target.x!) / 2;
      }).attr('y', (d) => {
        const source = d.source as SimNode;
        const target = d.target as SimNode;
        if (source.id === target.id) return source.y! - nodeRadius * 2 - 16;

        const hasReverse = links.some(l =>
          (l.source as SimNode).id === target.id &&
          (l.target as SimNode).id === source.id
        );

        const midY = (source.y! + target.y!) / 2;
        if (hasReverse) {
          const dx = target.x! - source.x!;
          const dy = target.y! - source.y!;
          const norm = Math.sqrt(dx * dx + dy * dy);
          return midY - (dx / norm) * 20;
        }
        return midY - 12;
      });

      // Update node positions
      nodeG.attr('transform', d => `translate(${d.x},${d.y})`);

      // Update start arrow
      if (startArrow && startNode) {
        startArrow
          .attr('x1', startNode.x! - 50)
          .attr('y1', startNode.y!)
          .attr('x2', startNode.x!)
          .attr('y2', startNode.y!);
      }
    });

    // Initial zoom to fit
    simulation.on('end', () => {
      // Calculate bounds
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      nodes.forEach(n => {
        if (n.x! < minX) minX = n.x!;
        if (n.x! > maxX) maxX = n.x!;
        if (n.y! < minY) minY = n.y!;
        if (n.y! > maxY) maxY = n.y!;
      });

      const padding = 60;
      const boundsWidth = maxX - minX + padding * 2;
      const boundsHeight = maxY - minY + padding * 2;
      const scale = Math.min(w / boundsWidth, h / boundsHeight, 1.5);
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      svg.transition().duration(500).call(
        zoom.transform,
        d3.zoomIdentity
          .translate(w / 2, h / 2)
          .scale(scale)
          .translate(-centerX, -centerY)
      );
    });

    return () => {
      simulation.stop();
    };
  }, [data, dimensions, highlightedPath]);

  if (!data || data.nodes.length === 0) {
    return (
      <div ref={containerRef} className="glass-card" style={{ minHeight: '300px', padding: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', margin: 0 }}>
          Enter a valid regex to see the automaton graph
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="glass-card animate-fade-in" style={{ overflow: 'hidden', padding: 0, position: 'relative' }}>
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="automata-svg"
        style={{ display: 'block' }}
      />
      {hoverState && (
        <div style={{
          position: 'fixed',
          top: hoverState.y + 16,
          left: hoverState.x + 16,
          zIndex: 1000,
          pointerEvents: 'none',
          background: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--color-border-subtle)',
          boxShadow: '0 8px 30px rgba(214, 48, 81, 0.12), 0 4px 12px rgba(0,0,0,0.06)',
          borderRadius: '12px',
          padding: '12px 16px',
          fontFamily: 'var(--font-mono)',
          minWidth: '160px',
        }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>State {hoverState.label}</span>
            {hoverState.isStart && <span style={{ background: '#fff0f2', border: '1px solid #f5c0c8', color: '#d63051', fontSize: '9px', padding: '2px 6px', borderRadius: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Start</span>}
            {hoverState.isAccept && <span style={{ background: '#f0fcf5', border: '1px solid #c0eed5', color: '#108945', fontSize: '9px', padding: '2px 6px', borderRadius: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Accept</span>}
          </div>
          
          <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '6px', fontWeight: 600 }}>Transitions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {hoverState.transitions.length === 0 ? (
              <div style={{ color: 'var(--color-text-muted)', fontSize: '11.5px' }}>None</div>
            ) : (
              hoverState.transitions.map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                  <span style={{ 
                    background: '#f8f9fa', 
                    border: '1px solid var(--color-border-subtle)',
                    padding: '1px 6px', 
                    borderRadius: '4px', 
                    color: 'var(--color-accent-red)',
                    fontWeight: 700
                  }}>{t.edgeLabel}</span>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '10px' }}>→</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{t.targetLabel}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
