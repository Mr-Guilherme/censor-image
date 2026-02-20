import type * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

import {
  ToggleGroup as ShadcnToggleGroup,
  ToggleGroupItem as ShadcnToggleGroupItem,
} from "../toggle-group";

export const toggleGroupVariants = cva("", {
  variants: {
    font: { normal: "", retro: "retro" },
    variant: {
      default: "bg-transparent",
      outline:
        "bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground",
    },
    size: {
      default: "h-8 px-2 min-w-8",
      sm: "h-7 px-1.5 min-w-7",
      lg: "h-9 px-2.5 min-w-9",
    },
  },
  defaultVariants: { variant: "default", font: "retro", size: "default" },
});

export type BitToggleGroupProps = React.ComponentPropsWithoutRef<
  typeof ToggleGroupPrimitive.Root
> &
  VariantProps<typeof toggleGroupVariants>;

export type BitToggleGroupItemProps = React.ComponentPropsWithoutRef<
  typeof ToggleGroupPrimitive.Item
> &
  VariantProps<typeof toggleGroupVariants>;

function ToggleGroup({ ...props }: BitToggleGroupProps) {
  const { className, font, children } = props;

  return (
    <ShadcnToggleGroup
      className={cn("gap-2", className, font !== "normal" && "retro")}
      {...props}
    >
      {children}
    </ShadcnToggleGroup>
  );
}

function ToggleGroupItem({ ...props }: BitToggleGroupItemProps) {
  const { className, font, children } = props;

  return (
    <ShadcnToggleGroupItem
      className={cn(
        "relative rounded-none border-2 border-foreground transition-transform active:translate-x-px active:translate-y-px dark:border-ring",
        className,
        font !== "normal" && "retro",
      )}
      {...props}
    >
      {children}
    </ShadcnToggleGroupItem>
  );
}

export { ToggleGroup, ToggleGroupItem };
