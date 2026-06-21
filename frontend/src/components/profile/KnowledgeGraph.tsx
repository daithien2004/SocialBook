'use client';

import React, { useCallback, useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { KnowledgeGraphData, GraphNode } from '@/features/library/types/library.interface';
import { useTheme } from 'next-themes';
import { ZoomIn, ZoomOut, Maximize2, Info, BrainCircuit } from 'lucide-react';
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

interface ForceGraphLink {
  source: string | { id: string };
  target: string | { id: string };
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
  
  // Dynamic brand colors extracted from Tailwind/CSS variables
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    const updateColors = () => {
      const primary = getComputedStyle(root).getPropertyValue('--primary').trim();
      if (primary) {
        // Handle OKLCH to standard color support if needed, otherwise CSS oklch values are supported directly in modern canvas
        setPrimaryColor(primary.startsWith('oklch') ? primary : `oklch(${primary})`);
      }
    };
    updateColors();

    const observer = new MutationObserver(updateColors);
    observer.observe(root, { attributes: true, attributeFilter: ['class', 'style'] });
    return () => observer.disconnect();
  }, []);

  // Clone data to avoid "object is not extensible" error from RTK Query frozen objects
  const graphData = React.useMemo(() => {
    const filteredNodes = showGaps ? data.nodes : data.nodes.filter(n => !n.isGap);
    const nodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredLinks = data.links.filter(l => nodeIds.has(l.source) && nodeIds.has(l.target));

    return {
      nodes: filteredNodes.map(d => {
        const isUserNode = d.type === 'user';
        return {
          ...d,
          color: isUserNode ? primaryColor : d.color
        };
      }),
      links: filteredLinks.map(d => ({ ...d }))
    };
  }, [data, showGaps, primaryColor]);

  const hasNoData = graphData.nodes.length <= 1;

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
      <div className="h-[600px] w-full bg-slate-50/50 dark:bg-zinc-900/50 rounded-[2rem] border border-border flex items-center justify-center">
        <LoadingOverlay>Đang kiến tạo vũ trụ tri thức...</LoadingOverlay>
      </div>
    );
  }

  const isDark = theme === 'dark';

  return (
    <div ref={containerRef} className="relative w-full h-[700px] bg-background/50 dark:bg-zinc-950/40 backdrop-blur-md rounded-[2rem] overflow-hidden border border-border shadow-2xl transition-all duration-300">
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        width={dimensions.width || (typeof window !== 'undefined' ? window.innerWidth - 100 : 800)}
        height={dimensions.height || 700}
        nodeLabel="label"
        nodeVal={(node: ForceGraphNode) => node.val}
        nodeColor={(node: ForceGraphNode) => node.color || (isDark ? '#94a3b8' : '#64748b')}
        linkColor={(link: ForceGraphLink) => {
          if (selectedNode) {
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
            if (sourceId === selectedNode.id || targetId === selectedNode.id) {
              return primaryColor; // Highlight connections to active selected node
            }
          }
          return isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';
        }}
        linkWidth={(link: ForceGraphLink) => {
          if (selectedNode) {
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
            if (sourceId === selectedNode.id || targetId === selectedNode.id) {
              return 2.5; // Thicker highlighted connections
            }
          }
          return 1.2;
        }}
        nodeCanvasObject={(node: ForceGraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
          const size = node.val || 10;
          const label = node.label || '';
          const safeScale = globalScale || 1;
          const fontSize = 12 / safeScale;

          // 1. Draw Glow if selected or user center node
          if (selectedNode?.id === node.id) {
            ctx.shadowBlur = 25;
            ctx.shadowColor = node.color || primaryColor;
          } else if (node.type === 'user') {
            ctx.shadowBlur = 15;
            ctx.shadowColor = primaryColor;
          }

          // 2. Draw base circle
          ctx.beginPath();
          ctx.arc(node.x, node.y, size / 2, 0, 2 * Math.PI, false);
          ctx.fillStyle = node.img ? (isDark ? '#09090b' : '#ffffff') : (node.color || primaryColor);
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
          ctx.strokeStyle = node.color || (isDark ? '#4b5563' : '#cbd5e1');
          
          if (node.isGap) {
            ctx.setLineDash([2, 2]);
            ctx.globalAlpha = 0.6;
          }
          
          ctx.lineWidth = (selectedNode?.id === node.id ? 3 : 1.5) / safeScale;
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.globalAlpha = 1.0;
          ctx.shadowBlur = 0;

          // 5. Draw label (always show for user, otherwise show if zoomed in enough)
          if (safeScale > 0.7 || node.type === 'user') {
            ctx.font = `500 ${fontSize}px Inter, system-ui`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const textWidth = ctx.measureText(label).width;
            ctx.fillStyle = isDark ? 'rgba(9, 9, 11, 0.85)' : 'rgba(255, 255, 255, 0.85)';
            ctx.fillRect(node.x - textWidth / 2 - 2, node.y + size / 2 + 5 - fontSize / 2, textWidth + 4, fontSize + 2);
            
            ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(9, 9, 11, 0.9)';
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
      <div className="absolute bottom-6 left-6 flex flex-col gap-2.5 z-20">
        <Button 
          size="icon" 
          variant="outline" 
          className="rounded-full w-10 h-10 shadow-lg bg-background/80 hover:bg-primary/10 border-border hover:border-primary/30 text-foreground hover:text-primary backdrop-blur-md transition-all duration-300 hover:scale-105" 
          onClick={zoomIn}
          title="Phóng to"
        >
          <ZoomIn className="w-5 h-5" />
        </Button>
        <Button 
          size="icon" 
          variant="outline" 
          className="rounded-full w-10 h-10 shadow-lg bg-background/80 hover:bg-primary/10 border-border hover:border-primary/30 text-foreground hover:text-primary backdrop-blur-md transition-all duration-300 hover:scale-105" 
          onClick={zoomOut}
          title="Thu nhỏ"
        >
          <ZoomOut className="w-5 h-5" />
        </Button>
        <Button 
          size="icon" 
          variant="outline" 
          className="rounded-full w-10 h-10 shadow-lg bg-background/80 hover:bg-primary/10 border-border hover:border-primary/30 text-foreground hover:text-primary backdrop-blur-md transition-all duration-300 hover:scale-105" 
          onClick={resetZoom}
          title="Vừa màn hình"
        >
          <Maximize2 className="w-5 h-5" />
        </Button>
      </div>

      {/* Legend */}
      <div className="absolute top-6 left-6 p-5 bg-background/80 dark:bg-zinc-950/85 backdrop-blur-xl rounded-3xl border border-border shadow-2xl z-20 transition-all duration-300 max-w-[240px]">
        <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
          <Info className="w-4 h-4 text-primary" /> Chú giải bản đồ
        </h3>
        <div className="space-y-3">
          <LegendItem color={primaryColor} label="Bạn (Trung tâm)" />
          <LegendItem color="#10b981" label="Sách đã đọc" />
          <LegendItem color="#ec4899" label="Khoảng trống (Gợi ý)" isDashed />
          <LegendItem color="#f59e0b" label="Tác giả" />
          <LegendItem color="#8b5cf6" label="Thể loại" />
          <LegendItem color="#64748b" label="Chủ đề (Tags)" />
        </div>

        <div className="mt-5 pt-4 border-t border-border">
          <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/80 group-hover:text-primary transition-colors">
              Gợi ý từ AI
            </span>
            <div 
              className={`w-10 h-5 rounded-full relative transition-colors ${showGaps ? 'bg-primary' : 'bg-muted-foreground/20'}`}
              onClick={() => setShowGaps(!showGaps)}
            >
              <div className={`absolute top-1 w-3 h-3 bg-background rounded-full transition-all ${showGaps ? 'left-6' : 'left-1'}`} />
            </div>
          </label>
        </div>
      </div>

      {/* Node Detail Card */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, x: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute top-6 right-6 w-80 z-20"
          >
            <Card className="p-5 bg-background/85 dark:bg-zinc-950/90 backdrop-blur-xl border border-border shadow-2xl rounded-3xl overflow-hidden relative">
              <div className="absolute -right-10 -top-10 w-24 h-24 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex flex-col gap-4">
                {selectedNode.img && (
                  <div className="relative w-full h-44 overflow-hidden rounded-2xl border border-border">
                    <Image
                      src={selectedNode.img}
                      alt={selectedNode.label}
                      fill
                      sizes="(max-width: 320px) 100vw, 320px"
                      className="object-cover transition-transform duration-500 hover:scale-105"
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] uppercase tracking-widest font-black px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                      {getNodeTypeLabel(selectedNode.type)}
                    </span>
                    {selectedNode.isGap && (
                      <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 bg-pink-500/10 text-pink-500 border border-pink-500/20 rounded font-black">
                        Gợi ý AI
                      </span>
                    )}
                  </div>
                  <h4 className="text-lg font-bold leading-tight text-foreground tracking-tight">{selectedNode.label}</h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed italic bg-muted/30 p-3 rounded-xl border border-border/40">
                  {selectedNode.reason || getNodeDescription(selectedNode)}
                </p>
                
                <div className="flex flex-col gap-2 mt-1">
                  {(selectedNode.type === 'book' && (selectedNode.slug || selectedNode.url)) && (
                    <Button 
                      className="w-full cursor-pointer rounded-xl gap-2 font-bold bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 shadow-sm" 
                      onClick={() => {
                        if (selectedNode.url) {
                          window.open(selectedNode.url, '_blank', 'noopener,noreferrer');
                        } else if (selectedNode.slug) {
                          router.push(`/books/${selectedNode.slug}`);
                        }
                      }}
                    >
                      {selectedNode.url ? 'Tìm hiểu thêm' : 'Đọc sách ngay'}
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full cursor-pointer rounded-xl font-medium border-border hover:bg-accent transition-colors" 
                    onClick={() => setSelectedNode(null)}
                  >
                    Đóng chi tiết
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State Overlay */}
      {hasNoData && (
        <div className="absolute inset-0 bg-background/25 dark:bg-black/35 backdrop-blur-[4px] flex items-center justify-center p-6 z-30 transition-all">
          <Card className="max-w-md p-6 bg-background/95 dark:bg-zinc-950/95 border border-border shadow-2xl rounded-3xl text-center flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <BrainCircuit className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-lg font-bold text-foreground tracking-tight">
                Vũ trụ tri thức chưa hình thành
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Đồ thị này tự động liên kết các cuốn sách bạn đọc xong, tác giả, thể loại và các khoảng trống tri thức gợi ý từ AI. Hãy đọc xong tối thiểu 1 cuốn sách để kích hoạt bản đồ!
              </p>
            </div>
            <Button 
              className="rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground w-full gap-2 shadow-sm"
              onClick={() => router.push('/books')}
            >
              Khám phá sách ngay
            </Button>
          </Card>
        </div>
      )}

      <div className="absolute bottom-6 right-6 text-[10px] font-medium text-muted-foreground bg-background/80 dark:bg-zinc-950/80 px-4 py-1.5 rounded-full border border-border backdrop-blur-md shadow-sm pointer-events-none transition-all">
        Cuộn để phóng to • Kéo để di chuyển • Click vào node xem chi tiết
      </div>
    </div>
  );
}

function LegendItem({ color, label, isDashed }: { color: string; label: string; isDashed?: boolean }) {
  return (
    <div className="flex items-center gap-3 text-xs font-semibold text-foreground/80">
      <div 
        className={`w-3.5 h-3.5 rounded-full shadow-sm shrink-0 ${isDashed ? 'border-2 border-dashed' : ''}`} 
        style={{ 
          backgroundColor: isDashed ? 'transparent' : color,
          borderColor: isDashed ? color : 'transparent'
        }} 
      />
      {label}
    </div>
  );
}

function getNodeTypeLabel(type: string | undefined): string {
  switch (type) {
    case 'user': return 'Bạn';
    case 'book': return 'Sách';
    case 'author': return 'Tác giả';
    case 'genre': return 'Thể loại';
    case 'tag': return 'Chủ đề';
    default: return type || 'Node';
  }
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
