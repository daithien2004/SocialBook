'use client';

import WorldMap from '../analyst/WorldMap';

type GeographicDatum = {
  country: string;
  userCount: number;
};

export function GeographicDistributionMap({
  data,
}: {
  data: GeographicDatum[];
}) {
  return <WorldMap data={data} />;
}
