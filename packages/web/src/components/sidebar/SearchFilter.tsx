import { Input } from "@workspace/ui/components/input"
import { SEARCH_ARIA_LABEL, SEARCH_PLACEHOLDER } from "../../data/labels.js"
import { useDiagramStore } from "../../store/diagram-store.js"

export function SearchFilter() {
  const searchQuery = useDiagramStore((state) => state.searchQuery)
  const setSearchQuery = useDiagramStore((state) => state.setSearchQuery)

  return (
    <div className="px-2 py-2">
      <Input
        aria-label={SEARCH_ARIA_LABEL}
        placeholder={SEARCH_PLACEHOLDER}
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
      />
    </div>
  )
}
