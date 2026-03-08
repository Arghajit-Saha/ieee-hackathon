import Link from 'next/link';
import { Stethoscope, MapTrifold, ShieldCheck, ArrowRight, Heartbeat, WifiHigh, Lightning, ArrowUpRight, VideoCamera, SignIn } from '@phosphor-icons/react/dist/ssr';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#fafafa] pt-16">

      { }
      <section className="border-b-2 border-black">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[85vh]">

          { }
          <div className="lg:col-span-8 flex flex-col justify-center px-8 md:px-16 lg:px-20 py-20">
            <p className="font-mono-ui text-[10px] tracking-wider uppercase text-zinc-400 mb-8">
              Aura • Intelligent Rural Healthcare
            </p>

            <h1 className="font-display text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter leading-[0.95] mb-6">
              Precision care,<br />
              reachable <span className="font-serif-accent italic font-normal text-zinc-400">anywhere</span>
            </h1>

            <p className="text-lg text-zinc-500 leading-relaxed mb-12 max-w-xl">
              Advanced clinical triage synchronized across low-bandwidth environments.
              Empowering healthcare workers with immediate diagnostic intelligence.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/triage"
                className="inline-flex items-center gap-2.5 bg-black text-white px-7 py-4 text-sm font-bold border-2 border-black brutal-shadow brutal-shadow-hover tracking-wide"
              >
                Start Triage
                <ArrowRight size={16} weight="bold" />
              </Link>
              <Link
                href="/locator"
                className="inline-flex items-center gap-2.5 bg-white text-black px-7 py-4 text-sm font-bold border-2 border-black brutal-shadow brutal-shadow-hover tracking-wide"
              >
                Find Clinics
                <MapTrifold size={16} weight="bold" />
              </Link>
              <Link
                href="/patient/consult"
                className="inline-flex items-center gap-2.5 bg-white text-black px-7 py-4 text-sm font-bold border-2 border-black brutal-shadow brutal-shadow-hover tracking-wide"
              >
                Consult Doctor
                <VideoCamera size={16} weight="bold" />
              </Link>
            </div>

            <div className="mt-6">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-black transition-colors font-medium"
              >
                <SignIn size={16} weight="bold" />
                Sign in to access your account
              </Link>
            </div>
          </div>

          { }
          <div className="lg:col-span-4 border-t-2 lg:border-t-0 lg:border-l-2 border-black bg-white flex flex-col">

            { }
            <div className="flex-1 p-8 lg:p-10 border-b-2 border-black flex flex-col justify-center">
              <div className="flex items-center gap-2.5 mb-4">
                <WifiHigh size={18} weight="bold" className="text-green-600" />
                <span className="font-mono-ui text-[10px] tracking-wider uppercase text-zinc-400">System Status</span>
              </div>
              <h3 className="font-display text-xl font-bold mb-2">Sync Protocol</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">Bidirectional offline synchronization. Seamlessly resilient to network drops.</p>
            </div>

            { }
            <div className="flex-1 p-8 lg:p-10 border-b-2 border-black flex flex-col justify-center">
              <div className="flex items-center gap-2.5 mb-4">
                <Heartbeat size={18} weight="bold" className="text-red-500" />
                <span className="font-mono-ui text-[10px] tracking-wider uppercase text-zinc-400">RAG Model</span>
              </div>
              <h3 className="font-display text-xl font-bold mb-2">1,100+ Profiles</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">Comprehensive medical dataset indexed via our high-dimensional RAG engine.</p>
            </div>

            { }
            <div className="flex-1 p-8 lg:p-10 flex flex-col justify-center">
              <div className="flex items-center gap-2.5 mb-4">
                <Lightning size={18} weight="bold" className="text-amber-500" />
                <span className="font-mono-ui text-[10px] tracking-wider uppercase text-zinc-400">Quick Access</span>
              </div>
              <h3 className="font-display text-xl font-bold mb-2">Doctor Portal</h3>
              <p className="text-sm text-zinc-500 leading-relaxed mb-4">Real-time alerts, teleconsultation, and infectious disease mapping.</p>
              <Link href="/dashboard/doctor" className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wider hover:underline underline-offset-4">
                OPEN PORTAL <ArrowUpRight size={12} weight="bold" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      { }
      <section className="bg-white">
        <div className="grid grid-cols-1 md:grid-cols-3">

          { }
          <Link href="/triage" className="group p-10 md:p-12 border-b-2 md:border-b-0 md:border-r-2 border-black hover:bg-zinc-50 transition-colors">
            <Stethoscope size={32} weight="bold" className="mb-8 text-zinc-300 group-hover:text-black transition-colors" />
            <p className="font-mono-ui text-[9px] tracking-wider uppercase text-zinc-400 mb-3">Module 01</p>
            <h3 className="font-display text-2xl font-bold mb-3">Diagnostic Triage</h3>
            <p className="text-sm text-zinc-500 leading-relaxed mb-8">
              Analyze symptoms against a massive medical knowledge base with Aura&apos;s adaptive analysis.
            </p>
            <span className="flex items-center gap-2 font-mono-ui text-[10px] uppercase tracking-wider text-zinc-400 group-hover:text-black transition-colors">
              Open <ArrowRight size={10} weight="bold" />
            </span>
          </Link>

          { }
          <Link href="/locator" className="group p-10 md:p-12 border-b-2 md:border-b-0 md:border-r-2 border-black hover:bg-zinc-50 transition-colors">
            <MapTrifold size={32} weight="bold" className="mb-8 text-zinc-300 group-hover:text-black transition-colors" />
            <p className="font-mono-ui text-[9px] tracking-wider uppercase text-zinc-400 mb-3">Module 02</p>
            <h3 className="font-display text-2xl font-bold mb-3">Clinic Finder</h3>
            <p className="text-sm text-zinc-500 leading-relaxed mb-8">
              Locate nearby hospitals and clinics with live driving routes on OpenStreetMap.
            </p>
            <span className="flex items-center gap-2 font-mono-ui text-[10px] uppercase tracking-wider text-zinc-400 group-hover:text-black transition-colors">
              Open <ArrowRight size={10} weight="bold" />
            </span>
          </Link>

          { }
          <Link href="/patient/consult" className="group p-10 md:p-12 hover:bg-zinc-50 transition-colors">
            <VideoCamera size={32} weight="bold" className="mb-8 text-zinc-300 group-hover:text-black transition-colors" />
            <p className="font-mono-ui text-[9px] tracking-wider uppercase text-zinc-400 mb-3">Module 03</p>
            <h3 className="font-display text-2xl font-bold mb-3">Video Consultation</h3>
            <p className="text-sm text-zinc-500 leading-relaxed mb-8">
              Connect face-to-face with a verified doctor through live video, audio, and text chat.
            </p>
            <span className="flex items-center gap-2 font-mono-ui text-[10px] uppercase tracking-wider text-zinc-400 group-hover:text-black transition-colors">
              Open <ArrowRight size={10} weight="bold" />
            </span>
          </Link>
        </div>
      </section>

      { }
      <footer className="border-t-2 border-black px-8 md:px-16 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="font-mono-ui text-[10px] text-zinc-400 tracking-wider">AURA • INTELLIGENT HEALTHCARE © 2026</p>
        <p className="font-mono-ui text-[10px] text-zinc-400 tracking-wider">DEVELOPED FOR IEEE • RESIDENCY-FIRST ARCHITECTURE</p>
      </footer>
    </div>
  );
}
