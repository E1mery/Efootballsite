import { redirect } from "next/navigation";

export default function SuperCupRoutePage() {
  redirect("/dashboard?tab=SUPER_CUP");
}
