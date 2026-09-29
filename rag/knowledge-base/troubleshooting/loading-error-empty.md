---
docId: fifi.troubleshooting.troubleshooting.loading-error-empty.v1
docType: troubleshooting
domain: troubleshooting
title: "Loading, error, and empty states"
locale: en
source: implementation audit FIFI-01
sourceTier: 1
status: ACTIVE
defaultProvenance: OBSERVED
effectiveDate: 2026-09-29
lastVerified: 2026-09-29
retrievalEligibility: eligible
answerAuthority: authoritative
---

# Loading, Error, and Empty States

## Loading / skeleton

A skeleton is the temporary placeholder shown while a screen's content is loading. Its shape follows the final content so the page does not jump when the real data arrives.

**What to do:** wait for the content to load. If loading does not finish, use retry if the screen provides it.

## Empty state

An empty state means there is currently nothing to show in that section.

For example, a new Portfolio or Earnings page can be empty before you have relevant activity. The app can use an action that takes you to Marketplace so you can explore estates.

An empty state is not automatically an error.

## Error state

An error state means the app could not complete the requested operation.

**What to do:** retry once. If the problem continues, note the exact message shown on the screen and contact the app's support channel.

## Toast messages

A toast is a small temporary message that appears over the interface, usually after an action. In the current app, actions such as exports can use a toast to report a failure instead of failing silently.

If Fifi does not have a documented meaning for a specific error message, it should ask the user to share the visible text rather than inventing a fix.
