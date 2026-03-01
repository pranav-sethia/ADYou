import { ChevronLeft, ArrowRight, Zap } from "lucide-react"

export function WizardShell({ children, currentStep = 2 }: { children: React.ReactNode, currentStep?: number }) {
    const steps = [
        "Address", "Satellite Check", "Eligibility", "Financial", "Create Listing"
    ]

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans">
            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-slate-100">
                <div className="h-full bg-emerald-600 transition-all duration-500 ease-in-out" style={{ width: `${(currentStep / steps.length) * 100}%` }} />
            </div>

            {/* Step Labels */}
            <div className="border-b border-slate-100 px-8 py-4 flex flex-wrap items-center justify-center gap-4 text-sm font-medium">
                {steps.map((step, i) => (
                    <div key={step} className={`flex items-center gap-4 ${i + 1 === currentStep ? 'text-emerald-700 font-bold' : i + 1 < currentStep ? 'text-slate-400' : 'text-slate-300'}`}>
                        <span>{step}</span>
                        {i !== steps.length - 1 && <span className="text-slate-200 hidden sm:inline">•</span>}
                    </div>
                ))}
            </div>

            <div className="flex-1 flex flex-col md:flex-row">
                {/* Left Context */}
                <div className="w-full md:w-[320px] lg:w-[400px] bg-slate-50 border-r border-slate-200 p-8 flex flex-col justify-between shrink-0">
                    <div>
                        <p className="text-sm font-medium text-slate-400 mb-2 uppercase tracking-wider">Step {currentStep} of {steps.length}</p>
                        <h1 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">Project Analysis</h1>
                        <p className="text-slate-600 leading-relaxed font-medium">
                            We're analyzing high-resolution satellite imagery, local zoning codes, and market data to determine your lot's potential.
                        </p>
                    </div>
                    <div className="mt-12 bg-amber-50 rounded-xl p-5 border border-amber-100 shadow-sm">
                        <div className="flex gap-3">
                            <Zap className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            <div className="text-sm text-amber-900 leading-relaxed font-medium">
                                <span className="font-bold block mb-1">Why this matters</span>
                                Setbacks determine how close to your property line you can build. Most CA cities require a 4ft rear and side setback for ADUs.
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Content */}
                <div className="flex-1 p-8 lg:p-16 flex flex-col">
                    <div className="flex-1 w-full max-w-3xl mx-auto">
                        {children}
                    </div>

                    <div className="mt-12 pt-6 border-t border-slate-100 flex items-center justify-between w-full max-w-3xl mx-auto">
                        <button className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-800 transition-colors px-4 py-2 rounded-lg hover:bg-slate-50">
                            <ChevronLeft className="w-4 h-4" /> Back
                        </button>
                        <button className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm">
                            Continue <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
