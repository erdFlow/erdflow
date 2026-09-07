import type { DatabaseKind, UniversalSchema } from "@erdflow/core"
import {
  DOCUMENT_VIEW_CLOSE_LABEL,
  DOCUMENT_VIEW_COPY_LABEL,
  DOCUMENT_VIEW_EMPTY_DESCRIPTION,
  DOCUMENT_VIEW_EMPTY_LABEL,
  SHOW_DOCUMENT_VIEW_LABEL,
  SHOW_SQL_VIEW_LABEL,
  SQL_VIEW_CLOSE_LABEL,
  SQL_VIEW_COPY_LABEL,
  SQL_VIEW_EMPTY_DESCRIPTION,
  SQL_VIEW_EMPTY_LABEL,
} from "../data/labels.js"

export function schemaDatabaseKind(
  schema: UniversalSchema | null | undefined
): DatabaseKind {
  return schema?.meta?.databaseKind ?? "relational"
}

export function schemaViewLabels(kind: DatabaseKind) {
  if (kind === "document") {
    return {
      menu: SHOW_DOCUMENT_VIEW_LABEL,
      emptyTitle: DOCUMENT_VIEW_EMPTY_LABEL,
      emptyDescription: DOCUMENT_VIEW_EMPTY_DESCRIPTION,
      copy: DOCUMENT_VIEW_COPY_LABEL,
      close: DOCUMENT_VIEW_CLOSE_LABEL,
    }
  }
  return {
    menu: SHOW_SQL_VIEW_LABEL,
    emptyTitle: SQL_VIEW_EMPTY_LABEL,
    emptyDescription: SQL_VIEW_EMPTY_DESCRIPTION,
    copy: SQL_VIEW_COPY_LABEL,
    close: SQL_VIEW_CLOSE_LABEL,
  }
}
