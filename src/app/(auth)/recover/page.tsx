import { PageCard } from "@/components/page-card";
import { RecoverForm } from "./recover-form";

export default function RecoverPage() {
  return (
    <PageCard title="Forgot your password?">
      <p className="mb-6 text-ink/70">
        Use the recovery code you saved when you signed up. There&apos;s no
        email reset, since we don&apos;t keep your email.
      </p>
      <RecoverForm />
    </PageCard>
  );
}
