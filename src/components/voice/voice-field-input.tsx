"use client";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { VoiceInputButton } from "./voice-input-button";
import { appendTranscript } from "@/lib/voice/append";

// Read the current field at delivery time, including edits made during upload.
export function VoiceFieldInput({
  getValue,
  onChange,
  limit,
  disabled,
}: {
  getValue: () => string;
  onChange: (value: string, transcript: string) => void;
  limit: number;
  disabled?: boolean;
}) {
  const [overflow, setOverflow] = useState("");
  return (
    <div className="min-w-0 space-y-2">
      <VoiceInputButton
        disabled={disabled || Boolean(overflow)}
        onTranscript={(text) => {
          const combined = appendTranscript(getValue(), text, limit);
          if (combined === null) setOverflow(text);
          else onChange(combined, text);
        }}
      />
      {overflow && (
        <div className="space-y-2 border border-input p-2.5">
          <p role="status" aria-live="polite">
            Rozpoznany tekst przekracza limit {limit} znaków. Pole pozostaje bez
            zmian. Skróć tekst i skopiuj go do pola.
          </p>
          <label className="block">
            Rozpoznany tekst do skrócenia
            <Textarea
              className="mt-2 field-sizing-fixed min-h-28"
              value={overflow}
              onChange={(event) => setOverflow(event.target.value)}
            />
          </label>
        </div>
      )}
    </div>
  );
}
