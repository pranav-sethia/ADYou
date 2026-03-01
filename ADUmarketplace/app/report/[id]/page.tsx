"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, Printer, Sparkles, Loader2 } from "lucide-react";
import { Header } from "@/components/layout/Header";

export default function ReportPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [report, setReport] = useState<string | null>(null);
    const [title, setTitle] = useState("ADU Feasibility Report");
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        const stored = sessionStorage.getItem(`report-${params.id}`);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setReport(parsed.report);
                if (parsed.address) setTitle(parsed.address);
            } catch {
                setReport(stored);
            }
        }
    }, [params.id]);

    const handleGenerateListing = async () => {
        if (!report) return;
        setIsGenerating(true);
        try {
            const res = await fetch("http://127.0.0.1:8000/parse-report-to-listing", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ report_markdown: report }),
            });

            if (!res.ok) throw new Error("Failed to parse report");

            const listingData = await res.json();
            sessionStorage.setItem("draft-listing-data", JSON.stringify(listingData));
            router.push("/dashboard/listings/new");
        } catch (error) {
            console.error(error);
            alert("Oops! Something went wrong extracting information for the listing. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    if (!report) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <Header />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto">
                            <FileText className="w-8 h-8 text-blue-400" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">Report not found</h2>
                        <p className="text-slate-500 max-w-sm">
                            This report may have expired from your session. Generate a new one from the ADU Advisor.
                        </p>
                        <button
                            onClick={() => router.push("/dashboard/listings")}
                            className="mt-4 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
                        >
                            Back to My Projects
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Header />
            {/* Report Toolbar */}
            <div className="sticky top-16 z-40 bg-white border-b border-slate-200 shadow-sm">
                <div className="container mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
                    <button
                        onClick={() => router.push("/dashboard/listings")}
                        className="flex items-center gap-2 text-slate-500 font-bold text-sm hover:text-slate-900 transition-colors cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        My Projects
                    </button>
                    <div className="flex items-center gap-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-[0_1px_2px_rgba(0,0,0,0.05)] bg-blue-100 text-blue-800 border-blue-200">
                            Report
                        </span>
                        <span className="font-semibold text-slate-900 text-sm hidden sm:inline">{title}</span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleGenerateListing}
                            disabled={isGenerating}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 border border-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-75"
                        >
                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            {isGenerating ? "Extracting..." : "Generate Listing"}
                        </button>
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                            <Printer className="w-4 h-4" />
                            <span className="hidden sm:inline">Print</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Report Content */}
            <main className="flex-1 py-8 px-4">
                <div className="container mx-auto max-w-3xl">
                    <article className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-12 prose prose-slate max-w-none
                        prose-headings:text-slate-900 prose-headings:tracking-tight
                        prose-h1:text-3xl prose-h1:font-extrabold prose-h1:mb-6 prose-h1:pb-4 prose-h1:border-b prose-h1:border-slate-200
                        prose-h2:text-xl prose-h2:font-bold prose-h2:mt-8 prose-h2:mb-4
                        prose-p:text-slate-600 prose-p:leading-relaxed
                        prose-li:text-slate-600
                        prose-strong:text-slate-900
                        prose-table:text-sm
                        prose-th:bg-slate-50 prose-th:border-slate-200 prose-th:px-4 prose-th:py-2.5 prose-th:text-left prose-th:font-bold prose-th:text-slate-700
                        prose-td:border-slate-200 prose-td:px-4 prose-td:py-2.5 prose-td:text-slate-600
                        prose-hr:border-slate-200 prose-hr:my-8
                        print:shadow-none print:border-none print:rounded-none print:p-0
                    ">
                        <div dangerouslySetInnerHTML={{ __html: markdownToHtml(report) }} />
                    </article>
                </div>
            </main>
        </div>
    );
}

/* ── Simple markdown → HTML converter ────────────────────────────────── */
function markdownToHtml(md: string): string {
    let html = md;

    // Headers
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    // Bold & italic
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Tables
    html = html.replace(/^\|(.+)\|$/gm, (match) => {
        const cells = match.split('|').filter(c => c.trim() !== '');
        return '<tr>' + cells.map(c => {
            const content = c.trim();
            if (content.match(/^[-:]+$/)) return null; // separator row
            return `<td>${content}</td>`;
        }).filter(Boolean).join('') + '</tr>';
    });

    // Wrap consecutive <tr> blocks in a table
    html = html.replace(/((?:<tr>.*?<\/tr>\s*)+)/g, (match) => {
        // Check if first row is a header (no --- pattern)
        const rows = match.trim().split('\n').filter(r => r.trim());
        // Remove separator rows
        const cleanRows = rows.filter(r => !r.includes('---'));
        if (cleanRows.length === 0) return '';

        // First row becomes thead
        const headerRow = cleanRows[0].replace(/<td>/g, '<th>').replace(/<\/td>/g, '</th>');
        const bodyRows = cleanRows.slice(1).join('\n');

        return `<table><thead>${headerRow}</thead><tbody>${bodyRows}</tbody></table>`;
    });

    // Unordered lists  
    html = html.replace(/^[-*] (.+)$/gm, '<li>$1</li>');
    html = html.replace(/((?:<li>.*?<\/li>\s*)+)/g, '<ul>$1</ul>');

    // Horizontal rules
    html = html.replace(/^---$/gm, '<hr />');

    // Paragraphs (lines that aren't already HTML)
    html = html.replace(/^(?!<[a-z])((?!^\s*$).+)$/gm, (match) => {
        if (match.startsWith('<')) return match;
        return `<p>${match}</p>`;
    });

    // Clean up empty paragraphs 
    html = html.replace(/<p>\s*<\/p>/g, '');

    return html;
}
