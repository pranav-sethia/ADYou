"use client"
import { Button } from '@/components/ui/button'
import { ArrowRight, Video, FileText, Upload, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { WizardShell } from '@/components/wizard/WizardShell'
import { Header } from '@/components/layout/Header'

export default function NewListingPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Header />
            <div className="flex-1 w-full bg-white">
                <WizardShell currentStep={2}>
                    <div className="text-center mb-12 mt-8">
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
                            Create Your Listing
                        </h1>
                        <p className="text-xl text-slate-600 font-medium">
                            Choose how you'd like to build your property campaign.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* AI Path */}
                        <div className="relative group bg-white rounded-3xl p-8 border-2 border-emerald-500 shadow-xl overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                            <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl tracking-wider uppercase">
                                Recommended
                            </div>

                            <div className="w-16 h-16 bg-emerald-100 border border-emerald-200 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                                <Sparkles className="w-8 h-8" />
                            </div>

                            <h2 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">AI Campaign Builder</h2>
                            <p className="text-slate-600 mb-8 min-h-[80px] font-medium leading-relaxed">
                                Upload a quick video walkthrough from your phone. Our AI agent will extract photos, write copy, and build a full listing in 5 minutes.
                            </p>

                            <div className="space-y-4 mb-10">
                                <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                                    <Video className="w-5 h-5 text-emerald-500" /> Best for empty or staged units
                                </div>
                                <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                                    <Upload className="w-5 h-5 text-emerald-500" /> No typing required
                                </div>
                            </div>

                            <Button size="lg" className="w-full h-14 text-lg bg-emerald-600 hover:bg-emerald-700 shadow-lg font-bold" asChild>
                                <Link href="/editor/1">
                                    Upload Video <ArrowRight className="ml-2 w-5 h-5" />
                                </Link>
                            </Button>
                        </div>

                        {/* Manual Path */}
                        <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300">
                            <div className="w-16 h-16 bg-white border border-slate-200 text-slate-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                                <FileText className="w-8 h-8" />
                            </div>

                            <h2 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">Manual Entry</h2>
                            <p className="text-slate-600 mb-8 min-h-[80px] font-medium leading-relaxed">
                                Type out your description, upload individual photos, and fill out details step-by-step the traditional way.
                            </p>

                            <div className="space-y-4 mb-10">
                                <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                                    <FileText className="w-5 h-5 text-slate-400" /> Granular control from start
                                </div>
                                <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                                    <Upload className="w-5 h-5 text-slate-400" /> Takes 15–20 minutes
                                </div>
                            </div>

                            <Button size="lg" variant="outline" className="w-full h-14 text-lg border-slate-300 font-bold bg-white" asChild>
                                <Link href="/editor/4">
                                    Start Blank <ArrowRight className="ml-2 w-5 h-5 text-slate-400" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </WizardShell>
            </div>
        </div>
    )
}
