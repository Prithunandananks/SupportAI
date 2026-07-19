import React from 'react';

export const Select = ({ children }: React.PropsWithChildren<{ value?: string; onValueChange?: (value: string) => void }>) => {
    // Basic mock of select, but requires context to work properly
    return <div className="relative w-full">{children}</div>;
};
export const SelectTrigger = ({ children, className = '' }: React.PropsWithChildren<{ className?: string }>) => <button className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 ${className}`}>{children}</button>;
export const SelectValue = ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>;
export const SelectContent = ({ children }: React.PropsWithChildren) => <div className="absolute top-full left-0 z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-md text-sm">{children}</div>;
export const SelectItem = ({ children }: React.PropsWithChildren<{ value: string }>) => <div className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-gray-100 hover:bg-gray-100">{children}</div>;
