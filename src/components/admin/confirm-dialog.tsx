"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type ConfirmRequest = {
  title: string;
  description: string;
  confirmLabel: string;
  noteLabel?: string;
  noteHint?: string;
  destructive?: boolean;
  onConfirm: (note: string) => void;
  /** Where focus goes after confirming, e.g. a heading that outlives the removed item. */
  focusAfterConfirm?: () => HTMLElement | null;
};

/** Explicit confirm step for moderation actions, with an optional note. */
export function ConfirmDialog({
  request,
  onClose,
}: {
  request: ConfirmRequest | null;
  onClose: () => void;
}) {
  const id = useId();
  const [note, setNote] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  // Keep rendering the last request while the dialog closes.
  const [shown, setShown] = useState<ConfirmRequest | null>(request);
  if (request && request !== shown) {
    setShown(request);
    setConfirmed(false);
  }

  return (
    <Dialog
      open={request !== null}
      onOpenChange={(open) => {
        if (!open) {
          setNote("");
          onClose();
        }
      }}
    >
      {shown && (
        <DialogContent
          showCloseButton={false}
          finalFocus={() =>
            confirmed ? (shown.focusAfterConfirm?.() ?? true) : true
          }
          className="gap-4 p-6 sm:max-w-lg"
        >
          <DialogTitle className="text-xl leading-snug font-semibold">
            {shown.title}
          </DialogTitle>
          <DialogDescription className="text-base text-foreground">
            {shown.description}
          </DialogDescription>
          {shown.noteLabel && (
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${id}-note`} className="text-base font-semibold">
                {shown.noteLabel}
              </Label>
              {shown.noteHint && (
                <p
                  id={`${id}-hint`}
                  className="text-base text-muted-foreground"
                >
                  {shown.noteHint}
                </p>
              )}
              <Textarea
                id={`${id}-note`}
                rows={3}
                maxLength={1000}
                value={note}
                aria-describedby={shown.noteHint ? `${id}-hint` : undefined}
                onChange={(event) => setNote(event.target.value)}
                className="field-sizing-fixed text-base md:text-base"
              />
            </div>
          )}
          <DialogFooter className="-mx-6 -mb-6 p-4">
            <DialogClose
              render={
                <Button
                  variant="outline"
                  className="h-auto min-h-11 max-w-full py-2 text-base whitespace-normal"
                />
              }
            >
              Anuluj
            </DialogClose>
            <Button
              type="button"
              variant={shown.destructive ? "destructive" : "default"}
              className="h-auto min-h-11 max-w-full py-2 text-base whitespace-normal"
              onClick={() => {
                setConfirmed(true);
                shown.onConfirm(note.trim());
                setNote("");
                onClose();
              }}
            >
              {shown.confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
