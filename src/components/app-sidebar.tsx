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
      <SidebarContent className="bg-zinc-100 text-zinc-900">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem
                  key={item.title}
                  className={"text-zinc-900"}
                  onClick={() => navigate(item.key)}
                >
                  <SidebarMenuButton
                    isActive={pathname === item.key}
                    className="hover:bg-background menu-item-label cursor-pointer inline-flex items-center gap-2 whitespace-nowrap rounded-md text-sm transition-all data-[active=true]:bg-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50  focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:text-accent-foreground dark:hover:bg-accent/50 h-9 px-6 py-4 has-[>svg]:px-3 w-full justify-start text-zinc-900 font-normal"
                    tooltip={item.title}
                  >
                    {item.icon && <item.icon />}
                    <span className="text-primary-80">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarSeparator />
              <SidebarMenuItem className="text-zinc-900">
                <SidebarMenuButton
                  className="hover:bg-background menu-item-label cursor-pointer inline-flex items-center gap-2 whitespace-nowrap rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:text-accent-foreground dark:hover:bg-accent/50 h-9 px-6 py-4 has-[>svg]:px-3 w-full justify-start text-zinc-900 font-normal"
                  tooltip={t("Privacy Policy")}
                >
                  <HatGlasses />
                  <span className="text-primary-80">
                    {" "}
                    {t("Privacy Policy")}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem className="text-zinc-900">
                <SidebarMenuButton
                  className="hover:bg-background menu-item-label cursor-pointer inline-flex items-center gap-2 whitespace-nowrap rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:text-accent-foreground dark:hover:bg-accent/50 h-9 px-6 py-4 has-[>svg]:px-3 w-full justify-start text-zinc-900 font-normal"
                  tooltip={t("Privacy Policy")}
                >
                  <Handshake />
                  <span className="text-primary-80">
                    {t("Terms of Service")}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
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
