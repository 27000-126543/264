import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  gradient: string;
  className?: string;
}

export default function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendLabel, 
  gradient,
  className 
}: StatCardProps) {
  return (
    <div className={cn(
      "glass-card rounded-2xl p-6 relative overflow-hidden group transition-all duration-300 hover:scale-[1.02]",
      className
    )}>
      <div className={cn(
        "absolute top-0 right-0 w-32 h-32 opacity-20 blur-3xl -translate-y-1/2 translate-x-1/2",
        gradient
      )} />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 rounded-xl bg-dark-800/50 backdrop-blur">
            <Icon className="w-6 h-6 text-accent-400" />
          </div>
          {trend !== undefined && (
            <div className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
              trend >= 0 
                ? "bg-success-500/20 text-success-400" 
                : "bg-danger-500/20 text-danger-400"
            )}>
              {trend >= 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        
        <p className="text-sm text-dark-400 mb-1">{title}</p>
        <p className="text-3xl font-display font-bold text-white">{value}</p>
        
        {trendLabel && (
          <p className="text-xs text-dark-500 mt-2">{trendLabel}</p>
        )}
      </div>
    </div>
  );
}
