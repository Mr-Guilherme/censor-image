"use client";

import * as SliderPrimitive from "@radix-ui/react-slider";
import * as React from "react";

import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
  React.ComponentRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <div className={cn("relative w-full overflow-hidden", className)}>
    <SliderPrimitive.Root
      data-slot="slider"
      ref={ref}
      className="relative flex w-full touch-none select-none items-center py-1.5"
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="relative h-1.5 w-full grow overflow-hidden bg-secondary"
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className="absolute h-full bg-primary"
        />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        data-slot="slider-thumb"
        className="relative block size-4.5 border-2 border-foreground bg-foreground ring-offset-background transition-colors before:absolute before:left-1/2 before:top-1/2 before:size-10 before:-translate-x-1/2 before:-translate-y-1/2 before:content-[''] focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-50 dark:border-ring dark:bg-ring"
      />
    </SliderPrimitive.Root>

    <div
      className="absolute inset-0 border-y-4 border-foreground pointer-events-none dark:border-ring"
      aria-hidden="true"
    />

    <div
      className="absolute inset-0 border-x-4 border-foreground pointer-events-none dark:border-ring"
      aria-hidden="true"
    />
  </div>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
