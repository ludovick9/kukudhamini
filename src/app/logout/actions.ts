"use server";

import { redirect } from "next/navigation";
import { logoutCurrentUser } from "@/lib/auth";

export async function logoutAction() {
  await logoutCurrentUser();
  redirect("/login");
}
