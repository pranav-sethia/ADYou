import { ArrowRight, Search, Zap, CheckCircle2, Building2 } from "lucide-react"
import Link from "next/link"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { HeroListingStack } from "@/components/HeroListingStack"

export default function LandingPage() {
    return (
        <div className="min-h-screen flex flex-col bg-white font-sans">
            <Header />

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative pt-32 pb-24 overflow-hidden border-b border-slate-100">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,white_0%,#f8fafc_100%)]" />
                    <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

                    <div className="relative max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
                        <div className="max-w-2xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium mb-8">
                                <Zap className="w-4 h-4" />
                                <span>California's First Dedicated ADU Platform</span>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-6">
                                Your Backyard.<br />
                                Your Income.<br />
                                <span className="text-emerald-600">Your ADU.</span>
                            </h1>
                            <p className="text-lg text-slate-600 mb-8 max-w-[480px]">
                                Find out if your property qualifies, get a full financial breakdown, and list your ADU — all in one place.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                                <Link href="/marketplace" className="group bg-emerald-600 text-white px-8 py-4 rounded-xl text-lg font-medium hover:bg-emerald-700 transition-all hover:scale-[1.02] shadow-sm flex items-center gap-2">
                                    Explore Marketplace
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <Link href="/map" className="group bg-white border border-slate-200 text-slate-700 px-8 py-4 rounded-xl text-lg font-medium hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2">
                                    Check My Lot
                                </Link>
                            </div>

                            <div className="mt-12 flex items-center gap-4 text-sm text-slate-500">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center font-bold text-[10px] text-slate-500">
                                            {i}
                                        </div>
                                    ))}
                                </div>
                                <span>Trusted by 1,200+ California homeowners</span>
                            </div>
                        </div>

                        {/* Hero Cards Stacks */}
                        <div className="flex justify-end pr-8">
                            <HeroListingStack />
                        </div>
                    </div>
                </section>

                {/* The Gap */}
                <section className="bg-slate-900 py-24 text-white">
                    <div className="max-w-7xl mx-auto px-6">
                        <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
                            Zillow has 2.4 million listings.<br />
                            <span className="text-emerald-400">Zero ADU-specific filters.</span>
                        </h2>
                        <div className="grid md:grid-cols-3 gap-6">
                            {[
                                { title: 'No ADU Type Filter', desc: "Can't tell a detached ADU from a garage conversion." },
                                { title: 'No Permit Status', desc: "No way to know if it's legally built and up to code." },
                                { title: 'No ADU-Only Search', desc: "ADUs are buried under 2M unrelated rental listings." }
                            ].map((feature, i) => (
                                <div key={i} className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center mb-4 text-red-400">✕</div>
                                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                                    <p className="text-slate-400">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Value Props */}
                <section className="py-24 px-6 bg-slate-50">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16 max-w-2xl mx-auto">
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Built specifically for backyards</h2>
                            <p className="text-lg text-slate-600 leading-relaxed">
                                Standard real estate platforms don't understand ADUs. We highlight the details that actually matter for accessory dwellings.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm transition-shadow hover:shadow-md">
                                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 border border-emerald-100">
                                    <Search className="w-7 h-7 text-emerald-600" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-slate-900">ADU Marketplace</h3>
                                <p className="text-slate-600 leading-relaxed">
                                    Filter by ADU type, permit status, private entrance, and more. Find exactly what you're looking for.
                                </p>
                            </div>

                            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm transition-shadow hover:shadow-md">
                                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 border border-emerald-100">
                                    <Zap className="w-7 h-7 text-emerald-600" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-slate-900">AI Campaign Builder</h3>
                                <p className="text-slate-600 leading-relaxed">
                                    Upload a walkthrough video. Get a professional listing in 5 minutes. AI writes the copy, selects the best frames, builds the campaign.
                                </p>
                            </div>

                            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm transition-shadow hover:shadow-md">
                                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 border border-emerald-100">
                                    <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-slate-900">Feasibility Engine</h3>
                                <p className="text-slate-600 leading-relaxed">
                                    Type in any address. Find out in 60 seconds if an ADU fits, how big it can be, and what it will rent for.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

            </main>
            <Footer />
        </div>
    )
}
