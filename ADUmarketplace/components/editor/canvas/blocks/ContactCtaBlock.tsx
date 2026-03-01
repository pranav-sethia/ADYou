import { ContactCtaBlock as ContactCtaBlockType } from '@/lib/types/block'
import { Button } from '@/components/ui/button'

interface Props {
    block: ContactCtaBlockType
}

export function ContactCtaBlock({ block }: Props) {
    return (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center transition-all hover:border-emerald-300 hover:shadow-md">
            <h3 className="text-2xl font-bold text-emerald-950 mb-3">{block.content.title}</h3>
            <p className="text-emerald-800 mb-6 max-w-md mx-auto">
                {block.content.messagePrompt}
            </p>
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-8 h-12 text-base shadow-sm">
                {block.content.buttonText}
            </Button>
            <p className="text-xs text-emerald-600/70 mt-4">
                Typically replies within 24 hours.
            </p>
        </div>
    )
}
