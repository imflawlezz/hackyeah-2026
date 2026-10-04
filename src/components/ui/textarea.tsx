import { cn } from "cn";
import type { ComponentProps } from "react";
import { fieldClassName } from "@/components/ui/field";

function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        fieldClassName,
        "field-sizing-content min-h-24 py-2",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
