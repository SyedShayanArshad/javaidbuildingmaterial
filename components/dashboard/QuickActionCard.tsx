import { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, LucideIcon } from 'lucide-react';

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo';
}

export function QuickActionCard({ title, description, icon: Icon, href, color }: QuickActionCardProps) {
  const colorClasses = {
    blue: 'from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 dark:from-cyan-600 dark:to-blue-700',
    green: 'from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 dark:from-emerald-600 dark:to-teal-700',
    purple: 'from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 dark:from-purple-600 dark:to-violet-700',
    orange: 'from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 dark:from-amber-600 dark:to-orange-700',
    red: 'from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 dark:from-rose-600 dark:to-red-700',
    indigo: 'from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 dark:from-indigo-600 dark:to-blue-700',
  };

  return (
    <Link href={href}>
      <div className={`
        bg-gradient-to-br ${colorClasses[color]} 
        text-white p-6 rounded-xl shadow-card 
        hover:shadow-card-hover transition-all duration-300 
        hover:-translate-y-1 cursor-pointer group
        border border-white/10 dark:border-white/5
      `}>
        <Icon className="w-12 h-12 mb-4 opacity-90" />
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-sm text-white/90 mb-4">{description}</p>
        <div className="flex items-center text-sm font-medium group-hover:gap-2 transition-all">
          <span>Get Started</span>
          <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
}
