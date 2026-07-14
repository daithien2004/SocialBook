import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus } from 'lucide-react';

interface AdminSearchBarProps {
  title: string;
  totalItems: number;
  totalLabel: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onAddClick?: () => void;
  addLabel?: string;
  children?: React.ReactNode;
}

export function AdminSearchBar({
  title,
  totalItems,
  totalLabel,
  searchPlaceholder = 'Tìm kiếm...',
  searchValue = '',
  onSearchChange,
  onAddClick,
  addLabel = 'Thêm mới',
  children,
}: AdminSearchBarProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 mb-6 overflow-hidden shadow-sm">
      <div className="px-6 py-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{title}</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Tìm thấy <span className="text-indigo-600 font-bold">{totalItems.toLocaleString()}</span> {totalLabel} trong hệ thống
          </p>
        </div>
        {onAddClick && (
          <Button
            onClick={onAddClick}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 h-10 rounded-lg font-semibold transition-all shadow-sm active:scale-95 w-full sm:w-auto flex items-center justify-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            {addLabel}
          </Button>
        )}
      </div>

      {(onSearchChange || children) && (
        <div className="bg-slate-50/50 px-6 py-4 flex flex-col sm:flex-row gap-4 items-center">
          {onSearchChange && (
            <div className="flex-1 w-full relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 h-10 bg-white border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm w-full"
              />
            </div>
          )}
          {children}
        </div>
      )}
    </div>
  );
}
