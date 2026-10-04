import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { cn } from "cn";
import type { ComponentProps } from "react";
import { fieldClassName } from "@/components/ui/field";

function NativeSelect({ className, ...props }: ComponentProps<"select">) {
  return (
    <div className={cn("relative w-full min-w-0", className)}>
      <select
        data-slot="native-select"
        className={cn(fieldClassName, "peer h-11 appearance-none pr-10")}
        {...props}
      />
      <ChevronDownIcon
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-foreground peer-disabled:text-muted-foreground"
      />
    </div>
  );
}

export { NativeSelect };
