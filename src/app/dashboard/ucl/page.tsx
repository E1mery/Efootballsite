import { redirect } from "next/navigation";

export default function UclRoutePage() {
  redirect("/dashboard?tab=INTERDIVISION_CUPS&cup=UCL");
}
