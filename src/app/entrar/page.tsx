import { redirect } from "next/navigation";
import { getUserId } from "@/lib/auth";
import { FormAcesso } from "./form-acesso";

export const dynamic = "force-dynamic";

export default async function EntrarPage() {
  // Já logado? Vai pra home (que decide entre feed e aguardando).
  const uid = await getUserId();
  if (uid) redirect("/");
  return <FormAcesso />;
}
