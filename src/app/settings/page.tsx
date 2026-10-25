import { PageCard } from "@/components/page-card";

const faq = [
  {
    q: "What do I need to sign up?",
    a: "Just a username and password. We never ask for your email or real name.",
  },
  {
    q: "How do I get a gift?",
    a: "Tick every task scheduled for today and your Mii gives you a random gift. A day with no tasks gives no gift.",
  },
  {
    q: "What's a perfect week?",
    a: "Every task scheduled during the week is ticked. Days with no tasks don't count against you. A perfect week lets you gift your Mii a clothing item.",
  },
  {
    q: "What can my friends see?",
    a: "Only your Mii: its look, its clothes and its item collection. Your habits, diary and calendar stay private.",
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageCard title="Settings">
        <p className="text-ink/70">
          Time zone, week start, account and recovery code will live here.
        </p>
      </PageCard>

      <PageCard title="FAQ">
        <dl className="space-y-4">
          {faq.map(({ q, a }) => (
            <div key={q}>
              <dt className="font-bold">{q}</dt>
              <dd className="text-ink/70">{a}</dd>
            </div>
          ))}
        </dl>
      </PageCard>
    </div>
  );
}
