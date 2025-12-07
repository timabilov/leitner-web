"use client"
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CircleUser,
  CreditCard,
  EllipsisVertical,
  LogOut,
  Sparkles,
  UserCheck,
} from "lucide-react"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import SettingsDialog2 from "@/settings/settings-dialog2"
import { useState } from "react"
import { googleLogout } from "@react-oauth/google"
import { useNavigate } from "react-router"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { useQueryClient } from "@tanstack/react-query"
import { useUserStore } from "@/store/userStore"


export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
      const { fullName, email, clearStore } = useUserStore();
      const queryClient = useQueryClient();

  const navigate = useNavigate()
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const { t } = useTranslation();
  const { isMobile } = useSidebar();


  const logout = () =>{
  toast(t('Are you sure you want to log out?'), {
          action: {
            label: <LogOut className="w-3 h-3" />,
            onClick: () => {
                 clearStore();
            try {
            //   postHog.capture("log_out_clicked", {
            //   user_id: userId,
            //   companyId,
            // });
              // postHog.reset()
             googleLogout()
            } catch (error) {
              console.error('Error signing out from Google:', error);
            }
            navigate('/');

            },
          },
        })
  }
  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full">
              <SidebarMenuButton
                size="lg"
                className=" data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-4xl bg-orange-400">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-4xl bg-orange-400 text-white">{fullName?.split(" ")[0]?.charAt(0) + "" + fullName?.split(" ")[1]?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {user.email}
                  </span>
                </div>
                <EllipsisVertical className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="text-muted-foreground truncate text-xs">
                      {user.email}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => navigate("/price-page")}>
                  <Sparkles />
                  Upgrade to Pro
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>

        <DropdownMenuItem 
                    onSelect={(e) => setOpenDialog(true)} // Prevents dropdown from closing
                    className="cursor-pointer"
                  >
                    <UserCheck className="mr-2 h-4 w-4" />
                    <span>Account</span>
                  </DropdownMenuItem>

              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
      <SettingsDialog2 isOpen={openDialog} setIsOpen={setOpenDialog}/>
    </>
    
    // <SidebarMenu>
    //   <SidebarMenuItem>
    //     <DropdownMenu>
    //       <DropdownMenuTrigger >
    //         <SidebarMenuButton
    //           size="lg"
    //           className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground item"
    //         >
    //           <Avatar className="h-8 w-8 ronded-lg">
    //             <AvatarImage src={user.avatar} alt={user.name} />
    //             <AvatarFallback className="rounded-lg bg-pink-500 text-cyan-50">CN</AvatarFallback>
    //           </Avatar>
    //           <div className="grid flex-1 text-left text-sm leading-tight">
    //             <span className="truncate font-medium">{user.name}</span>
    //             <span className="truncate text-xs">{user.email}</span>
    //           </div>
    //           <ChevronsUpDown className="ml-auto size-4" />
    //         </SidebarMenuButton>
    //       </DropdownMenuTrigger>
    //       <DropdownMenuContent
    //         className="w-(--radix-dropdown-menu-trigger-width) rounded-lg"
    //         side={isMobile ? "bottom" : "right"}
    //         align="start"
    //         sideOffset={4}
    //       >
    //         <DropdownMenuLabel className="p-0 font-normal">
    //           <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
    //             <Avatar className="h-8 w-8 rounded-lg">
    //               <AvatarImage src={user.avatar} alt={user.name} />
    //               <AvatarFallback className="rounded-lg">CN</AvatarFallback>
    //             </Avatar>
    //             <div className="grid flex-1 text-left text-sm leading-tight">
    //               <span className="truncate font-medium">{user.name}</span>
    //               <span className="truncate text-xs">{user.email}</span>
    //             </div>
    //           </div>
    //         </DropdownMenuLabel>
    //         <DropdownMenuSeparator />
    //         <DropdownMenuGroup>
    //           <DropdownMenuItem>
    //             <Sparkles />
    //             Upgrade to Pro
    //           </DropdownMenuItem>
    //         </DropdownMenuGroup>
    //         <DropdownMenuSeparator />
    //         <DropdownMenuGroup>
    //           <DropdownMenuItem>
    //             <UserCheck />
    //             Account
    //           </DropdownMenuItem>
    //         </DropdownMenuGroup>
    //         <DropdownMenuSeparator />
    //         <DropdownMenuItem>
    //           <LogOut />
    //           Log out
    //         </DropdownMenuItem>
    //       </DropdownMenuContent>
    //     </DropdownMenu>
    //   </SidebarMenuItem>
    // </SidebarMenu>
  )
}
