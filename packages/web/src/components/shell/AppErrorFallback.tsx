import { Button } from "@workspace/ui/components/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { AlertTriangleIcon } from "lucide-react"
import type { FallbackProps } from "react-error-boundary"
import {
  ERROR_BOUNDARY_DESCRIPTION,
  ERROR_BOUNDARY_RELOAD_LABEL,
  ERROR_BOUNDARY_RETRY_LABEL,
  ERROR_BOUNDARY_TITLE,
} from "../../data/labels.js"

export function AppErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : undefined

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-6">
      <Empty className="max-w-md border border-dashed">
        <EmptyHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-muted text-destructive">
            <AlertTriangleIcon className="size-6" />
          </div>
          <EmptyTitle>{ERROR_BOUNDARY_TITLE}</EmptyTitle>
          <EmptyDescription>{ERROR_BOUNDARY_DESCRIPTION}</EmptyDescription>
          {message ? (
            <p className="mt-2 max-w-sm truncate font-mono text-muted-foreground text-xs">
              {message}
            </p>
          ) : null}
        </EmptyHeader>
        <EmptyContent className="flex-row justify-center gap-2">
          <Button type="button" variant="outline" onClick={resetErrorBoundary}>
            {ERROR_BOUNDARY_RETRY_LABEL}
          </Button>
          <Button
            type="button"
            onClick={() => {
              window.location.reload()
            }}
          >
            {ERROR_BOUNDARY_RELOAD_LABEL}
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}
