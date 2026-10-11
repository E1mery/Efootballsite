import { redirect } from "next/navigation";

export default function EuropaRoutePage() {
  redirect("/dashboard?tab=EUROPA");
}
