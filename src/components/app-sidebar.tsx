import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarGroupContent,
  SidebarMenuButton,
  SidebarMenu,
  SidebarMenuItem,
  SidebarFooter
} from "@/components/ui/sidebar"
import { Calendar, Home, Inbox, FolderOpen } from "lucide-react"
import { Link } from "react-router-dom"
import CreateFolder from "./create-folder"
import { useTranslation } from "react-i18next"; // Import the hook

export function AppSidebar({ ...props }) {
  const { t } = useTranslation(); // Initialize the hook

  // Menu items with translated titles.
  const items = [
    {
      title: t("Notes"),
      url: "/",
      icon: Home,
    },
    {
      title: t("Settings"),
      url: "#",
      icon: Inbox,
    },
    {
      title: t("Profile"),
      url: "#",
      icon: Calendar,
    },
    {
      title: t("Folders"),
      url: "#",
      icon: FolderOpen,
    }
  ];

  return (
    <Sidebar collapsible="none" className="h-auto border-r" {...props}>
      <SidebarHeader className="border-b">
        <SidebarMenu className="p-0.5">
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]">
              <Link to="/login">
                <h3 className="scroll-m-20 text-3xl font-semibold tracking-tight">
                  {t("Leitner AI")}
                </h3>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton className="cursor-pointer inline-flex items-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:text-accent-foreground dark:hover:bg-accent/50 h-9 px-4 py-2 has-[>svg]:px-3 text-sidebar-foreground hover:bg-sidebar-accent w-full justify-start" tooltip={item.title}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <CreateFolder />
      </SidebarFooter>
    </Sidebar>
  );
}