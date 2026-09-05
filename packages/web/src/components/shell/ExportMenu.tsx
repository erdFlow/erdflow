import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  DownloadIcon,
  FileCode2Icon,
  FileTypeIcon,
  ImageIcon,
} from "lucide-react"
import {
  EXPORT_ARIA_LABEL,
  EXPORT_PNG_LABEL,
  EXPORT_SQL_LABEL,
  EXPORT_SVG_LABEL,
} from "../../data/labels.js"
import {
  schemaToSql,
  suggestedSqlFilename,
} from "../../lib/entity-to-sql.js"
import { saveTextFile } from "../../lib/save-text-file.js"
import { useDiagramStore } from "../../store/diagram-store.js"

async function exportFullSchemaSql(): Promise<void> {
  const schema = useDiagramStore.getState().schema
  if (!schema) {
    return
  }

  const sql = schemaToSql(schema)
  if (!sql.trim()) {
    return
  }

  await saveTextFile({
    contents: `${sql}\n`,
    suggestedName: suggestedSqlFilename(schema),
    description: "SQL",
    mimeType: "text/plain",
    extension: ".sql",
  })
}

/** Header export menu. SQL saves the full schema via the system file picker. */
export function ExportMenu() {
  return (
    <DropdownMenuTrigger>
      <Button variant="ghost" size="icon-sm" aria-label={EXPORT_ARIA_LABEL}>
        <DownloadIcon />
      </Button>
      <DropdownMenu placement="bottom end" className="min-w-36">
        <DropdownMenuItem
          textValue={EXPORT_PNG_LABEL}
          onAction={() => undefined}
        >
          <ImageIcon />
          {EXPORT_PNG_LABEL}
        </DropdownMenuItem>
        <DropdownMenuItem
          textValue={EXPORT_SVG_LABEL}
          onAction={() => undefined}
        >
          <FileCode2Icon />
          {EXPORT_SVG_LABEL}
        </DropdownMenuItem>
        <DropdownMenuItem
          textValue={EXPORT_SQL_LABEL}
          onAction={() => {
            void exportFullSchemaSql()
          }}
        >
          <FileTypeIcon />
          {EXPORT_SQL_LABEL}
        </DropdownMenuItem>
      </DropdownMenu>
    </DropdownMenuTrigger>
  )
}
