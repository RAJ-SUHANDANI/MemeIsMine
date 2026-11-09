import { AccountForm } from "@/components/account-form";
export const metadata = { title: "Create an account" };
export default async function Signup({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; status?: string }>;
}) {
  return <AccountForm mode="signup" query={await searchParams} />;
}
