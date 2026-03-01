"use client"

import { EligibilityBadge } from './EligibilityBadge'
import { formatCurrency, formatSqft } from '@/lib/utils/formatting'
import { ChevronDown, ArrowRight, Layers, Ruler, Map, Calendar, DollarSign, ExternalLink, CheckCircle2, FileText, Home, TrendingUp, DollarSignIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import Link from 'next/link'

interface FeasibilityReportProps {
    report: any // Type this properly if time permits
}

export function FeasibilityReport({ report }: FeasibilityReportProps) {
    const [expandedSection, setExpandedSection] = useState<string | null>('zoning')

    const toggleSection = (id: string) => {
        setExpandedSection(current => current === id ? null : id)
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">

            {/* Top Banner */}
            <div className="bg-surface-0 rounded-2xl p-6 md:p-10 border border-surface-200 flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left shadow-sm relative overflow-hidden">
                {/* Subtle background decoration */}
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-brand-50 rounded-full blur-[80px] pointer-events-none" />

                <div className="flex-1 z-10">
                    <EligibilityBadge tier={report.confidenceTier} />
                    <h2 className="text-3xl font-extrabold mt-6 mb-2 text-surface-900 tracking-tight">Great news! Your lot qualifies.</h2>
                    <p className="text-surface-600 text-lg leading-relaxed max-w-xl">
                        Based on the data for <strong className="text-surface-900">{report.address}</strong>, you can build up to {formatSqft(report.maxAllowedSqft)} of additional living space.
                    </p>
                </div>

                <div className="w-full md:w-auto flex flex-col gap-3 shrink-0 z-10">
                    <Button size="lg" className="w-full bg-brand-600 hover:bg-brand-700 font-bold h-14 rounded-xl shadow-[0_4px_14px_0_rgba(34,197,94,0.39)] hover:shadow-[0_6px_20px_rgba(34,197,94,0.23)] hover:-translate-y-0.5 transition-all">
                        Get Building Permits
                    </Button>
                    <Button variant="outline" size="lg" className="w-full border-surface-300 text-surface-700 font-semibold h-14 rounded-xl bg-surface-0 group">
                        Speak with an Expert <ArrowRight className="w-4 h-4 ml-2 text-surface-400 group-hover:text-surface-900 transition-colors" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Left Column: Data points */}
                <div className="md:col-span-2 space-y-4">

                    {/* Zoning Section */}
                    <div className="bg-surface-0 rounded-2xl border border-surface-200 overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-300 hover:border-brand-200 hover:shadow-md">
                        <button
                            className="w-full px-6 py-5 flex items-center justify-between bg-surface-0 focus:outline-none"
                            onClick={() => toggleSection('zoning')}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center border border-brand-100">
                                    <Map className="w-5 h-5 text-brand-600" />
                                </div>
                                <h3 className="text-lg font-bold text-surface-900">Zoning & Lot Rules</h3>
                            </div>
                            <ChevronDown className={`w-5 h-5 text-surface-400 transition-transform duration-300 ${expandedSection === 'zoning' ? 'rotate-180' : ''}`} />
                        </button>

                        {expandedSection === 'zoning' && (
                            <div className="px-6 pb-6 pt-2 border-t border-surface-100 bg-surface-50">
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <MetricCell icon={Layers} label="Max Allowed ADU" value={formatSqft(report.maxAllowedSqft)} />
                                    <MetricCell icon={Ruler} label="Setbacks Required" value={report.setbacks} />
                                    <MetricCell icon={CheckCircle2} label="Garage Conversion" value={report.garageConversionPossible ? 'Possible' : 'Not advised'} valueClass={report.garageConversionPossible ? 'text-emerald-700 font-bold' : ''} />
                                    <MetricCell icon={Calendar} label="Est. Permit Time" value={`${report.estimatedPermitTimelineDays} days`} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Costs Section */}
                    <div className="bg-surface-0 rounded-2xl border border-surface-200 overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-300 hover:border-brand-200 hover:shadow-md">
                        <button
                            className="w-full px-6 py-5 flex items-center justify-between bg-surface-0 focus:outline-none"
                            onClick={() => toggleSection('costs')}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-surface-100 flex items-center justify-center border border-surface-200">
                                    <DollarSign className="w-5 h-5 text-surface-700" />
                                </div>
                                <h3 className="text-lg font-bold text-surface-900">Estimated Construction Costs</h3>
                            </div>
                            <ChevronDown className={`w-5 h-5 text-surface-400 transition-transform duration-300 ${expandedSection === 'costs' ? 'rotate-180' : ''}`} />
                        </button>

                        {expandedSection === 'costs' && (
                            <div className="px-6 pb-6 pt-4 border-t border-surface-100">
                                <div className="space-y-4">
                                    <CostRow label="Design & Engineering" amount={report.estimatedCosts.designPermits} />
                                    <CostRow label="City Permit Fees" amount={report.estimatedCosts.cityFees} />
                                    <CostRow label="Construction & Labor" amount={report.estimatedCosts.construction} />
                                    <div className="pt-4 mt-4 border-t border-surface-200 flex justify-between items-center font-extrabold text-xl">
                                        <span className="text-surface-900">Total Estimated Cost</span>
                                        <span className="text-brand-700">{formatCurrency(report.estimatedCosts.total)}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                </div>

                {/* Right Column: ROI Highlight */}
                <div>
                    {/* Main ROI Card */}
                    <div className="bg-brand-50 rounded-2xl border-l-4 border-brand-500 p-6 shadow-sm border-r border-y border-brand-100/50 relative overflow-hidden group">
                        {/* Subtle background icon */}
                        <TrendingUp className="absolute -bottom-6 -right-6 w-32 h-32 text-brand-500/10 pointer-events-none group-hover:scale-110 transition-transform duration-700" />

                        <h3 className="text-brand-800 font-extrabold text-xl mb-4 tracking-tight relative z-10">Rental Potential</h3>
                        <div className="mb-6 relative z-10">
                            <span className="block text-4xl font-black text-brand-600 tracking-tighter mb-1">
                                {formatCurrency(report.estimatedRentalIncome)}<span className="text-xl text-brand-700/60 font-medium tracking-normal">/mo</span>
                            </span>
                            <p className="text-brand-700/80 text-sm font-medium">Estimated gross monthly income</p>
                        </div>

                        <div className="space-y-3 relative z-10">
                            <div className="flex justify-between text-sm py-2 border-b border-brand-200/50">
                                <span className="text-brand-700/80 font-medium">Annual Gross</span>
                                <span className="font-bold text-brand-900">{formatCurrency(report.estimatedRentalIncome * 12)}</span>
                            </div>
                            <div className="flex justify-between text-sm py-2">
                                <span className="text-brand-700/80 font-medium">Est. ROI (Yield)</span>
                                <span className="font-bold text-emerald-600 bg-white/80 px-2 py-0.5 rounded shadow-sm">
                                    {((report.estimatedRentalIncome * 12) / report.estimatedCosts.total * 100).toFixed(1)}%
                                </span>
                            </div>
                        </div>

                        <Button className="w-full mt-8 bg-brand-600 hover:bg-brand-700 text-white font-bold h-12 shadow-[0_2px_8px_rgba(34,197,94,0.25)] relative z-10">
                            View Rental Comps
                        </Button>
                    </div>
                </div>

            </div>
        </div>
    )
}

function MetricCell({ icon: Icon, label, value, valueClass = "text-surface-900 font-semibold" }: any) {
    return (
        <div className="bg-surface-0 p-4 rounded-xl border border-surface-200">
            <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-surface-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-surface-500">{label}</span>
            </div>
            <div className={`text-lg ${valueClass}`}>{value}</div>
        </div>
    )
}

function CostRow({ label, amount, isTotal = false }: { label: string, amount: number, isTotal?: boolean }) {
    return (
        <div className={`flex justify-between items-center ${isTotal ? 'font-bold text-lg pt-4 border-t' : 'text-surface-600'}`}>
            <span>{label}</span>
            <span className={isTotal ? 'text-brand-600' : 'text-surface-900 font-medium'}>{formatCurrency(amount)}</span>
        </div>
    )
}
