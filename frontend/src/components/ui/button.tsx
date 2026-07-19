import type { ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'destructive' | 'outline' | 'ghost';
    size?: 'default' | 'sm' | 'lg';
}

export const Button = ({ children, variant = 'primary', size = 'default', className = '', ...props }: ButtonProps) => {
    const base = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none";
    const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
        primary: "bg-blue-600 text-white hover:bg-blue-700",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        outline: "border border-gray-300 bg-transparent hover:bg-gray-50",
        ghost: "bg-transparent hover:bg-gray-100",
    };
    const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
        default: "h-10 py-2 px-4 text-sm",
        sm: "h-9 px-3 text-xs",
        lg: "h-11 px-8 text-base",
    };
    return <button className={`${base} ${variants[variant] || variants.primary} ${sizes[size] || sizes.default} ${className}`} {...props}>{children}</button>;
};
