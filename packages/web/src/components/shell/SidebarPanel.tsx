import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@workspace/ui/components/sidebar";
import { SearchFilter } from "../sidebar/SearchFilter.js";
import { EntityList } from "../sidebar/EntityList.js";

export function SidebarPanel() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SearchFilter />
      </SidebarHeader>
      <SidebarContent>
        <EntityList />
      </SidebarContent>
      <SidebarFooter />
      <SidebarRail />
    </Sidebar>
  );
}
