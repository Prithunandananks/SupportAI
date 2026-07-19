import React from 'react';
import type { TdHTMLAttributes, ThHTMLAttributes } from 'react';

export const Table = ({ children, className = '' }: React.PropsWithChildren<{ className?: string }>) => <div className="w-full overflow-auto"><table className={`w-full caption-bottom text-sm ${className}`}>{children}</table></div>;
export const TableHeader = ({ children, className = '' }: React.PropsWithChildren<{ className?: string }>) => <thead className={`[&_tr]:border-b ${className}`}>{children}</thead>;
export const TableBody = ({ children, className = '' }: React.PropsWithChildren<{ className?: string }>) => <tbody className={`[&_tr:last-child]:border-0 ${className}`}>{children}</tbody>;
export const TableRow = ({ children, className = '' }: React.PropsWithChildren<{ className?: string }>) => <tr className={`border-b transition-colors hover:bg-gray-50/50 data-[state=selected]:bg-gray-50 ${className}`}>{children}</tr>;
export const TableHead = ({ children, className = '', ...props }: ThHTMLAttributes<HTMLTableCellElement>) => <th className={`h-12 px-4 text-left align-middle font-medium text-gray-500 [&:has([role=checkbox])]:pr-0 ${className}`} {...props}>{children}</th>;
export const TableCell = ({ children, className = '', ...props }: TdHTMLAttributes<HTMLTableCellElement>) => <td className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 ${className}`} {...props}>{children}</td>;
