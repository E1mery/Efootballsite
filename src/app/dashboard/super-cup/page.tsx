import { redirect } from "next/navigation";

export default function SuperCupRoutePage() {
  redirect("/dashboard?tab=INTERDIVISION_CUPS&cup=SUPER_CUP");
}
