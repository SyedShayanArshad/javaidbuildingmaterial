import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ children, className = '', hover = false, gradient = false, padding = 'md' }: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={`
        bg-white dark:bg-slate-800 rounded-xl shadow-card dark:shadow-none border border-slate-100 dark:border-slate-700
        ${hover ? 'hover:shadow-card-hover dark:hover:border-slate-600 transition-all duration-300 hover:-translate-y-1' : ''}
        ${gradient ? 'bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900' : ''}
        ${paddingClasses[padding]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo';
  href?: string;
}

export function StatCard({ title, value, icon, trend, color = 'blue', href }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-cyan-500 text-cyan-600 dark:bg-cyan-600 dark:text-cyan-400',
    green: 'bg-emerald-500 text-emerald-600 dark:bg-emerald-600 dark:text-emerald-400',
    purple: 'bg-purple-500 text-purple-600 dark:bg-purple-600 dark:text-purple-400',
    orange: 'bg-amber-500 text-amber-600 dark:bg-amber-600 dark:text-amber-400',
    red: 'bg-rose-500 text-rose-600 dark:bg-rose-600 dark:text-rose-400',
    indigo: 'bg-indigo-500 text-indigo-600 dark:bg-indigo-600 dark:text-indigo-400',
  };

  const [bgColor, textColor] = colorClasses[color].split(' ').slice(0, 2);
  const darkBgColor = colorClasses[color].split(' ')[2];
  const darkTextColor = colorClasses[color].split(' ')[3];

  const content = (
    <div className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{value}</p>
          {trend && (
            <div className={`flex items-center text-sm ${trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              <span className="font-semibold">{trend.isPositive ? '+' : ''}{trend.value}%</span>
              <span className="ml-2 text-slate-500 dark:text-slate-400">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={`${bgColor} ${darkBgColor} bg-opacity-10 dark:bg-opacity-20 p-3 rounded-xl`}>
          <div className={`${textColor} ${darkTextColor}`}>{icon}</div>
        </div>
      </div>
      <div className={`absolute -right-6 -bottom-6 w-24 h-24 ${bgColor} ${darkBgColor} opacity-5 dark:opacity-10 rounded-full`}></div>
    </div>
  );

  if (href) {
    return (
      <a href={href}>
        <Card hover className="h-full cursor-pointer">
          {content}
        </Card>
      </a>
    );
  }

  return <Card className="h-full">{content}</Card>;
}
