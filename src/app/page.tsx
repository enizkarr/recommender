import Recommender from "@/components/Recommender";

export default function Home() {
  return (
    <main className="flex-1 px-6 pt-20 pb-12">
      <header className="mx-auto mb-12 w-[60%] min-w-[16rem] text-center">
        <h1 className="bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 bg-clip-text px-4 py-6 font-display text-[clamp(3.5rem,12vw,11rem)] leading-[1.3] font-normal tracking-normal text-transparent drop-shadow-sm">
          Family Time
        </h1>
        <div className="mx-auto mt-4 h-1 w-full rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600" />
        {/* Frosted pill so the sentence stays readable over the background photo */}
        <p className="mt-6 inline-block rounded-3xl bg-white/75 px-6 py-2 text-xl font-semibold tracking-tight text-balance text-zinc-800 shadow-lg backdrop-blur-md md:text-2xl dark:bg-zinc-900/75 dark:text-zinc-100">
          Otkrij sa svojom porodicom mjesta{" "}
          <span className="bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 bg-clip-text text-transparent">
            na kojima još niste bili
          </span>
          .
        </p>
      </header>
      <div className="mx-auto w-full max-w-[110rem]">
        <Recommender />
      </div>
    </main>
  );
}
