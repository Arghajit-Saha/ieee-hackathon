'use client';

import { motion } from 'framer-motion';
import haptic from '@/lib/haptics';
import { ReactNode } from 'react';

interface HapticButtonProps {
    children: ReactNode;
    onClick?: () => void;
    className?: string;
    variant?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';
    disabled?: boolean;
}

export default function HapticButton({
    children,
    onClick,
    className = '',
    variant = 'light',
    disabled = false,
}: HapticButtonProps) {
    const handleClick = () => {
        if (disabled) return;

        // Trigger haptic feedback
        haptic[variant]();

        // Call original onClick if provided
        if (onClick) onClick();
    };

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClick}
            disabled={disabled}
            className={className}
        >
            {children}
        </motion.button>
    );
}
