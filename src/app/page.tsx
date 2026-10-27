import Recommender from "@/components/Recommender";

export default function Home() {
  return (
    <main className="flex-1 px-6 pt-20 pb-12">
      <header className="mx-auto mb-12 w-[60%] min-w-[16rem] text-center">
        <h1 className="bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 bg-clip-text px-4 py-6 font-display text-[clamp(3.5rem,12vw,11rem)] leading-[1.3] font-normal tracking-normal text-transparent drop-shadow-sm">
          Family Time
        </h1>
        <div className="mx-auto mt-4 h-1 w-full rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600" />
        <p className="mt-4 text-lg font-medium text-zinc-700 dark:text-zinc-300">
          Tell us about your family and we&apos;ll suggest how and where to spend time together.
        </p>
      </header>
      <div className="mx-auto w-full max-w-[96rem]">
        <Recommender />
      </div>
    </main>
  );
}
