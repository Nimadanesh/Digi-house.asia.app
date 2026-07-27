import { writeFileSync } from "fs";

const allocation = [
  '// File responsibility: horizontal allocation bar + legend (Fable Portfolio).',
  'import { ALLOCATION_COLORS, type AllocationSlice } from "@/lib/portfolio-math";',
  'import { pct } from "@/lib/format";',
  'import { Block } from "@/components/common/Block";',
  'import { cn } from "@/lib/utils";',
  '',
  'export function AllocationBar({',
  '  slices,',
  '  nameById,',
  '}: {',
  '  slices: AllocationSlice[];',
  '  nameById: Record<string, string>;',
  '}) {',
  '  if (slices.length === 0) return null;',
  '  return (',
  '    <section className="space-y-2" data-testid="portfolio-allocation">',
  '      <h2 className="px-0.5 text-[0.9375rem] fontہ-semibold text-foreground">Allocation</h2>',
].join('\n');

writeFileSync('src/components/portfolio/AllocationBar.tsx', allocation);
console.log('partial', allocation.includes('ہ'));
