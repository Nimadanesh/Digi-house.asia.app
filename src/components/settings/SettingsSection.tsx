"use client";
// File responsibility: consistent settings section shell — uppercase label + grouped block.
import type { ReactNode } from "react";
import { Block } from "@/components/common/Block";
import { SectionLabel } from "@/components/common/SectionLabel";

export function SettingsSection({
  label,
  children,
  testId,
}: {
  label: string;
  children: ReactNode;
  testId?: string;
}) {
  return (
    <section className="space-y-2.5" data-testid={testId}>
      <SectionLabel className="px-0.5">{label}</SectionLabel>
      <Block>{children}</Block>
    </section>
  );
}
