import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenuButton,
  SidebarMenu,
  SidebarMenuItem
} from "@/components/ui/sidebar"
import { IconInnerShadowBottom } from "@tabler/icons-react"
import { Calendar, Home, Inbox, Search, FolderOpen } from "lucide-react"
import { Link } from "react-router-dom"
import img from './adaptive-icon.png';


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
              <SidebarMenuButton tooltip={item.title}>
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
    </Sidebar>
  )
}