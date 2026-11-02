import { IconLogout } from "@tabler/icons-react";
import { signOut } from "@/lib/auth/actions";

/** Square button beside the streak and coins: signs out at once. */
export function SignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        aria-label="Log out"
        data-hint="Log out"
        className="flex size-11 min-w-0 items-center justify-center rounded-2xl bg-cream/90 text-slate-500 shadow-pop transition duration-300 ease-[cubic-bezier(.3,1.8,.5,1)] hover:-translate-y-0.5 hover:rotate-6 hover:text-cherry focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sunny motion-reduce:hover:transform-none"
      >
        <IconLogout aria-hidden className="size-5 sm:size-6" stroke={2.25} />
      </button>
    </form>
  );
}
