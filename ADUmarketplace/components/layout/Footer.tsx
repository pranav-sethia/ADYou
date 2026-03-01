import Link from 'next/link'

const LogoMark = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-surface-400">
        <path d="M12 3L20 10V20C20 20.5304 19.7893 21.0391 19.4142 21.4142C19.0391 21.7893 18.5304 22 18 22H6C5.46957 22 4.96086 21.7893 4.58579 21.4142C4.21071 21.0391 4 20.5304 4 20V10L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)

export function Footer() {
    return (
        <footer className="bg-surface-0 border-t border-surface-200 py-16">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-8">

                    <div className="md:col-span-1">
                        <Link href="/" className="flex items-center gap-2 mb-6">
                            <LogoMark />
                            <span className="text-xl font-extrabold text-surface-900 tracking-tight">ADU Base</span>
                        </Link>
                        <p className="text-surface-500 text-sm leading-relaxed max-w-xs">
                            The first dedicated marketplace for renting, building, and managing Accessory Dwelling Units. Built for homeowners and smart renters.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold text-surface-900 mb-6 uppercase text-xs tracking-widest">Platform</h4>
                        <ul className="space-y-4">
                            <li><Link href="/marketplace" className="text-sm text-surface-600 hover:text-brand-600 font-medium transition-colors">Browse ADUs</Link></li>
                            <li><Link href="/feasibility" className="text-sm text-surface-600 hover:text-brand-600 font-medium transition-colors">Lot Feasibility</Link></li>
                            <li><Link href="/onboarding" className="text-sm text-surface-600 hover:text-brand-600 font-medium transition-colors">List Your property</Link></li>
                            <li><Link href="#" className="text-sm text-surface-600 hover:text-brand-600 font-medium transition-colors">Pricing</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-surface-900 mb-6 uppercase text-xs tracking-widest">Resources</h4>
                        <ul className="space-y-4">
                            <li><Link href="#" className="text-sm text-surface-600 hover:text-brand-600 font-medium transition-colors">Permit Guide</Link></li>
                            <li><Link href="#" className="text-sm text-surface-600 hover:text-brand-600 font-medium transition-colors">Cost Calculator</Link></li>
                            <li><Link href="#" className="text-sm text-surface-600 hover:text-brand-600 font-medium transition-colors">Tenant Screening</Link></li>
                            <li><Link href="#" className="text-sm text-surface-600 hover:text-brand-600 font-medium transition-colors">Case Studies</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-surface-900 mb-6 uppercase text-xs tracking-widest">Company</h4>
                        <ul className="space-y-4">
                            <li><Link href="#" className="text-sm text-surface-600 hover:text-brand-600 font-medium transition-colors">About</Link></li>
                            <li><Link href="#" className="text-sm text-surface-600 hover:text-brand-600 font-medium transition-colors">Blog</Link></li>
                            <li><Link href="#" className="text-sm text-surface-600 hover:text-brand-600 font-medium transition-colors">Careers</Link></li>
                            <li><Link href="#" className="text-sm text-surface-600 hover:text-brand-600 font-medium transition-colors">Contact</Link></li>
                        </ul>
                    </div>

                </div>

                <div className="mt-16 pt-8 border-t border-surface-200 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-surface-400 text-sm">
                        © {new Date().getFullYear()} ADU Base Inc. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6">
                        <Link href="#" className="text-surface-400 hover:text-surface-900 transition-colors">
                            <span className="sr-only">Twitter</span>
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                            </svg>
                        </Link>
                        <Link href="#" className="text-surface-400 hover:text-surface-900 transition-colors">
                            <span className="sr-only">GitHub</span>
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
