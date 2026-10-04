"use client";

import type { ReactNode } from "react";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import type { Idea } from "@/types";
import { AssistantPanel } from "@/components/ideas/assistant-panel";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function IdeaWorkspace({
  idea,
  crumb,
  children,
}: {
  idea?: Partial<Idea>;
  /** Label of the current page in the breadcrumb trail. */
  crumb?: string;
  children: ReactNode;
}) {
  return (
    <>
      {crumb ? (
        <div className="mb-5">
          <Breadcrumbs
            items={[{ href: "/ideas", label: "Kreator pomysłów" }]}
            current={crumb}
          />
        </div>
      ) : null}
      <div className="mb-6 lg:hidden">
        <Sheet>
          <SheetTrigger className={buttonVariants({ variant: "outline" })}>
            <ChatBubbleLeftRightIcon className="size-6" aria-hidden="true" />
            Asystent
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Asystent</SheetTitle>
            </SheetHeader>
            <div className="px-4 pb-6">
              <AssistantPanel idea={idea} showHeading={false} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-10">
        <div className="flex min-w-0 flex-col gap-8">{children}</div>
        <aside className="hidden border border-border p-4 lg:sticky lg:top-4 lg:block">
          <AssistantPanel idea={idea} />
        </aside>
      </div>
    </>
  );
}
