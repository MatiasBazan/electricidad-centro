import { cn } from '@/lib/utils';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const SENTINEL = '__none__';

export default function AppSelect({
    value,
    onValueChange,
    options = [],
    placeholder,
    error,
    className,
}) {
    const selectValue = (value != null && value !== '')
        ? String(value)
        : (placeholder ? SENTINEL : undefined);

    return (
        <Select
            value={selectValue}
            onValueChange={val => onValueChange(val === SENTINEL ? '' : val)}
        >
            <SelectTrigger className={cn(error ? 'border-red-400' : '', className)}>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {placeholder && (
                    <SelectItem value={SENTINEL}>{placeholder}</SelectItem>
                )}
                {options.map(opt => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                        {opt.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
