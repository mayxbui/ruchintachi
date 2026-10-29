import { IconChevronDown, IconSparkles, IconTool, IconWand } from "@tabler/icons-react";
import { formatReleaseDate, type Release, type ReleaseTag } from "@/lib/changelog";

const tagStyles: Record<ReleaseTag, { label: string; icon: typeof IconSparkles; bg: string }> = {
  feature: { label: "New feature", icon: IconSparkles, bg: "bg-tangerine" },
  fix: { label: "Bug fix", icon: IconTool, bg: "bg-sky" },
  improvement: { label: "Improvement", icon: IconWand, bg: "bg-leaf" },
};

/** Coloured square with the tag's icon; the label shows as a hover hint. */
function TagBadge({ tag }: { tag: ReleaseTag }) {
  const { label, icon: Icon, bg } = tagStyles[tag];
  return (
    <span
      data-hint={label}
      className={`grid size-8 shrink-0 place-items-center rounded-xl text-white sm:size-9 ${bg}`}
    >
      <Icon aria-hidden className="size-5" stroke={2.25} />
      <span className="sr-only">{label}</span>
    </span>
  );
}

/** Badge, version and title on the left; date (and chevron) on the right. */
function ReleaseHeader({
  release,
  current,
  chevron,
}: {
  release: Release;
  current?: boolean;
  chevron?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <TagBadge tag={release.tag} />
      <span className="font-bold text-caption">
        {release.major ? "v" : ""}
        {release.version}
      </span>
      <h2 className="text-lg font-black sm:text-xl">{release.title}</h2>
      {current && release.major && (
        <span className="rounded-full border-2 border-ink bg-sunny px-2.5 py-0.5 text-xs font-black tracking-wide uppercase">
          Current
        </span>
      )}
      <span className="ml-auto flex items-center gap-3">
        <time dateTime={release.date} className="text-sm font-bold text-caption sm:text-base">
          {formatReleaseDate(release.date)}
        </time>
        {chevron && (
          <IconChevronDown
            aria-hidden
            className="size-5 transition-transform duration-300 group-open:rotate-180"
            stroke={2.5}
          />
        )}
      </span>
    </div>
  );
}

function ChangeList({ changes }: { changes: string[] }) {
  return (
    <ul className="space-y-1.5">
      {changes.map((change) => (
        <li key={change} className="flex gap-2.5">
          <span aria-hidden className="mt-2.5 size-2 shrink-0 rounded-full bg-tangerine" />
          <span>{change}</span>
        </li>
      ))}
    </ul>
  );
}

/** Summary, flat changes and sections, in that order. */
function ReleaseBody({ release }: { release: Release }) {
  return (
    <div className="mt-4 space-y-4">
      {release.major && (
        <span className="inline-block -rotate-2 rounded-full border-2 border-ink bg-sunny px-4 py-1 text-sm font-black shadow-[0.2rem_0.2rem_0_0_var(--color-ink)]">
          ✨ Major release
        </span>
      )}
      {release.summary && <p className="font-bold">{release.summary}</p>}
      {release.changes && <ChangeList changes={release.changes} />}
      {release.sections?.map((section) => (
        <div key={section.heading}>
          <h3 className="mb-2 text-sm font-black tracking-wide uppercase">{section.heading}</h3>
          <ChangeList changes={section.changes} />
        </div>
      ))}
    </div>
  );
}

// Major releases stand out: thick ink border with a hard offset shadow.
const boxStyle = (release: Release) =>
  release.major
    ? "border-4 border-ink bg-sunny/15 shadow-[0.4rem_0.4rem_0_0_var(--color-ink)]"
    : "bg-white shadow-pop";

/** One release, always open (the Settings card). */
export function ReleaseCard({ release, current }: { release: Release; current?: boolean }) {
  return (
    <article className={`rounded-2xl px-4 py-4 sm:px-6 sm:py-5 ${boxStyle(release)}`}>
      <ReleaseHeader release={release} current={current} />
      <ReleaseBody release={release} />
    </article>
  );
}

/** One release as a dropdown (the changelog page). Native <details>, no JS. */
export function ReleaseDropdown({ release, current }: { release: Release; current?: boolean }) {
  return (
    <details open={current} className={`group rounded-2xl px-4 py-4 sm:px-6 sm:py-5 ${boxStyle(release)}`}>
      <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        <ReleaseHeader release={release} current={current} chevron />
      </summary>
      <ReleaseBody release={release} />
    </details>
  );
}

export function NoReleases() {
  return (
    <p className="rounded-2xl bg-white px-4 py-4 text-caption shadow-pop sm:px-6">
      No updates yet. Check back after launch!
    </p>
  );
}
