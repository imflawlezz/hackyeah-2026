import { Input as InputPrimitive } from "@base-ui/react/input";
import { cn } from "cn";
import type { ComponentProps } from "react";
import { fieldClassName } from "@/components/ui/field";

function Input({ className, type, ...props }: ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        fieldClassName,
        "h-11 file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-base file:font-semibold file:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
