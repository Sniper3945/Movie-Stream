'use client';

import type { Variants } from 'framer-motion';
import { motion, useAnimation } from 'framer-motion';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

export interface SparklesIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface SparklesIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

function cn(...classes: (string | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

const sparkleVariants: Variants = {
  initial: {
    y: 0,
    fill: 'none',
  },
  hover: {
    y: [0, -1, 0, 0],
    fill: 'currentColor',
    transition: {
      duration: 1,
      bounce: 0.3,
    },
  },
};

const starVariants: Variants = {
  initial: {
    opacity: 1,
    x: 0,
    y: 0,
  },
  blink: () => ({
    opacity: [0, 1, 0, 0, 0, 0, 1],
    transition: {
      duration: 2,
      type: 'spring',
      stiffness: 70,
      damping: 10,
      mass: 0.4,
    },
  }),
};

const SparklesIcon = forwardRef<SparklesIconHandle, SparklesIconProps>(
  ({ onMouseEnter, onMouseLeave, className, size = 24, ...props }, ref) => {
    const starControls = useAnimation();
    const sparkleControls = useAnimation();
    const isControlledRef = useRef(false);

    useImperativeHandle(ref, () => {
      isControlledRef.current = true;

      return {
        startAnimation: () => {
          sparkleControls.start('hover');
          starControls.start('blink', { delay: 1 });
        },
        stopAnimation: () => {
          sparkleControls.start('initial');
          starControls.start('initial');
        },
      };
    });

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isControlledRef.current) {
          sparkleControls.start('hover');
          starControls.start('blink', { delay: 1 });
        }
        onMouseEnter?.(e);
      },
      [onMouseEnter, sparkleControls, starControls]
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isControlledRef.current) {
          sparkleControls.start('initial');
          starControls.start('initial');
        }
        onMouseLeave?.(e);
      },
      [sparkleControls, starControls, onMouseLeave]
    );

    return (
      <div
        className={cn(className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <motion.path
            d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"
            variants={sparkleVariants}
            animate={sparkleControls}
          />
          <motion.path
            d="M20 3v4"
            variants={starVariants}
            animate={starControls}
          />
          <motion.path
            d="M22 5h-4"
            variants={starVariants}
            animate={starControls}
          />
          <motion.path
            d="M4 17v2"
            variants={starVariants}
            animate={starControls}
          />
          <motion.path
            d="M5 18H3"
            variants={starVariants}
            animate={starControls}
          />
        </svg>
      </div>
    );
  }
);

SparklesIcon.displayName = 'SparklesIcon';

export { SparklesIcon };
