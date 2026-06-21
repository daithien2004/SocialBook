'use client';

import React, { useCallback, useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { KnowledgeGraphData, GraphNode } from '@/features/library/types/library.interface';
import { useTheme } from 'next-themes';
import { ZoomIn, ZoomOut, Maximize2, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LoadingOverlay } from '@/components/common/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';
import type { ComponentType } from 'react';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
}) as ComponentType<Record<string, unknown>>;

interface ForceGraphNode {
  x: number;
  y: number;
  val: number;
  id: string;
  label: string;
  color?: string;
  img?: string;
  isGap?: boolean;
  slug?: string;
  type?: string;
  reason?: string;
}

interface GraphRef {
  zoomToFit(durationMs?: number, padding?: number): void;
  centerAt(x?: number, y?: number, durationMs?: number): void;
  zoom(): number;
  zoom(scale: number, durationMs?: number): void;
  refresh(): void;
}

interface KnowledgeGraphProps {
  data: KnowledgeGraphData;
  isLoading: boolean;
}

export function KnowledgeGraph({ data, isLoading }: KnowledgeGraphProps) {
  const { theme } = useTheme();
  const fgRef = useRef<GraphRef>(null);
  const router = useRouter();
  const imgCache = useRef<Record<string, HTMLImageElement>>({});
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [showGaps, setShowGaps] = useState(true);



  const [dimensions, setDimensions] = useState({ width: 0, height: 700 });
  const containerRef = useRef<HTMLDivElement>(null);


  // Clone data to avoid "object is not extensible" error from RTK Query frozen objects
  const graphData = React.useMemo(() => {
    const filteredNodes = showGaps ? data.nodes : data.nodes.filter(n => !n.isGap);
    const nodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredLinks = data.links.filter(l => nodeIds.has(l.source) && nodeIds.has(l.target));

    return {
      nodes: filteredNodes.map(d => ({ ...d })),
      links: filteredLinks.map(d => ({ ...d }))
    };
  }, [data, showGaps]);


  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        const height = containerRef.current.offsetHeight || 700;
        
        if (width > 0) {
          setDimensions({ width, height });
        }
      }
    };

    updateDimensions();

    const timeoutId = setTimeout(updateDimensions, 100);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0) {
          setDimensions({ width, height: height || 700 });
        }
      }
    });

    resizeObserver.observe(containerRef.current);
    
    return () => {
      resizeObserver.disconnect();
      clearTimeout(timeoutId);
    };
  }, []);


  useEffect(() => {
    if (fgRef.current && graphData.nodes.length > 0) {
      const timer = setTimeout(() => {
        if (fgRef.current?.zoomToFit) {
          fgRef.current.zoomToFit(600, 50);
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [graphData.nodes.length]);



  const handleNodeClick = useCallback((node: ForceGraphNode) => {
    fgRef.current?.centerAt(node.x, node.y, 1000);
    fgRef.current?.zoom(3, 1000);
    setSelectedNode(node as GraphNode);
  }, []);

  const handleCanvasClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const zoomIn = () => {
    const ref = fgRef.current;
    if (ref) ref.zoom(ref.zoom() * 1.2, 400);
  };
  const zoomOut = () => {
    const ref = fgRef.current;
    if (ref) ref.zoom(ref.zoom() * 0.8, 400);
  };
  const resetZoom = () => {
    fgRef.current?.zoomToFit(400, 100);
    setSelectedNode(null);
  };

  if (isLoading) {
    return (
      <div className="h-[600px] w-full bg-slate-50/50 dark:bg-zinc-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-zinc-800">
        <LoadingOverlay>Đang kiến tạo bản đồ tri thức...</LoadingOverlay>
      </div>
    );
  }

  const isDark = theme === 'dark';


  return (
    <div ref={containerRef} className="relative w-full h-[700px] bg-slate-50 dark:bg-zinc-950 rounded-3xl overflow-hidden border border-slate-200 dark:border-zinc-800 shadow-2xl">
        <ForceGraph2D
          ref={fgRef}
          graphData={graphData}
          width={dimensions.width || (typeof window !== 'undefined' ? window.innerWidth - 100 : 800)}
          height={dimensions.height || 700}

          nodeLabel="label"
          nodeVal={(node: ForceGraphNode) => node.val}
          nodeColor={(node: ForceGraphNode) => node.color || (isDark ? '#94a3b8' : '#64748b')}
          linkColor={() => (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)')}
          linkWidth={1.5}
          nodeCanvasObject={(node: ForceGraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
            const size = node.val || 10;
            const label = node.label || '';
            const safeScale = globalScale || 1;
            const fontSize = 12 / safeScale;

            // 1. Draw Glow if selected
            if (selectedNode?.id === node.id) {
              ctx.shadowBlur = 20;
              ctx.shadowColor = node.color || '#3b82f6';
            }

            // 2. Draw base circle
            ctx.beginPath();
            ctx.arc(node.x, node.y, size / 2, 0, 2 * Math.PI, false);
            ctx.fillStyle = isDark ? '#1e293b' : '#f1f5f9';
            ctx.fill();

            // 3. Draw image if available
            if (node.img) {
              let img = imgCache.current[node.img];
              if (!img) {
                img = new window.Image();
                img.src = node.img;
                imgCache.current[node.img] = img;
                img.onload = () => {
                  if (fgRef.current?.refresh) fgRef.current.refresh();
                };
              }

              if (img.complete && img.naturalWidth !== 0) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(node.x, node.y, size / 2, 0, 2 * Math.PI, false);
                ctx.clip();
                ctx.drawImage(img, node.x - size / 2, node.y - size / 2, size, size);
                ctx.restore();
              }
            }

            // 4. Draw border
            ctx.beginPath();
            ctx.arc(node.x, node.y, size / 2, 0, 2 * Math.PI, false);
            ctx.strokeStyle = node.color || (isDark ? '#3b82f6' : '#2563eb');
            
            if (node.isGap) {
              ctx.setLineDash([2, 2]);
              ctx.globalAlpha = 0.6;
            }
            
            ctx.lineWidth = (selectedNode?.id === node.id ? 3 : 1.5) / safeScale;
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.globalAlpha = 1.0;
            ctx.shadowBlur = 0;

            // 5. Draw label
            if (safeScale > 1.2) {
              ctx.font = `500 ${fontSize}px Inter, system-ui`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              
              const textWidth = ctx.measureText(label).width;
              ctx.fillStyle = isDark ? 'rgba(9, 9, 11, 0.8)' : 'rgba(255, 255, 255, 0.8)';
              ctx.fillRect(node.x - textWidth / 2 - 2, node.y + size / 2 + 5 - fontSize / 2, textWidth + 4, fontSize + 2);
              
              ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)';
              ctx.fillText(label, node.x, node.y + size / 2 + 5 + fontSize / 2);
            }
          }}
          onNodeClick={handleNodeClick}
          onBackgroundClick={handleCanvasClick}
          cooldownTicks={100}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
        />



      {/* UI Controls */}
      <div className="absolute bottom-6 left-6 flex flex-col gap-2">
        <Button size="icon" variant="secondary" className="rounded-full shadow-lg" onClick={zoomIn}>
          <ZoomIn className="w-5 h-5" />
        </Button>
        <Button size="icon" variant="secondary" className="rounded-full shadow-lg" onClick={zoomOut}>
          <ZoomOut className="w-5 h-5" />
        </Button>
        <Button size="icon" variant="secondary" className="rounded-full shadow-lg" onClick={resetZoom}>
          <Maximize2 className="w-5 h-5" />
        </Button>
      </div>

      {/* Legend */}
      <div className="absolute top-6 left-6 p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xl">
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
          <Info className="w-4 h-4 text-primary" /> Chú giải
        </h3>
        <div className="space-y-2">
          <LegendItem color="#3b82f6" label="Bạn (Trung tâm)" />
          <LegendItem color="#10b981" label="Sách đã đọc" />
          <LegendItem color="#ec4899" label="Khoảng trống (Gợi ý)" isDashed />
          <LegendItem color="#f59e0b" label="Tác giả" />
          <LegendItem color="#8b5cf6" label="Thể loại" />
          <LegendItem color="#64748b" label="Chủ đề (Tags)" />
        </div>

        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-zinc-800">
          <label className="flex items-center gap-2 cursor-pointer group">
            <div 
              className={`w-10 h-5 rounded-full relative transition-colors ${showGaps ? 'bg-primary' : 'bg-slate-300 dark:bg-zinc-700'}`}
              onClick={() => setShowGaps(!showGaps)}
            >
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${showGaps ? 'left-6' : 'left-1'}`} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-tight group-hover:text-primary transition-colors">
              Gợi ý từ AI
            </span>
          </label>
        </div>
      </div>


      {/* Node Detail Card */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-6 right-6 w-72"
          >
            <Card className="p-5 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border-primary/20 shadow-2xl rounded-3xl">
              <div className="flex flex-col gap-4">
                {selectedNode.img && (
                  <div className="relative w-full h-40">
                    <Image
                      src={selectedNode.img}
                      alt={selectedNode.label}
                      fill
                      sizes="(max-width: 288px) 100vw, 288px"
                      className="object-cover rounded-2xl shadow-md"
                    />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-primary">
                      {selectedNode.type}
                    </span>
                    {selectedNode.isGap && (
                      <span className="text-[10px] px-2 py-0.5 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-full font-bold">
                        Đề xuất
                      </span>
                    )}
                  </div>
                  <h4 className="text-lg font-bold leading-tight">{selectedNode.label}</h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed italic">
                  {selectedNode.reason || getNodeDescription(selectedNode)}
                </p>
                {selectedNode.type === 'book' && selectedNode.slug && (
                  <Button 
                    className="w-full cursor-pointer rounded-xl gap-2 hover:bg-primary/95  font-bold" 
                    onClick={() => {
                      router.push(`/books/${selectedNode.slug}`);
                    }}
                  >
                    Truy cập sách
                  </Button>
                )}
                <Button variant="outline" size="sm" className="w-full cursor-pointer rounded-xl" onClick={() => setSelectedNode(null)}>
                  Đóng
                </Button>

              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-6 right-6 text-[10px] text-muted-foreground bg-white/50 dark:bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
        Cuộn để phóng to • Kéo để di chuyển • Click vào node để xem chi tiết
      </div>
    </div>
  );
}

function LegendItem({ color, label, isDashed }: { color: string; label: string; isDashed?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
      <div 
        className={`w-3 h-3 rounded-full ${isDashed ? 'border-2 border-dashed' : ''}`} 
        style={{ 
          backgroundColor: isDashed ? 'transparent' : color,
          borderColor: isDashed ? color : 'transparent'
        }} 
      />
      {label}
    </div>
  );
}


function getNodeDescription(node: GraphNode): string {
  switch (node.type) {
    case 'user': return 'Đây là tâm điểm của vũ trụ tri thức của bạn. Mọi liên kết đều dẫn về đây.';
    case 'book': return 'Một cột mốc trên hành trình trưởng thành của bạn thông qua những trang sách.';
    case 'author': return 'Người đã dẫn dắt tư duy của bạn qua những câu chuyện và kiến thức.';
    case 'genre': return 'Vùng không gian tri thức mà bạn đã khám phá.';
    case 'tag': return 'Những chủ đề cụ thể kết nối các ý tưởng trong tâm trí bạn.';
    default: return '';
  }
}
