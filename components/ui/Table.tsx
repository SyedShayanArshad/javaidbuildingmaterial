import { ReactNode } from 'react';

interface TableProps {
  children: ReactNode;
  className?: string;
  scrollable?: boolean; // Enable fixed header with scrollable body
}

export function Table({ children, className = '', scrollable = false }: TableProps) {
  if (scrollable) {
    return (
      <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="max-h-[600px] overflow-y-auto">
          <table className={`min-w-full divide-y divide-slate-200 dark:divide-slate-700 ${className}`}>
            {children}
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg">
      <table className={`min-w-full divide-y divide-slate-200 dark:divide-slate-700 ${className}`}>
        {children}
      </table>
    </div>
  );
}

interface TableHeaderProps {
  children: ReactNode;
  sticky?: boolean;
}

export function TableHeader({ children, sticky = false }: TableHeaderProps) {
  return (
    <thead className={`
      bg-slate-50 dark:bg-slate-900
      ${sticky ? 'sticky top-0 z-10' : ''}
    `}>
      <tr>{children}</tr>
    </thead>
  );
}

interface TableBodyProps {
  children: ReactNode;
}

export function TableBody({ children }: TableBodyProps) {
  return (
    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
      {children}
    </tbody>
  );
}

interface TableRowProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function TableRow({ children, className = '', onClick }: TableRowProps) {
  return (
    <tr 
      className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

interface TableHeadProps {
  children: ReactNode;
  className?: string;
}

export function TableHead({ children, className = '' }: TableHeadProps) {
  return (
    <th className={`px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider ${className}`}>
      {children}
    </th>
  );
}

interface TableCellProps {
  children: ReactNode;
  className?: string;
}

export function TableCell({ children, className = '' }: TableCellProps) {
  return (
    <td className={`px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100 ${className}`}>
      {children}
    </td>
  );
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      {icon && <div className="flex justify-center mb-4 text-gray-400">{icon}</div>}
      <h3 className="text-lg font-medium text-gray-900 mb-2 dark:text-gray-100">{title}</h3>
      {description && <p className="text-sm text-gray-500 mb-4">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
