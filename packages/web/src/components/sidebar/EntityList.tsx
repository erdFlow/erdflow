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
import { useMemo } from "react"
import {
  EMPTY_NO_MATCHES,
  EMPTY_NO_SCHEMA,
  SIDEBAR_SECTION,
} from "../../data/labels.js"
import { useDiagramStore } from "../../store/diagram-store.js"

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
      <SidebarGroup>
        <SidebarGroupLabel>
          {SIDEBAR_SECTION.TABLES}
          <SidebarMenuBadge>{entities.length}</SidebarMenuBadge>
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
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
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {enums.length > 0 ? (
        <SidebarGroup>
          <SidebarGroupLabel>
            {SIDEBAR_SECTION.ENUMS}
            <SidebarMenuBadge>{enums.length}</SidebarMenuBadge>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {enums.map((enumDef) => (
                <SidebarMenuItem key={enumDef.id}>
                  <SidebarMenuButton>
                    <span>{enumDef.name}</span>
                    <SidebarMenuBadge>{enumDef.values.length}</SidebarMenuBadge>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ) : null}
    </>
  )
}
