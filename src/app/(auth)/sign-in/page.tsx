import { PageCard } from "@/components/page-card";
import { redirectIfSignedIn } from "@/lib/auth/session";
import { SignInForm } from "./sign-in-form";

export default async function SignInPage() {
  await redirectIfSignedIn();
  return (
    <PageCard title="Sign in">
      <SignInForm />
    </PageCard>
  );
}
