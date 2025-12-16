'use client';

export type ViewType = 'day' | 'month' | 'year';

interface ViewTypeSelectorProps {
  value: ViewType;
  onChange: (value: ViewType) => void;
}

export function ViewTypeSelector({ value, onChange }: ViewTypeSelectorProps) {
  return (
    <div className="flex items-center gap-4">
      <label className="text-sm font-medium text-gray-700">View By:</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as ViewType)}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
      >
        <option value="day">Daily</option>
        <option value="month">Monthly</option>
        <option value="year">Yearly</option>
      </select>
    </div>
  );
}
