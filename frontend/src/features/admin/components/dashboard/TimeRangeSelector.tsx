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
          { value: '7', label: '7 ngày qua' },
          { value: '30', label: '30 ngày qua' },
          { value: '90', label: '90 ngày qua' },
        ];
      case 'month':
        return [
          { value: '90', label: '3 tháng qua' },
          { value: '180', label: '6 tháng qua' },
          { value: '365', label: '12 tháng qua' },
        ];
      case 'year':
        return [
          { value: '730', label: '2 năm qua' },
          { value: '1095', label: '3 năm qua' },
          { value: '1825', label: '5 năm qua' },
        ];
      default:
        return [{ value: '30', label: '30 ngày qua' }];
    }
  };

  const options = getOptions();

  return (
    <div className="flex items-center gap-4">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Thời gian:</label>
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
