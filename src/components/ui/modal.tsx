"use client";

import * as React from "react";
import { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    panelClassName?: string;
}

export function Modal({ isOpen, onClose, title, description, children, footer, panelClassName }: ModalProps) {
    // Lock body scroll while open
    useEffect(() => {
        if (!isOpen) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = prev; };
    }, [isOpen]);

    // Close on Escape key
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

            {/* Panel */}
            <div
                className={`relative bg-zinc-900 w-full max-w-lg rounded-[2.5rem] shadow-[0_0_80px_rgba(59,130,246,0.08)] border border-zinc-800 my-8 flex flex-col overflow-hidden ${panelClassName || ""}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Top glow accent */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[2px] bg-gradient-to-r from-transparent via-blue-500/60 to-transparent pointer-events-none" />

                {/* Header — sticky, never scrolls away */}
                <div className="flex-shrink-0 px-8 py-6 border-b border-zinc-800/60 flex items-center justify-between bg-zinc-900">
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight italic uppercase">{title}</h2>
                        {description && <p className="text-[11px] font-bold text-zinc-500 mt-1.5 uppercase tracking-widest">{description}</p>}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2.5 rounded-xl bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-500 hover:text-white transition-all border border-zinc-700/50 hover:border-zinc-600 flex-shrink-0 ml-4"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable content */}
                <div className="overflow-y-auto max-h-[65vh] p-8">
                    {children}
                </div>

                {footer && (
                    <div className="flex-shrink-0 px-8 py-6 border-t border-zinc-800/60 bg-zinc-950/50 flex justify-end gap-3">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
