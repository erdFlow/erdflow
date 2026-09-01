import { Input } from "@workspace/ui/components/input";
import { useDiagramStore } from "../../store/diagram-store.js";

export function SearchFilter() {
  const searchQuery = useDiagramStore((state) => state.searchQuery);
  const setSearchQuery = useDiagramStore((state) => state.setSearchQuery);

  return (
    <div className="px-2 py-2">
      <Input
        aria-label="Search tables and enums"
        placeholder="Search tables and enums"
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
      />
    </div>
  );
}
