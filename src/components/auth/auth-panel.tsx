"use client";

import { useState } from "react";
import { SignInForm } from "@/components/auth/sign-in-form";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type AuthMode = "signin" | "signup";

export function AuthPanel({
  initialMode,
  next,
  enabled,
}: {
  initialMode: AuthMode;
  next: string;
  enabled: boolean;
}) {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  function changeMode(value: AuthMode) {
    setMode(value);
    // Keep ?mode=signup in the address bar without a server round trip.
    const url = new URL(window.location.href);
    if (value === "signup") url.searchParams.set("mode", "signup");
    else url.searchParams.delete("mode");
    window.history.replaceState(null, "", url);
  }

  return (
    <Tabs
      value={mode}
      onValueChange={(value) => changeMode(value as AuthMode)}
      className="min-w-0"
    >
      {/* Two equal halves; the labels wrap at 320 px with the largest font. */}
      <TabsList className="w-full items-stretch">
        <TabsTrigger value="signin" className="flex-1 px-2">
          Zaloguj się
        </TabsTrigger>
        <TabsTrigger value="signup" className="flex-1 px-2">
          Załóż konto
        </TabsTrigger>
      </TabsList>
      <TabsContent value="signin" className="text-base">
        <SignInForm next={next} enabled={enabled} />
      </TabsContent>
      <TabsContent value="signup" className="text-base">
        <SignUpForm next={next} enabled={enabled} />
      </TabsContent>
    </Tabs>
  );
}
