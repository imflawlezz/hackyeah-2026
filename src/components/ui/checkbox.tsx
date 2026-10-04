import { cn } from "cn";
import type { ComponentProps } from "react";
import { choiceClassName } from "@/components/ui/field";

function Checkbox({
  className,
  ...props
}: Omit<ComponentProps<"input">, "type">) {
  return (
    <input
      type="checkbox"
      data-slot="checkbox"
      className={cn(choiceClassName, className)}
      {...props}
    />
  );
}

export { Checkbox };
