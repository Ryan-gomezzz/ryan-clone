"use client";

import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-sans text-sm tracking-tight transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none focus:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded-md",
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-bg hover:bg-accent-hot hover:shadow-[0_8px_32px_-12px_var(--accent)]",
        ghost:
          "bg-transparent text-fg-muted hover:text-fg border border-border hover:border-border-hover hover:bg-bg-soft",
        outline:
          "bg-transparent text-fg border border-border hover:border-accent hover:bg-bg-soft",
      },
      size: {
        sm: "h-9 px-4",
        md: "h-11 px-6",
        lg: "h-14 px-8 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Button.displayName = "Button";
