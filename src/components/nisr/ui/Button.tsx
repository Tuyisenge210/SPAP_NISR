import { cva, type VariantProps } from "class-variance-authority";
import { Button as ShadcnButton } from "@/components/ui/button";
import type { ComponentPropsWithoutRef } from "react";

const nisrButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-secondary",
        accent: "text-accent-foreground hover:opacity-90 focus:ring-accent",
        outline: "border bg-transparent hover:bg-secondary focus:ring-primary",
        ghost: "hover:bg-secondary focus:ring-primary",
        success: "bg-success text-success-foreground hover:bg-success/90 focus:ring-success",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

type NisrButtonProps = ComponentPropsWithoutRef<typeof ShadcnButton> &
  VariantProps<typeof nisrButtonVariants>;

export function NisrButton({ variant = "primary", size = "md", className, ...props }: NisrButtonProps) {
  return <ShadcnButton className={nisrButtonVariants({ variant, size, className })} {...props} />;
}