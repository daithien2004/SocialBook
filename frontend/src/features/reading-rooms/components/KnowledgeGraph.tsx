'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'framer-motion';
import { KnowledgeEntity, KnowledgeRelationship } from '@/features/chapters/types/chapter.interface';
import { ZoomIn, ZoomOut, Maximize2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  type: string;
  importance: number;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  type: string;
  description?: string;
}


interface KnowledgeGraphProps {
  entities: KnowledgeEntity[];
  relationships: KnowledgeRelationship[];
}

export const KnowledgeGraph = ({ entities, relationships }: KnowledgeGraphProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Update dimensions on mount and resize using ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect) {
          setDimensions({
            width: entry.contentRect.width,
            height: entry.contentRect.height,
          });
        }
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Prepare graph data
  const data = useMemo(() => {
    const entityNames = new Set(entities.map(e => e.name));
    
    const nodes: GraphNode[] = entities.map(e => ({
      id: e.name,
      name: e.name,
      type: e.type,
      importance: e.importance,
    }));

    const links: GraphLink[] = relationships
      .filter(r => entityNames.has(r.source) && entityNames.has(r.target))
      .map(r => ({
        source: r.source,
        target: r.target,
        type: r.type,
        description: r.description,
      }));

    return { nodes, links };
  }, [entities, relationships]);


  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0 || dimensions.height === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous

    const { nodes, links } = data;

    if (nodes.length === 0) return;

    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(links).id(d => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force('collision', d3.forceCollide<GraphNode>().radius(d => d.importance * 3 + 30));


    // Create a group for all graph elements to support zooming
    const g = svg.append('g');

    // Marker for arrows
    svg.append('defs').append('marker')
        .attr('id', 'arrowhead')
        .attr('viewBox', '-0 -5 10 10')
        .attr('refX', 20)
        .attr('refY', 0)
        .attr('orient', 'auto')
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('xoverflow', 'visible')
        .append('svg:path')
        .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
        .attr('fill', '#ffffff')
        .style('stroke', 'none');


    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 5])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Draw links
    const linkGroup = g.append('g').attr('class', 'links');
    
    const link = linkGroup
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', '#ffffff') // Bright white for links
      .attr('stroke-opacity', 0.6) // Much higher opacity
      .attr('stroke-width', 2.5)
      .attr('marker-end', 'url(#arrowhead)');

    // Draw link labels
    const linkLabel = g.append('g')
      .attr('class', 'link-labels')
      .selectAll('text')
      .data(links)
      .enter()
      .append('text')
      .attr('font-size', '10px')
      .attr('fill', '#fbbf24') // Amber color for text to stand out
      .attr('text-anchor', 'middle')
      .attr('style', 'pointer-events: none; font-weight: 800; text-shadow: 0 0 5px #000000;')
      .text(d => d.type);


    // Draw nodes
    const node = g.append('g')
        .selectAll('.node')
        .data(nodes)
        .enter()
        .append('g')
        .attr('class', 'node')
        .style('cursor', 'grab')
        .on('click', (event, d) => {
            setSelectedNode(d);
            event.stopPropagation();
        })
        .call(d3.drag<SVGGElement, GraphNode>()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended)
        );


    // Node circles with glow effect
    node.append('circle')
      .attr('r', d => d.importance * 2 + 12)
      .attr('fill', d => {
        switch(d.type) {
          case 'character': return '#3b82f6'; // Blue
          case 'location': return '#10b981'; // Green
          case 'concept': return '#f59e0b'; // Amber
          case 'event': return '#ef4444'; // Red
          default: return '#8b5cf6'; // Purple for others
        }
      })
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2.5)
      .attr('class', 'filter drop-shadow-lg');

    // Node labels - Stronger and clearer white text
    node.append('text')
      .text(d => d.name)
      .attr('dy', d => d.importance * 2 + 32)
      .attr('text-anchor', 'middle')
      .attr('fill', '#ffffff') // Force white color
      .attr('font-size', '14px')
      .attr('font-weight', '1000')
      .attr('style', 'pointer-events: none; text-shadow: 0 0 10px #000000, 0 0 10px #000000;');

    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as GraphNode).x!)
        .attr('y1', d => (d.source as GraphNode).y!)
        .attr('x2', d => (d.target as GraphNode).x!)
        .attr('y2', d => (d.target as GraphNode).y!);

      linkLabel
        .attr('x', d => ((d.source as GraphNode).x! + (d.target as GraphNode).x!) / 2)
        .attr('y', d => ((d.source as GraphNode).y! + (d.target as GraphNode).y!) / 2);

      node.attr('transform', d => `translate(${d.x}, ${d.y})`);
    });


    function dragstarted(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }


    // Click outside to deselect
    svg.on('click', () => setSelectedNode(null));

    return () => {
      simulation.stop();
    };

  }, [data, dimensions]);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-muted/5 rounded-2xl border border-border/50">
      <svg ref={svgRef} className="w-full h-full" />
      
      {/* Legend */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 p-3 bg-background/80 backdrop-blur-md border border-border rounded-xl">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span className="text-[10px] font-bold">Nhân vật</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[hsl(var(--chart-2))]" />
          <span className="text-[10px] font-bold">Địa danh</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[hsl(var(--chart-3))]" />
          <span className="text-[10px] font-bold">Khái niệm</span>
        </div>
      </div>

      {/* Selected Node Info */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-4 left-4 right-4 p-4 bg-background/95 backdrop-blur-xl border border-primary/20 rounded-2xl shadow-2xl"
          >
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center font-black text-primary text-xs uppercase">
                        {selectedNode.type[0]}
                    </div>
                    <h4 className="text-sm font-black">{selectedNode.name}</h4>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => setSelectedNode(null)}>×</Button>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
                {entities.find(e => e.name === selectedNode.name)?.description}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-4 right-4 flex flex-col gap-1">
        <Button variant="secondary" size="icon" className="h-8 w-8 rounded-lg shadow-sm" onClick={() => d3.select(svgRef.current).transition().call(d3.zoom<SVGSVGElement, unknown>().scaleBy as any, 1.2)}>
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button variant="secondary" size="icon" className="h-8 w-8 rounded-lg shadow-sm" onClick={() => d3.select(svgRef.current).transition().call(d3.zoom<SVGSVGElement, unknown>().scaleBy as any, 0.8)}>
          <ZoomOut className="w-4 h-4" />
        </Button>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 right-4 p-3 bg-background/50 backdrop-blur-sm border border-border rounded-xl pointer-events-none">
        <p className="text-[9px] font-medium text-muted-foreground">
          • Kéo để di chuyển nút<br />
          • Cuộn để phóng to/thu nhỏ<br />
          • Nhấn vào nút để xem chi tiết
        </p>
      </div>
    </div>

  );
};
