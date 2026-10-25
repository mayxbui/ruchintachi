import { PageCard } from "@/components/page-card";
import { MoodBubble, moods } from "@/components/mood-bubble";
import { requireUser } from "@/lib/auth/session";

export default async function MiiPage() {
  await requireUser();
  return (
    <PageCard title="Mii">
      <p className="mb-6 text-ink/70">
        Create your Mii, dress it up and see how it&apos;s feeling.
      </p>
      <ul className="flex flex-wrap gap-4">
        {moods.map((mood) => (
          <li key={mood.id}>
            <MoodBubble mood={mood.id} />
          </li>
        ))}
      </ul>
    </PageCard>
  );
}
