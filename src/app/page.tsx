export default function Home() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-2xl font-bold tracking-tight">DigiHouse</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Fractional property on TON. The app shell is not built yet — see{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">docs/research/</code>{" "}
        for the specification.
      </p>
    </main>
  );
}