import { CanvasEditor } from '@/components/editor/CanvasEditor'
import { MOCK_LISTINGS } from '@/lib/mock/listings'

export function generateStaticParams() {
    return MOCK_LISTINGS.map((listing) => ({
        id: listing.id,
    }))
}

export default function EditorPage({ params }: { params: { id: string } }) {
    // The v0 prototype operates as a fully self-contained generic shell for visual display.
    // So we just return it directly instead of mapping the listing object properties right now,
    // to match the requested standalone "premium visual appeal" output.
    return <CanvasEditor />
}
