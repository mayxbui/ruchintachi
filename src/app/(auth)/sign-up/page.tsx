import { PageCard } from "@/components/page-card";
import { SignUpForm } from "./sign-up-form";

// No "already signed in" redirect here: signing up sets the session
// cookie, which re-renders this page, and the new recovery code must
// still be on screen when that happens.
export default function SignUpPage() {
  return (
    <PageCard title="Sign up">
      <p className="mb-6 text-caption">
        Just a username and password. No email, no real name.
      </p>
      <SignUpForm />
    </PageCard>
  );
}
