import { cn } from '@/lib/utils';

export function Badge({ children, variant = 'default', className }) {
    const variants = {
        default:  'bg-gray-100 text-gray-700',
        success:  'bg-emerald-50 text-emerald-700',
        warning:  'bg-amber-50 text-amber-700',
        danger:   'bg-red-50 text-red-600',
        secondary:'bg-slate-100 text-slate-500',
        naranja:  'bg-[#fef3e8] text-[#F58220]',
        azul:     'bg-blue-50 text-[#2D4C73]',
    };

    return (
        <span className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
            variants[variant] ?? variants.default,
            className
        )}>
            {children}
        </span>
    );
}
