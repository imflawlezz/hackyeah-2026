"use client";
import { MicrophoneIcon, StopIcon } from "@heroicons/react/20/solid";
import { Button } from "@/components/ui/button";
import { useVoiceInput } from "@/lib/voice/use-voice-input";

export interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}
export function VoiceInputButton({
  onTranscript,
  disabled,
}: VoiceInputButtonProps) {
  const voice = useVoiceInput(onTranscript);
  const busy = ["requesting", "recording", "transcribing"].includes(
    voice.state,
  );
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <p className="text-sm text-muted-foreground">
        Nagranie zostanie przesłane do OpenAI w celu rozpoznania mowy. HubMI nie
        zapisuje nagrania.
      </p>
      <div className="flex flex-wrap gap-2">
        {voice.state === "recording" ? (
          <Button
            type="button"
            variant="outline"
            className="h-auto min-h-11 whitespace-normal"
            onClick={voice.stop}
          >
            <StopIcon aria-hidden="true" className="size-5" />
            Zatrzymaj nagrywanie
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="h-auto min-h-11 whitespace-normal"
            disabled={disabled || busy}
            onClick={() => void voice.start()}
          >
            <MicrophoneIcon aria-hidden="true" className="size-5" />
            Wprowadź głosowo
          </Button>
        )}
        {busy && (
          <Button
            type="button"
            variant="outline"
            className="h-auto min-h-11 whitespace-normal"
            onClick={voice.cancel}
          >
            Anuluj
          </Button>
        )}
      </div>
      <p
        role={
          voice.status || voice.state === "requesting" ? "status" : undefined
        }
        aria-live="polite"
        aria-atomic="true"
        className="text-sm"
      >
        {voice.state === "requesting"
          ? "Czekamy na dostęp do mikrofonu…"
          : voice.status}
      </p>
    </div>
  );
}
