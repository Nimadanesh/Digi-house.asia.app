// File responsibility: rental payment history rows (Fable §Rental history).
// Paid pills only — demo disclaimer once at section foot (sparing “simulated” rule).
import type { Listing } from "@/types/property";
import { DEMO_TX_DISCLAIMER } from "@/lib/constants";
import { Block } from "@/components/common/Block";
import { Row } from "@/components/common/Row";
import { StatusPill } from "@/components/common/StatusPill";

function formatPaidDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function RentalHistory({ listing }: { listing: Listing }) {
  const rows = listing.rentalHistory.slice(0, 4);
  if (rows.length === 0) {
    return (
      <Block className="p-4" data-testid="rental-history">
        <h2 className="text-[0.9375rem] font-semibold text-foreground mb-1">Rental payments</h2>
        <p className="text-sm text-muted-foreground">No payment history yet.</p>
      </Block>
    );
  }
  return (
    <div className="space-y-2" data-testid="rental-history">
      <h2 className="px-1 text-[0.8125rem] font-medium text-muted-foreground">Rental payments</h2>
      <Block>
        {rows.map((row) => (
          <Row key={row.id}>
            <span className="text-sm text-foreground tnum">{formatPaidDate(row.paidAt)}</span>
            <span className="ml-auto">
              <StatusPill label="Paid ✓" variant="success" />
            </span>
          </Row>
        ))}
      </Block>
      <p
        className="mt-0.5 px-1 pb-0.5 text-[0.6875rem] leading-relaxed text-muted-foreground"
        data-testid="rental-history-disclaimer"
      >
        {DEMO_TX_DISCLAIMER}
      </p>
    </div>
  );
}
