import type { ReactNode } from "react";
import { PageCard } from "@/components/page-card";
import { ChronicleTabs } from "../chronicle-tabs";

/** My Chronicle with its Today / Tasks sub-tabs. */
export default function ChronicleLayout({ children }: { children: ReactNode }) {
  return (
    <PageCard title="My Chronicle">
      <ChronicleTabs />
      {children}
    </PageCard>
  );
}
