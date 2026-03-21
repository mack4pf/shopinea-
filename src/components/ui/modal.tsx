"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Button } from "./button";
import { motion, AnimatePresence } from "framer-motion";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, description, children, footer }: ModalProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/70 backdrop-blur-md"
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative bg-zinc-900 w-full max-w-lg rounded-[2.5rem] shadow-[0_0_80px_rgba(59,130,246,0.08)] border border-zinc-800 overflow-hidden"
                >
                    {/* Subtle top glow accent */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[2px] bg-gradient-to-r from-transparent via-blue-500/60 to-transparent" />

                    <div className="p-8 border-b border-zinc-800/60 flex items-center justify-between relative">
                        <div className="absolute inset-0 bg-gradient-to-b from-zinc-800/20 to-transparent pointer-events-none" />
                        <div className="relative">
                            <h2 className="text-2xl font-black text-white tracking-tight italic uppercase">{title}</h2>
                            {description && <p className="text-[11px] font-bold text-zinc-500 mt-1.5 uppercase tracking-widest">{description}</p>}
                        </div>
                        <button
                            onClick={onClose}
                            className="relative p-2.5 rounded-xl bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-500 hover:text-white transition-all border border-zinc-700/50 hover:border-zinc-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-8 overflow-y-auto max-h-[70vh]">
                        {children}
                    </div>

                    {footer && (
                        <div className="p-8 border-t border-zinc-800/60 bg-zinc-950/50 flex justify-end gap-3">
                            {footer}
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
