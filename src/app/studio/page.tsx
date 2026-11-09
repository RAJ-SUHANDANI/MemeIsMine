import { requireAccount } from "@/lib/require-account";
import Studio from "./studio";

export default async function StudioPage() {
  await requireAccount("/studio");
  return <Studio />;
}
