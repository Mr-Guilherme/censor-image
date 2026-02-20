import { cva, type VariantProps } from "class-variance-authority";
import { Button as ShadcnButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const buttonVariants = cva("", {
  variants: {
    font: {
      normal: "",
      retro: "retro",
    },
    variant: {
      default: "bg-foreground",
      destructive: "bg-foreground",
      outline: "bg-foreground",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      link: "text-primary underline-offset-4 hover:underline",
    },
    size: {
      default: "h-8 px-3 py-1.5 has-[>svg]:px-2.5",
      sm: "h-7 rounded-md gap-1 px-2.5 has-[>svg]:px-2",
      lg: "h-9 rounded-md px-5 has-[>svg]:px-3.5",
      icon: "size-8",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export interface BitButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

function Button({ children, asChild, ...props }: BitButtonProps) {
  const { variant, size, className, font } = props;

  return (
    <ShadcnButton
      {...props}
      className={cn(
        "relative m-0 rounded-none border-2 border-foreground px-2 py-1 font-medium shadow-[2px_2px_0_0_theme(colors.foreground)] transition-transform active:translate-y-px dark:border-ring dark:shadow-[2px_2px_0_0_theme(colors.ring)]",
        variant === "ghost" &&
          "border-transparent bg-transparent shadow-none hover:border-foreground/60 hover:bg-accent/40 dark:hover:border-ring/60",
        variant === "link" && "border-transparent bg-transparent shadow-none",
        size === "icon" && "p-0",
        font !== "normal" && "retro",
        className,
      )}
      size={size}
      variant={variant}
      asChild={asChild}
    >
      {children}
    </ShadcnButton>
  );
}

export { Button };
