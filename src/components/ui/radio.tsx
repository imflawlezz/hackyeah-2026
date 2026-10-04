import { cn } from "cn";
import type { ComponentProps } from "react";
import { choiceClassName } from "@/components/ui/field";

function Radio({ className, ...props }: Omit<ComponentProps<"input">, "type">) {
  return (
    <input
      type="radio"
      data-slot="radio"
      className={cn(choiceClassName, className)}
      {...props}
    />
  );
}

export { Radio };
