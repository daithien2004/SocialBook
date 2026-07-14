import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  iconBgColor: string;
  iconColor: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  iconBgColor,
  iconColor,
}: StatCardProps) {
  return (
    <Card className="border border-slate-200 shadow-sm hover:border-indigo-200 transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-tight">{title}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
            {trend && (
              <div className="flex items-center mt-2">
                <div className={`flex items-center gap-1 font-medium text-xs ${
                  trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {trend.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(trend.value)}%
                </div>
                <span className="text-[10px] text-slate-400 ml-1.5 font-medium italic">vs tháng trước</span>
              </div>
            )}
          </div>
          <div className={`${iconBgColor} rounded-xl p-3 border border-slate-100`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
