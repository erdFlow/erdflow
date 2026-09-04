import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar"
import { ChevronRightIcon } from "lucide-react"
import { type ReactNode, useMemo } from "react"
import {
  EMPTY_NO_MATCHES,
  EMPTY_NO_SCHEMA,
  SIDEBAR_SECTION,
} from "../../data/labels.js"
import { useDiagramStore } from "../../store/diagram-store.js"

function CollapsibleSection({
  label,
  count,
  children,
}: {
  label: string
  count: number
  children: ReactNode
}) {
  return (
    <Collapsible defaultExpanded className="group/collapsible">
      <SidebarGroup>
        <SidebarGroupLabel
          elementType={CollapsibleTrigger}
          className="w-full cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <ChevronRightIcon className="transition-transform group-data-expanded/collapsible:rotate-90" />
          {label}
          <span className="ml-auto tabular-nums">{count}</span>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>{children}</SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  )
}

export function EntityList() {
  const schema = useDiagramStore((state) => state.schema)
  const searchQuery = useDiagramStore((state) => state.searchQuery)
  const focusedEntityId = useDiagramStore((state) => state.focusedEntityId)
  const setFocusedEntityId = useDiagramStore(
    (state) => state.setFocusedEntityId
  )

  const normalizedQuery = searchQuery.trim().toLowerCase()

  const entities = useMemo(() => {
    if (!schema) {
      return []
    }

    return schema.entities.filter((entity) =>
      normalizedQuery
        ? entity.name.toLowerCase().includes(normalizedQuery)
        : true
    )
  }, [normalizedQuery, schema])

  const enums = useMemo(() => {
    if (!schema) {
      return []
    }

    return schema.enums.filter((enumDef) =>
      normalizedQuery
        ? enumDef.name.toLowerCase().includes(normalizedQuery)
        : true
    )
  }, [normalizedQuery, schema])

  if (!schema) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>{EMPTY_NO_SCHEMA.title}</EmptyTitle>
          <EmptyDescription>{EMPTY_NO_SCHEMA.description}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  if (entities.length === 0 && enums.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>{EMPTY_NO_MATCHES.title}</EmptyTitle>
          <EmptyDescription>{EMPTY_NO_MATCHES.description}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <>
      <CollapsibleSection label={SIDEBAR_SECTION.TABLES} count={entities.length}>
        {entities.map((entity) => (
          <SidebarMenuItem key={entity.id}>
            <SidebarMenuButton
              isActive={focusedEntityId === entity.id}
              onPress={() => setFocusedEntityId(entity.id)}
            >
              <span>{entity.name}</span>
              <SidebarMenuBadge>{entity.fields.length}</SidebarMenuBadge>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </CollapsibleSection>

      {enums.length > 0 ? (
        <CollapsibleSection label={SIDEBAR_SECTION.ENUMS} count={enums.length}>
          {enums.map((enumDef) => (
            <SidebarMenuItem key={enumDef.id}>
              <SidebarMenuButton>
                <span>{enumDef.name}</span>
                <SidebarMenuBadge>{enumDef.values.length}</SidebarMenuBadge>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </CollapsibleSection>
      ) : null}
    </>
  )
}
