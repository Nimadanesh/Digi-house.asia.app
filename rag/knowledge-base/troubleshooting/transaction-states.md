# Transaction verification states

**Symptom:** A transaction stays pending or shows failed.

A transaction normally has one of three states:

- **Pending** — the final result is not known yet. Pending does not automatically mean something went wrong.
- **Success** — the transaction has passed the required verification.
- **Failed** — the transaction could not be completed or did not pass verification.

If your own transaction is pending, Fifi should read its current status from live account data rather than guessing why it happened.

For a payment that remains stuck, use the support path offered by the app. Some temporary verification states can remain pending until the required information becomes available.

**Next step:** Check the transaction's current status in the app. If it remains stuck, use the support option shown there.