import React from 'react';

export const Dialog = ({ open, onOpenChange, children }: { open?: boolean; onOpenChange?: (open: boolean) => void; children?: React.ReactNode }) => open ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => onOpenChange?.(false)}><div className="relative bg-white rounded-lg shadow-lg w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>{children}</div></div> : null;
export const DialogTrigger = ({ children }: React.PropsWithChildren<{ asChild?: boolean }>) => <>{children}</>;
export const DialogContent = ({ children, className = '' }: React.PropsWithChildren<{ className?: string }>) => <div className={`p-6 ${className}`}>{children}</div>;
export const DialogHeader = ({ children, className = '' }: React.PropsWithChildren<{ className?: string }>) => <div className={`flex flex-col space-y-1.5 text-center sm:text-left ${className}`}>{children}</div>;
export const DialogTitle = ({ children, className = '' }: React.PropsWithChildren<{ className?: string }>) => <h2 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>{children}</h2>;
