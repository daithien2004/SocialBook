'use client';

export type ViewType = 'day' | 'month' | 'year';

interface ViewTypeSelectorProps {
  value: ViewType;
  onChange: (value: ViewType) => void;
}

export function ViewTypeSelector({ value, onChange }: ViewTypeSelectorProps) {
  return (
    <div className="flex items-center gap-4">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Xem theo:</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as ViewType)}
        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
      >
        <option value="day">Ngày</option>
        <option value="month">Tháng</option>
        <option value="year">Năm</option>
      </select>
    </div>
  );
}
