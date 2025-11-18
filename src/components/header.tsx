import { useUserStore } from "@/store/userStore";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/services/auth";
import { API_BASE_URL } from "@/services/config";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Select from "./select";
import { BellOff, BellRing, ChevronDown, Loader2Icon, Search } from "lucide-react";
import { AnimatedTooltip } from "./ui/motion-tooltip";
import { useState, useId, useEffect } from "react";
import { Switch } from "./ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "./ui/input-group";

const Header = ({
  isAlertEnabled,
  showAlertBadge,
  search,
  isSearching
}: {
  title?: string;
  isAlertEnabled?: boolean;
  showAlertBadge?: boolean;
  search: (val?: string) => void;
  isSearching: boolean
}) => {
  const { companyId, photo, fullName } = useUserStore();
  const [checked, setChecked] = useState<boolean>(!!isAlertEnabled);
  const [searchValue, setSearchValue] = useState<string | undefined>("");

  const { setFolders } = useUserStore()
  const id = useId();

  const toggleSwitch = () => setChecked((prev) => !prev);

  const shortName = `${fullName.split(" ")[0][0]}${
    fullName.split(" ")[1][0]
  }`?.toLowerCase();

  const { data: foldersQuery, isLoading: isLoadingFolders } = useQuery({
    queryKey: ["folders"],
    refetchOnWindowFocus: false,
    queryFn: async () =>
      axiosInstance.get(API_BASE_URL + `/company/${companyId}/notes/folder`),
    enabled: !!companyId,
    throwOnError: (error) => {
      console.error("Get folders error:", error);
      return false;
    },
  });

    useEffect(() => {
    if (foldersQuery?.data) setFolders(foldersQuery?.data?.folders);
  }, [foldersQuery?.data])


  return (
    <header className="bg-background/90 z-20 p-2 sticky top-0 flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 justify-between">
        <div className="relative w-fit flex flex-row justify-start">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />

          <InputGroup>
            <InputGroupInput
              placeholder="Search notes..."
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value)
                search(e.target.value)
              }}
              className="pl-10 w-2xl z-30"

            />
          {
            isSearching ?  (
              <InputGroupAddon align="inline-end">
                <Loader2Icon className="animate-spin text-pink-500"/>
              </InputGroupAddon>
            ) : <div className="w-[28px]" />
             
          }
        </InputGroup>


          
        </div>
        {showAlertBadge && (
          <>
            <AnimatedTooltip
              className=""
              trigger={[
                <div
                  className="group flex flex-row justify-center h-[36px] items-center gap-2 "
                  data-state={checked ? "checked" : "unchecked"}
                >
                  <span
                    id={`${id}-light`}
                    className="group-data-[state=checked]:text-muted-foreground/70 cursor-pointer text-left text-sm font-medium"
                    aria-controls={id}
                    onClick={() => setChecked(false)}
                  >
                    <BellOff className="size-5" aria-hidden="true" />
                  </span>
                  <Switch
                    id={id}
                    checked={checked}
                    onCheckedChange={toggleSwitch}
                    aria-labelledby={`${id}-dark ${id}-light`}
                    aria-label="Toggle between dark and light mode"
                  />
                  <span
                    id={`${id}-dark`}
                    className="group-data-[state=unchecked]:text-muted-foreground/70 cursor-pointer text-right text-sm font-medium"
                    aria-controls={id}
                    onClick={() => setChecked(true)}
                  >
                    <BellRing className="size-5" aria-hidden="true" />
                  </span>
                </div>,
              ]}
              items={[
                <p>Turn on this setting to get notifications on your phone.</p>,
              ]}
            />
          </>
        )}
        <div className="relative flex justify-end items-center gap-2">
          <Select
            data={foldersQuery?.data?.folders || []}
            loading={isLoadingFolders}
          />
          <DropdownMenu>
              <DropdownMenuTrigger>
                <Button variant="ghost" className="flex items-center gap-2">
                 <Avatar className="h-9 w-9">
                    <AvatarImage src={photo} />
                    <AvatarFallback className=" bg-orange-500 text-white">
                      {shortName}
                    </AvatarFallback>
                  </Avatar>

                  <span className="xs:hidden md:inline">{fullName}</span>
                  <ChevronDown className="h-4 w-4 md:inline" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
        {/* <div classNam
            e="relative max-w-md flex-1 h-2"></div> */}
      </div>
    </header>
  );
};

export default Header;
