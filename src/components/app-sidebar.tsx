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


export function AppSidebar({ ...props }) {

    // Menu items.
const items = [
  {
    title: "Notes",
    url: "/",
    icon: Home,
  },
  {
    title: "Settings",
    url: "#",
    icon: Inbox,
  },
  {
    title: "Profile",
    url: "#",
    icon: Calendar,
  },
  {
    title: "Folders",
    url: "#",
    icon: FolderOpen,
  }
]


  return (
<Sidebar collapsible="none" className="h-auto border-r" {...props}>
      <SidebarHeader className="border-b">
        <SidebarMenu  className="p-0.5">
          <SidebarMenuItem>
            <SidebarMenuButton asChild className=" data-[slot=sidebar-menu-button]">
              <Link to="/login">
               <h3 className="scroll-m-20 text-3xl font-semibold tracking-tight">
                    Leitner AI
                    </h3>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
         <SidebarGroup>
      <SidebarGroupContent>
        {/* <SidebarGroupLabel>Home</SidebarGroupLabel> */}
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
        {/* <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
         <CreateFolder />
      </SidebarFooter>
    </Sidebar>
  )
}