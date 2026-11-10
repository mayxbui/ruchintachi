import Link from "next/link";
import { IconArrowRight } from "@tabler/icons-react";
import { NoReleases, ReleaseCard } from "@/components/changelog";
import { BackgroundPicker } from "@/components/background-picker";
import { PageCard } from "@/components/page-card";
import { signOut } from "@/lib/auth/actions";
import { requireUser } from "@/lib/auth/session";
import { releases } from "@/lib/changelog";
import { townEnabled } from "@/lib/features";
import {
  DeleteAccountForm,
  ResetAccountForm,
  PreferencesForm,
  RecoveryCodeForm,
} from "./settings-forms";

const faq: { q: string; a: string; town?: boolean }[] = [
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
    a: "A day where you finish every repeating habit is a complete day. When a week ends, you roll one gift for each complete day and keep the rarest; it sits on the week's last day on your Progress calendar. Open My Chronicle to unwrap it. A week with no complete days gives no gift, and one-off tasks don't count.",
  },
  {
    q: "What is my streak?",
    a: "The number next to the rubber duck: how many complete days in a row you've had, up to today or yesterday. Days with no repeating habits are skipped: they don't break it or add to it.",
  },
  {
    q: "Where are my streak and coins?",
    a: "Right of the menu at the top of every page (top-right on phones), and in the pop-out window. Only you can see your coins.",
  },
  {
    q: "How do I earn coins?",
    a: "Each repeating habit you tick earns 2 coins (up to 10 a day). A complete day adds 20, plus 2 for every day of your streak (up to 20). Unticking never takes coins back. Your coins are private.",
  },
  {
    q: "I missed a day. Is my streak gone?",
    a: "If you had a streak before yesterday's miss, My Chronicle offers a repair for 100 coins until today ends. A repaired day gets a patch on your calendar and counts like a day off: it keeps your streak but earns no coins and doesn't count towards the weekly gift. One repair per week, and two missed days in a row can't be repaired.",
  },
  {
    q: "What do the faces on my calendar mean?",
    a: "Each finished day on the Progress calendar shows your mood at the end of that day. A complete day lifts your mood, each habit you miss lowers it, and a perfect week gives it an extra lift. Days with no repeating habits leave it as it was.",
  },
  {
    q: "What can my friends see?",
    a: "Your item collection and, while “share progress” is on, today's % done and your streak. Your habits, chronicle, calendar and mood stay private.",
    town: true,
  },
  {
    q: "How do I change the background?",
    a: "In Settings, under Background. Tap a picture and every page switches to it straight away.",
  },
  {
    q: "How do I keep my tasks on my desktop?",
    a: "On a computer with Chrome or Edge, press the pop-out button (the window icon) on My Chronicle. A small window with today's tasks, your mood, your streak and your coins stays on top of your other windows until you close it or this tab. You can tick tasks, rename them, change their icons and add one-off tasks there. Other browsers and phones don't support it yet.",
  },
];

export default async function SettingsPage() {
  const latest = releases.at(0);
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

      <PageCard title="Background" border="sunny">
        <p className="mb-3 text-caption">Pick a background for every page. It switches straight away.</p>
        <BackgroundPicker background={user.background} />
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

      <PageCard title="Reset account" border="sunny">
        <ResetAccountForm username={user.username} />
      </PageCard>

      <PageCard title="Delete account" border="sunny">
        <DeleteAccountForm username={user.username} />
      </PageCard>

      <PageCard title="What's new" border="sunny">
        {latest ? <ReleaseCard release={latest} current /> : <NoReleases />}
        <Link
          href="/settings/changelog"
          className="mt-4 inline-flex items-center gap-1.5 font-black text-tangerine hover:underline"
        >
          View full changelog
          <IconArrowRight aria-hidden className="size-5" stroke={2.5} />
        </Link>
      </PageCard>

      <PageCard id="faq" title="FAQ" border="sunny">
        {/* Native <details>: each question toggles its answer, no JS needed. */}
        <div className="space-y-3">
          {faq.filter((item) => !item.town || townEnabled()).map(({ q, a }) => (
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
