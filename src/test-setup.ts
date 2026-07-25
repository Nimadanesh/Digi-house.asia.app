// File responsibility: vitest global setup — registers @testing-library/jest-dom DOM matchers
// (toBeInTheDocument, toHaveAttribute, toHaveClass, toHaveStyle, etc.) for every test file.
// Run once per test file via vitest `setupFiles`. No test logic lives here.
import "@testing-library/jest-dom/vitest";