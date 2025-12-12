import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarGroupContent,
  SidebarMenuButton,
  SidebarMenu,
  SidebarMenuItem,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  Home,
  FolderOpen,
  Smartphone,
  HatGlasses,
  Handshake,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next"; // Import the hook
import { NavUser } from "./nav-user";
import { Avatar } from "./ui/avatar";
import CatPenIcon from "@/notes/cat-pen-icon";
import { cn } from "@/lib/utils";

export function AppSidebar({ fullName, photo, email, ...props }) {
  const { t } = useTranslation(); // Initialize the hook
  const location = useLocation();
  const { pathname } = location;
  const navigate = useNavigate();
  const items = [
    {
      title: t("Notes"),
      url: "/",
      icon: Home,
      key: "/notes",
    },
    {
      title: t("Folders"),
      url: "#",
      icon: FolderOpen,
      key: "/folders",
    },
    {
      title: t("App"),
      url: "#",
      icon: Smartphone,
      key: "/app",
    },
  ];


    // Helper for static footer links to keep code clean
  const footerLinks = [
    { title: t("Privacy Policy"), icon: HatGlasses, action: () => {} },
    { title: t("Terms of Service"), icon: Handshake, action: () => {} },
  ];


  return (
    <Sidebar collapsible="none" className="h-auto border-r" {...props}>
      <SidebarHeader className="border-b">
        <SidebarMenu className="p-0.5">
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]"
            >
              <Link to="/login">
                <Avatar className="h-8 w-8 rounded-full bg-gray-950 flex items-center mr-2">
                  <CatPenIcon />
                </Avatar>
                <h3 className="scroll-m-20 text-3xl font-semibold tracking-tight menu-logo">
                  {t("Leitner AI")}
                </h3>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
       <SidebarContent className="bg-muted/40">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = pathname.startsWith(item.key);
                console.log(isActive, " for ", item.key)
                return (
                   <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        onClick={() => navigate(item.key)}
                        tooltip={item.title}
                        isActive={isActive}
                        className={cn(
                          "h-10 w-full justify-start gap-3 px-3 transition-all",
                          // FIX 2: We use specific colors. 
                          // Light Mode Active: bg-zinc-900 (Black) text-white
                          isActive 
                            ? "data-[active=true]:bg-zinc-200 dark:data-[active=true]:bg-zinc-900 text-white font-medium hover:bg-zinc-800 hover:text-white dark:bg-zinc-50 dark:text-zinc-white" 
                            : " active:text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                        )}
                      >
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                );
              })}

              <SidebarSeparator className="my-2" />
              
              {/* Static Footer Links (Privacy/Terms) */}
              {footerLinks.map((link) => (
                <SidebarMenuItem key={link.title}>
                  <SidebarMenuButton
                    className="h-10 w-full justify-start gap-3 px-3 text-zinc-600 hover:bg-zinc-200/50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                    tooltip={link.title}
                  >
                    <link.icon />
                    <span className="font-medium">{link.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>


      <SidebarFooter>
      <NavUser
        user={{
          name: fullName,
          email: email,
          avatar: photo,
        }}
      />
      </SidebarFooter>
    </Sidebar>
  );
}
