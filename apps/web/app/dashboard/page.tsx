function EmptyCodebaseIllustration() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 top-1/2 h-[430px] w-[680px] -translate-x-1/2 -translate-y-1/2 opacity-35"
    >
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.18),rgba(8,15,23,0)_66%)] blur-2xl" />

      <div className="absolute left-[72px] top-[146px] h-px w-72 -rotate-[32deg] bg-cyan-300/15 shadow-[0_18px_0_rgba(103,232,249,0.10),0_36px_0_rgba(103,232,249,0.08)]" />
      <div className="absolute left-[150px] top-[282px] h-px w-80 -rotate-[28deg] bg-cyan-300/15 shadow-[0_-18px_0_rgba(103,232,249,0.10),0_18px_0_rgba(103,232,249,0.08)]" />

      <div className="absolute left-[250px] top-[96px] h-64 w-64 rotate-[30deg] rounded-2xl border border-cyan-200/10 bg-slate-800/35 shadow-[0_0_42px_rgba(56,189,248,0.12)]" />
      <div className="absolute left-[281px] top-[130px] h-48 w-48 rotate-[30deg] rounded-xl border border-slate-500/15 bg-slate-900/45" />
      <div className="absolute left-[324px] top-[184px] rotate-[30deg] text-2xl font-black tracking-widest text-slate-300/20">
        CODEBASE
      </div>

      <div className="absolute left-[442px] top-[210px] h-[156px] w-32 -skew-y-[18deg] rounded-[28px] border border-slate-500/10 bg-slate-300/12" />
      <div className="absolute left-[494px] top-[226px] h-[204px] w-32 -skew-y-[18deg] rounded-[30px] border border-slate-500/10 bg-slate-300/16" />
      <div className="absolute left-[535px] top-[248px] h-[210px] w-36 -skew-y-[18deg] rounded-[34px] border border-slate-400/10 bg-slate-200/18" />
      <div className="absolute left-[568px] top-[312px] h-2 w-20 -skew-y-[18deg] rounded-full bg-slate-700/25 shadow-[0_20px_0_rgba(51,65,85,0.18),0_40px_0_rgba(51,65,85,0.14)]" />

      <div className="absolute left-[468px] top-[72px] h-28 w-36 rotate-[31deg] rounded-xl border border-slate-500/15 bg-slate-950/55" />
      <div className="absolute left-[506px] top-[104px] h-1.5 w-16 rotate-[31deg] rounded-full bg-slate-500/25 shadow-[0_18px_0_rgba(100,116,139,0.18),0_36px_0_rgba(100,116,139,0.14)]" />

      <div className="absolute left-[126px] top-[286px] h-0 w-0 border-b-[58px] border-l-[34px] border-r-[34px] border-b-indigo-400/12 border-l-transparent border-r-transparent" />
      <div className="absolute bottom-[72px] left-[205px] h-12 w-16 rotate-[28deg] rounded-xl border border-cyan-200/10 bg-slate-700/20" />
      <div className="absolute bottom-[115px] right-[68px] h-7 w-7 rotate-45 rounded-md border border-cyan-200/10 bg-slate-600/15" />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#080f17] text-slate-100">
      <header className="flex h-[62px] items-center border-b border-slate-500/35 px-12">
        <h1 className="text-2xl font-bold tracking-[-0.03em] text-[#dddfff]">
          Codebase Wiki
        </h1>
      </header>

      <section className="relative isolate flex min-h-[calc(100vh-62px)] items-center justify-center px-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.46),rgba(8,15,23,0.86)_52%,#080f17_78%)]" />
        <EmptyCodebaseIllustration />

        <div className="relative z-10 flex -translate-y-7 flex-col items-center text-center">
          <p className="mb-7 text-[36px] font-bold leading-none tracking-[-0.045em] text-slate-200 drop-shadow-[0_2px_12px_rgba(2,6,23,0.7)]">
            Not Project Found
          </p>
          <button className="rounded-lg bg-gradient-to-r from-[#7b82ff] to-[#6618d8] px-10 py-[14px] text-base font-bold text-white shadow-[0_18px_34px_rgba(93,33,216,0.32)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_40px_rgba(93,33,216,0.42)] focus:outline-none focus:ring-2 focus:ring-violet-300 focus:ring-offset-2 focus:ring-offset-[#080f17]">
            Upload Project
          </button>
        </div>
      </section>
    </main>
  );
}
