// app/page.tsx — Server Component
// - titolo
// - il form (componente client a parte)

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold">
        Recipe Finder
      </h1>
      <p className="text-zinc-600 mt-2">
        Tell me what's in your fridge and I'll suggest a recipe.
      </p>
    </main>
  );
}
