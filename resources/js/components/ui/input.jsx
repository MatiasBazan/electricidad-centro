import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
    return (
        <input
            type={type}
            className={cn(
                'flex h-10 w-full rounded-md border border-[#D3D3D3] bg-white px-3 py-2 text-sm text-[#2B2B2B] placeholder:text-[#A0A0A0] transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus:border-[#F58220] focus:outline-none focus:ring-2 focus:ring-[#F58220]/20 disabled:cursor-not-allowed disabled:opacity-50',
                className
            )}
            ref={ref}
            {...props}
        />
    );
});
Input.displayName = 'Input';

export { Input };
