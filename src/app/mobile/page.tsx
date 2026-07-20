import { redirect } from "next/navigation";

export default function MobileEntryPoint() {
  redirect("/?platform=android");
}
