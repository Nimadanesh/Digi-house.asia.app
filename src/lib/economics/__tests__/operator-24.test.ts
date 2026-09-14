// Tests for the D1 locked operator layer: verbatim parity with the
// source-of-truth JSON, complete 1–24 assignment coverage, local photo assets
// on disk, runtime-id lookups, and zero CDN URLs.
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  RENTAL_ESCAPES_OPERATOR,
  RENTAL_ESCAPES_SPECIALISTS,
  getOperatorAssignmentByEstate24Id,
  getOperatorAssignmentByPropertyId,
} from "@/lib/economics/estates/operator-24";

const JSON_PATH = "d1-rental-escapes-specialists.json";

describe("operator-24 — D1 locked data", () => {
  it("mirrors the source-of-truth JSON verbatim (12 specialists; only the documented em-dash repair applied)", () => {
    const raw = JSON.parse(readFileSync(JSON_PATH, "utf-8")) as {
      specialists: {
        id: string;
        fullName: string;
        title: string;
        photoUrl: string;
        bio: string;
        assignTo: string;
      }[];
    };
    expect(raw.specialists).toHaveLength(12);
    expect(RENTAL_ESCAPES_SPECIALISTS).toHaveLength(12);
    for (const [i, source] of raw.specialists.entries()) {
      const mirror = RENTAL_ESCAPES_SPECIALISTS[i];
      // The JSON carries two cp1256 mojibake sequences (U+00E2 U+20AC U+201D,
      // the double-encoded em dash "â€"") where the official bio has "—".
      // Repair replaces exactly those three chars — whitespace is preserved.
      const repaired = source.bio
        .split("\u00e2\u20ac\u201d")
        .join("\u2014");
      expect(mirror.id, source.id).toBe(source.id);
      expect(mirror.fullName, source.id).toBe(source.fullName);
      expect(mirror.title, source.id).toBe(source.title);
      expect(mirror.photoUrl, source.id).toBe(source.photoUrl);
      expect(mirror.bio, source.id).toBe(repaired);
      expect(mirror.assignTo, source.id).toBe(source.assignTo);
    }
  });

  it("assigns every villa 1–24 exactly once (12 specialists × 2 villas)", () => {
    const seen: number[] = [];
    for (let estateId = 1; estateId <= 24; estateId += 1) {
      const assignment = getOperatorAssignmentByEstate24Id(estateId);
      expect(assignment, `villa ${estateId}`).not.toBeNull();
      seen.push(estateId);
      expect(assignment!.specialist.assignTo).toMatch(new RegExp(`villas \\d+-\\d+`));
    }
    expect(seen).toHaveLength(24);
  });

  it("every photoUrl is a local path that exists on disk (no CDN URLs)", () => {
    for (const specialist of RENTAL_ESCAPES_SPECIALISTS) {
      expect(specialist.photoUrl).toMatch(/^\/operators\/specialists\/D1-\d{2}-[a-z-]+\.jpg$/);
      expect(specialist.photoUrl.startsWith("http"), specialist.id).toBe(false);
      const file = join(process.cwd(), "public", specialist.photoUrl);
      expect(existsSync(file), specialist.photoUrl).toBe(true);
    }
  });

  it("bio text carries no encoding mojibake", () => {
    for (const specialist of RENTAL_ESCAPES_SPECIALISTS) {
      expect(specialist.bio.includes("â€"), specialist.id).toBe(false);
    }
  });

  it("resolves assignments through the runtime propertyId join", () => {
    // Villa 1 (JOALI Being) → D1-01; villa 24 (Grace Bay) → D1-12.
    const first = getOperatorAssignmentByPropertyId("re-128862");
    expect(first?.specialist.id).toBe("D1-01");
    const last = getOperatorAssignmentByPropertyId("re-122113");
    expect(last?.specialist.id).toBe("D1-12");
    expect(getOperatorAssignmentByPropertyId("test-unknown")).toBeNull();
  });

  it("carries the locked company facts and UI summary line", () => {
    expect(RENTAL_ESCAPES_OPERATOR.name).toBe("Rental Escapes");
    expect(RENTAL_ESCAPES_OPERATOR.leadership).toHaveLength(2);
    expect(RENTAL_ESCAPES_OPERATOR.summaryLine).toMatch(/Rental Escapes/);
    expect(RENTAL_ESCAPES_OPERATOR.summaryLine).toMatch(/24\/7 concierge/);
  });
});
