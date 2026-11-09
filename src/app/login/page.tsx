import { AccountForm } from "@/components/account-form";
export const metadata = { title: "Sign in" };
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; status?: string }>;
}) {
  return <AccountForm mode="login" query={await searchParams} />;
}
