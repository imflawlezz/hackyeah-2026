/**
 * Shared chrome for text fields and native selects.
 * `dark:` is inert: the site never sets `.dark` (see `@custom-variant dark`).
 */
export const fieldClassName = [
  "w-full min-w-0 rounded border border-input bg-background px-3 text-base text-foreground",
  "transition-colors outline-none placeholder:text-muted-foreground",
  "hover:border-foreground",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring",
  "disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:hover:border-input",
  "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive aria-invalid:hover:border-destructive",
].join(" ");

/** Checkbox and radio. The label supplies the 44px target. */
export const choiceClassName =
  "size-6 shrink-0 accent-primary disabled:cursor-not-allowed";
