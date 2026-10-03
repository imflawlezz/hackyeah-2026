"use client";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "group/tabs flex gap-6 data-horizontal:flex-col",
        className,
      )}
      {...props}
    />
  );
}

// No fixed height: the strip grows with its triggers, so it also holds them at
// larger text sizes and when they wrap onto several rows.
const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit max-w-full flex-wrap items-center justify-start gap-1 text-muted-foreground group-data-vertical/tabs:flex-col group-data-vertical/tabs:items-stretch",
  {
    variants: {
      variant: {
        default: "rounded-md border border-border bg-muted p-1",
        line: "bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function TabsList({
  className,
  variant = "default",
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        // Size comes from the content plus a 44 px minimum, the same for every
        // trigger, so active and inactive tabs share a height and a baseline.
        "relative inline-flex min-h-11 max-w-full flex-auto cursor-pointer items-center justify-center gap-2 rounded-sm border border-transparent bg-transparent px-4 py-2 text-base font-medium text-muted-foreground shadow-none transition-colors group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start hover:text-foreground focus-visible:z-10 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
        // The selected tab: page background, stronger text and an indicator
        // bar, so it does not rely on colour alone and has no button shadow.
        "data-active:bg-background data-active:text-foreground group-data-[variant=line]/tabs-list:data-active:bg-transparent",
        "after:absolute after:rounded-full after:bg-primary after:opacity-0 after:transition-opacity group-data-horizontal/tabs:after:inset-x-3 group-data-horizontal/tabs:after:bottom-1 group-data-horizontal/tabs:after:h-[3px] group-data-vertical/tabs:after:inset-y-2 group-data-vertical/tabs:after:left-1 group-data-vertical/tabs:after:w-[3px] data-active:after:opacity-100",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants };
