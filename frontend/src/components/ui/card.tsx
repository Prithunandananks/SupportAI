import React from 'react';

export const Card = ({ children, className = '' }: React.PropsWithChildren<{ className?: string }>) => <div className={`bg-white shadow rounded-lg border border-gray-200 ${className}`}>{children}</div>;
export const CardHeader = ({ children, className = '' }: React.PropsWithChildren<{ className?: string }>) => <div className={`px-6 py-4 border-b border-gray-200 ${className}`}>{children}</div>;
export const CardTitle = ({ children, className = '' }: React.PropsWithChildren<{ className?: string }>) => <h3 className={`text-lg font-medium leading-6 text-gray-900 ${className}`}>{children}</h3>;
export const CardDescription = ({ children, className = '' }: React.PropsWithChildren<{ className?: string }>) => <p className={`mt-1 text-sm text-gray-500 ${className}`}>{children}</p>;
export const CardContent = ({ children, className = '' }: React.PropsWithChildren<{ className?: string }>) => <div className={`px-6 py-4 ${className}`}>{children}</div>;
