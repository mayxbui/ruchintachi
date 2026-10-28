import { PageCard } from "@/components/page-card";
import { signOut } from "@/lib/auth/actions";
import { requireUser } from "@/lib/auth/session";
import {
  DeleteAccountForm,
  PreferencesForm,
  RecoveryCodeForm,
} from "./settings-forms";

const faq = [
  {
    q: "What do I need to sign up?",
    a: "Just a username and password. We never ask for your email or real name.",
  },
  {
    q: "I forgot my password. What now?",
    a: "Use the recovery code you saved at sign-up on the “Forgot password?” page. Without it we can't get you back in, since we don't keep an email.",
  },
  {
    q: "How do I get a gift?",
    a: "Tick every task scheduled for today and your Mii gives you a random gift. A day with no tasks gives no gift.",
  },
  {
    q: "What can my friends see?",
    a: "Only your Mii: its look, its clothes and its item collection. Your habits, chronicle and calendar stay private.",
  },
];

export default async function SettingsPage() {
  const user = await requireUser();
  // "UTC" isn't in the IANA list Node returns, so add it back.
  const timeZones = ["UTC", ...Intl.supportedValuesOf("timeZone").filter((z) => z !== "UTC")];

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageCard title="Settings" border="sunny">
        <PreferencesForm
          timeZone={user.timeZone}
          weekStart={user.weekStart}
          timeZones={timeZones}
        />
      </PageCard>

      <PageCard title="Account" border="sunny">
        <dl className="mb-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
          <dt className="font-bold">Username</dt>
          <dd>{user.username}</dd>
          <dt className="font-bold">Friend code</dt>
          <dd className="font-mono">{user.friendCode}</dd>
        </dl>
        <form action={signOut}>
          <button type="submit" className="bg-white px-4 py-2 font-bold sm:px-6 sm:py-3">
            Sign out
          </button>
        </form>
      </PageCard>

      <PageCard title="Recovery code" border="sunny">
        <RecoveryCodeForm />
      </PageCard>

      <PageCard title="Delete account" border="sunny">
        <DeleteAccountForm username={user.username} />
      </PageCard>

      <PageCard title="FAQ" border="sunny">
        {/* Native <details>: each question toggles its answer, no JS needed. */}
        <div className="space-y-3">
          {faq.map(({ q, a }) => (
            <details key={q} className="group rounded-2xl bg-white px-4 py-3 shadow-pop">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-bold [&::-webkit-details-marker]:hidden">
                {q}
                <span
                  aria-hidden
                  className="text-2xl leading-none text-tangerine transition-transform duration-300 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-2 text-caption">{a}</p>
            </details>
          ))}
        </div>
      </PageCard>
    </div>
  );
}
