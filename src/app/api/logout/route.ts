import { destroySession } from "@/lib/auth-session";
import { redirect } from "next/navigation";

export async function GET() {
  await destroySession();
  redirect("/login");
}
