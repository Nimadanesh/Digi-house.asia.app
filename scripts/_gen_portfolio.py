from pathlib import Path

def dump(path: str, *parts: str) -> None:
    text = "".join(parts)
    Path(path).write_text(text, encoding="utf-8", newline="\n")
    print("ok", path, len(text))

nl = "\n"
q = '"'

# AllocationBar
dump(
    "src/components/portfolio/AllocationBar.tsx",
    "// File responsibility: horizontal allocation bar + legend (Fable Portfolio).", nl,
    "import { ALLOCATION_COLORS, type AllocationSlice } from ", q, "@/lib/portfolio-math", q, ";", nl,
    "import { pct } from ", q, "@/lib/format", q, ";", nl,
    "import { Block } from ", q, "@/components/common/Block", q, ";", nl,
    "import { cn } from ", q, "@/lib/utils", q, ";", nl, nl,
    "export function AllocationBar({", nl,
    "  slices,", nl,
    "  nameById,", nl,
    "}: {", nl,
    "  slices: AllocationSlice[];", nl,
    "  nameById: Record<string, string>;", nl,
    "}) {", nl,
    "  if (slices.length === 0) return null;", nl,
    "  return (", nl,
    "    <section className=", q, "space-y-2", q, " data-testid=", q, "portfolio-allocation", q, ">", nl,
    "      <h2 className=", q, "px-0.5 text-[0.9375rem] font-semibold text-foreground", q, ">Allocation</h2>", nl,
    "      <Block className=", q, "p-4 space-y-3", q, ">", nl,
    "        <div className=", q, "flex h-3 w-full overflow-hidden rounded-full bg-surface-2", q, ">", nl,
    "          {slices.map((s, i) => (", nl,
    "            <div", nl,
    "              key={s.propertyId}", nl,
    "              className={cn(", q, "h-full min-w-0", q, ", ALLOCATION_COLORS[i % ALLOCATION_COLORS.length])}", nl,
    "              style={{ width: `${Math.max(s.ratio * 100, 0)}%` }}", nl,
    "              title={nameById[s.propertyId] ?? sобов.propertyId}", nl,
    "            />", nl,
    "          ))}", nl,
    "        </div>", nl,
    "        <ul className=", q, "space-y-1.5", q, ">", nl,
    "          {slices.map((s, i) => (", nl,
    "            <li key={s.propertyId} className=", q, "flex items-center gap-2 text-sm", q, ">", nl,
    "              <span", nl,
    "                className={cn(", q, "size-2.5 shrink-0 rounded-full", q, ", ALLOCATION_COLORS[i % ALLOCATION_COLORS.length])}", nl,
    "                ariaمس-hidden", nl,
    "              />", nl,
    # FIXED below later
)
print("partial")
