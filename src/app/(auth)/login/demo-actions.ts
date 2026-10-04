"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const accounts = {
  resident: { email: "resident@hubmi.example", next: "/ideas/new" },
  jst: { email: "jst@hubmi.example", next: "/institutions" },
  expert: { email: "expert@hubmi.example", next: "/messages" },
  admin: { email: "admin@hubmi.example", next: "/admin/moderation" },
} as const;

export async function signInAsDemo(role: unknown): Promise<{ error: string }> {
  if (process.env.DEMO_LOGIN_ENABLED !== "true") {
    return { error: "Logowanie demonstracyjne jest wyłączone." };
  }
  if (typeof role !== "string" || !Object.hasOwn(accounts, role)) {
    return { error: "Wybierz poprawne konto demonstracyjne." };
  }
  const account = accounts[role as keyof typeof accounts];
  const password = process.env.DEMO_USER_PASSWORD;
  const failure = {
    error: "Nie udało się zalogować. Spróbuj ponownie później.",
  };
  if (!password) return failure;
  try {
    const client = await createClient();
    if (!client) return failure;
    const { error } = await client.auth.signInWithPassword({
      email: account.email,
      password,
    });
    if (error) return failure;
  } catch {
    return failure;
  }
  revalidatePath("/", "layout");
  redirect(account.next);
}
