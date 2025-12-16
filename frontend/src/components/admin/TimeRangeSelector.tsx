'use client';

import { ViewType } from './ViewTypeSelector';

interface TimeRangeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  viewType: ViewType;
}

export function TimeRangeSelector({
  value,
  onChange,
  viewType,
}: TimeRangeSelectorProps) {
  // Define options based on view type
  const getOptions = () => {
    switch (viewType) {
      case 'day':
        return [
          { value: '7', label: 'Last 7 Days' },
          { value: '30', label: 'Last 30 Days' },
          { value: '90', label: 'Last 90 Days' },
        ];
      case 'month':
        return [
          { value: '90', label: 'Last 3 Months' },
          { value: '180', label: 'Last 6 Months' },
          { value: '365', label: 'Last 12 Months' },
        ];
      case 'year':
        return [
          { value: '730', label: 'Last 2 Years' },
          { value: '1095', label: 'Last 3 Years' },
          { value: '1825', label: 'Last 5 Years' },
        ];
      default:
        return [{ value: '30', label: 'Last 30 Days' }];
    }
  };

  const options = getOptions();

  return (
    <div className="flex items-center gap-4">
      <label className="text-sm font-medium text-gray-700">Time Range:</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
