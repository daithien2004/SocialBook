import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface WorldMapProps {
  data: { country: string; userCount: number }[];
}

const WorldMap: React.FC<WorldMapProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{
    show: boolean;
    x: number;
    y: number;
    content: string;
  }>({
    show: false,
    x: 0,
    y: 0,
    content: '',
  });
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });

  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      if (container) {
        setDimensions({
          width: container.clientWidth,
          height: 400,
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;

    // Color scale
    const maxValue = Math.max(...data.map((d) => d.userCount), 1);
    const colorScale = d3
      .scaleLinear<string>()
      .domain([0, maxValue])
      .range(['#EAEAEC', '#3b82f6']);

    // Projection
    const projection = d3
      .geoMercator()
      .scale(width / 6.5)
      .center([0, 20])
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    // Create a group for zoom
    const g = svg.append('g');

    // Zoom behavior
    const zoom = d3
      .zoom()
      .scaleExtent([1, 8])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom as any);

    // Country name mapping - maps GeoJSON names to your data names
    const countryMapping: { [key: string]: string } = {
      'Viet Nam': 'Vietnam',
      'Republic of Korea': 'Republic of Korea',
      'South Korea': 'Republic of Korea',
      'United Kingdom': 'United Kingdom',
    };

    const getCountryData = (countryName: string) => {
      const normalizedName = countryMapping[countryName] || countryName;
      return data.find(
        (d) => d.country.toLowerCase() === normalizedName.toLowerCase()
      );
    };

    const getCountryColor = (countryName: string) => {
      const countryData = getCountryData(countryName);
      return countryData ? colorScale(countryData.userCount) : '#F5F4F6';
    };

    // Load GeoJSON directly
    d3.json(
      'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson'
    )
      .then((geojson: any) => {
        g.selectAll('path')
          .data(geojson.features)
          .enter()
          .append('path')
          .attr('d', path as any)
          .attr('fill', (d: any) => getCountryColor(d.properties.name))
          .attr('stroke', '#D6D6DA')
          .attr('stroke-width', 0.5)
          .style('cursor', 'pointer')
          .on('mouseenter', function (event: any, d: any) {
            const countryData = getCountryData(d.properties.name);
            const userCount = countryData ? countryData.userCount : 0;

            d3.select(this).attr('fill', '#F53').attr('stroke-width', 1);

            setTooltip({
              show: true,
              x: event.pageX,
              y: event.pageY,
              content: `${d.properties.name}: ${userCount} người dùng`,
            });
          })
          .on('mousemove', function (event: any, d: any) {
            const countryData = getCountryData(d.properties.name);
            const userCount = countryData ? countryData.userCount : 0;

            setTooltip({
              show: true,
              x: event.pageX,
              y: event.pageY,
              content: `${d.properties.name}: ${userCount} người dùng`,
            });
          })
          .on('mouseleave', function (event: any, d: any) {
            d3.select(this)
              .attr('fill', getCountryColor(d.properties.name))
              .attr('stroke-width', 0.5);

            setTooltip((prev) => ({ ...prev, show: false }));
          });
      })
      .catch((error) => {
        console.error('Error loading map:', error);
        g.append('text')
          .attr('x', width / 2)
          .attr('y', height / 2)
          .attr('text-anchor', 'middle')
          .attr('fill', '#666')
          .text('Lỗi tải dữ liệu bản đồ. Vui lòng tải lại.');
      });
  }, [data, dimensions]);

  return (
    <div
      ref={containerRef}
      className="w-full h-[400px] bg-white rounded-lg overflow-hidden relative"
    >
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{ display: 'block' }}
      />
      {tooltip.show && (
        <div
          style={{
            position: 'fixed',
            left: `${tooltip.x + 10}px`,
            top: `${tooltip.y - 28}px`,
            padding: '8px 12px',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            borderRadius: '4px',
            fontSize: '14px',
            pointerEvents: 'none',
            zIndex: 1000,
            whiteSpace: 'nowrap',
          }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
};

export default WorldMap;
