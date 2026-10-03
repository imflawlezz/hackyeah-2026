"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/admin/types";

const FAILED =
  "Nie udało się wykonać tej czynności. Sprawdź połączenie i spróbuj ponownie.";

/** Runs a server action, then shows a toast and keeps the message for an aria-live region. */
export function useAdminAction() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  function run<T extends ActionResult>(
    action: () => Promise<T>,
    onDone?: (result: T | ActionResult) => void,
  ) {
    setMessage("");
    startTransition(async () => {
      let result: T | ActionResult;
      try {
        result = await action();
      } catch {
        result = { ok: false, message: FAILED };
      }
      setMessage(result.message);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
      onDone?.(result);
    });
  }

  return { pending, message, run };
}
