import type { Components } from "react-markdown";
import Markdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import { cn } from "@/lib/utils";

/**
 * The only elements AI output may produce. Everything else (links, images,
 * headings, code, tables, raw HTML) is unwrapped to its text or dropped.
 */
export const AI_TEXT_ELEMENTS = ["p", "strong", "em", "ul", "ol", "li", "br"];

const components: Components = {
  strong: ({ children }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  ul: ({ children }) => (
    <ul className="flex list-disc flex-col gap-1 pl-5">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="flex list-decimal flex-col gap-1 pl-5">{children}</ol>
  ),
};

/**
 * Renders AI-generated text as a small, safe subset of Markdown: paragraphs,
 * line breaks, bold, italics and lists. Raw HTML is skipped and never
 * rendered as markup. Text size and colour are inherited.
 */
export function AiText({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Markdown
        skipHtml
        allowedElements={AI_TEXT_ELEMENTS}
        unwrapDisallowed
        remarkPlugins={[remarkBreaks]}
        components={components}
      >
        {children}
      </Markdown>
    </div>
  );
}
