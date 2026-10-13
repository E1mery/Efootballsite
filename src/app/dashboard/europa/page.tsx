import { redirect } from "next/navigation";

export default function EuropaRoutePage() {
  redirect("/dashboard?tab=INTERDIVISION_CUPS&cup=EUROPA");
}
