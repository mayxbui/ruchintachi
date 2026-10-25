/** Narrow centred column for the signed-out pages. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-md">{children}</div>;
}
