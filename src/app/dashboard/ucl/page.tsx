import { redirect } from "next/navigation";

export default function UclRoutePage() {
  redirect("/dashboard?tab=UCL");
}
