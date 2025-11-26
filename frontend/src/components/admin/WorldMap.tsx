import React, { useMemo } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import { Tooltip as ReactTooltip } from 'react-tooltip';

interface WorldMapProps {
    data: { country: string; userCount: number }[];
}

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const WorldMap: React.FC<WorldMapProps> = ({ data }) => {
    const maxValue = Math.max(...data.map(d => d.userCount), 0);

    const colorScale = scaleLinear<string>()
        .domain([0, maxValue || 1])
        .range(["#EAEAEC", "#3b82f6"]); // Light gray to Blue

    const getCountryColor = (countryName: string) => {
        const countryData = data.find(d =>
            d.country.toLowerCase() === countryName.toLowerCase() ||
            (d.country === 'USA' && countryName === 'United States of America') ||
            (d.country === 'UK' && countryName === 'United Kingdom')
        );
        return countryData ? colorScale(countryData.userCount) : "#F5F4F6";
    };

    const getTooltipContent = (countryName: string) => {
        const countryData = data.find(d =>
            d.country.toLowerCase() === countryName.toLowerCase() ||
            (d.country === 'USA' && countryName === 'United States of America') ||
            (d.country === 'UK' && countryName === 'United Kingdom')
        );
        return countryData ? `${countryName}: ${countryData.userCount} users` : `${countryName}: 0 users`;
    };

    return (
        <div className="w-full h-[400px] bg-white rounded-lg overflow-hidden relative">
            <ComposableMap projectionConfig={{ scale: 147 }} width={800} height={400}>
                <ZoomableGroup center={[0, 0]} zoom={1}>
                    <Geographies geography={geoUrl}>
                        {({ geographies }: { geographies: any[] }) =>
                            geographies.map((geo: any) => {
                                const { name } = geo.properties;
                                return (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        fill={getCountryColor(name)}
                                        stroke="#D6D6DA"
                                        strokeWidth={0.5}
                                        style={{
                                            default: { outline: "none" },
                                            hover: { fill: "#F53", outline: "none", cursor: "pointer" },
                                            pressed: { outline: "none" },
                                        }}
                                        data-tooltip-id="my-tooltip"
                                        data-tooltip-content={getTooltipContent(name)}
                                    />
                                );
                            })
                        }
                    </Geographies>
                </ZoomableGroup>
            </ComposableMap>
            <ReactTooltip id="my-tooltip" />
        </div>
    );
};

export default WorldMap;
