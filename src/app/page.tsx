import Recommender from "@/components/Recommender";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Family Time</h1>
      <p className="mt-2 mb-8 text-zinc-600 dark:text-zinc-400">
        Tell us about your family and we&apos;ll suggest how and where to spend time together.
      </p>
      <Recommender />
    </main>
  );
}
