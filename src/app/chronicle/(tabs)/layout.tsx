import type { ReactNode } from "react";
import { PageCard } from "@/components/page-card";
import { ChronicleTabs } from "../chronicle-tabs";
import { TimerBar, TimerProvider } from "../timer";

/** My Chronicle with its Today / Tasks sub-tabs. The timer survives switching tabs. */
export default function ChronicleLayout({ children }: { children: ReactNode }) {
  return (
    <PageCard title="My Chronicle">
      <TimerProvider>
        <ChronicleTabs />
        <TimerBar />
        {children}
      </TimerProvider>
    </PageCard>
  );
}
