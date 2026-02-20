import { cva, type VariantProps } from "class-variance-authority";
import { Input as ShadcnInput } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const inputVariants = cva("", {
  variants: {
    font: {
      normal: "",
      retro: "retro",
    },
  },
  defaultVariants: {
    font: "retro",
  },
});

export interface BitInputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  asChild?: boolean;
}

function Input({ ...props }: BitInputProps) {
  const { className, font } = props;

  return (
    <div
      className={cn(
        "relative flex min-w-0 items-center overflow-hidden border-y-6 border-foreground !p-0 dark:border-ring",
        className,
      )}
    >
      <ShadcnInput
        {...props}
        className={cn(
          "rounded-none ring-0 !w-full",
          font !== "normal" && "retro",
          className,
        )}
      />

      <div
        className="absolute inset-0 border-x-6 border-foreground pointer-events-none dark:border-ring"
        aria-hidden="true"
      />
    </div>
  );
}

export { Input };
