import {
  Link,
  Navbar as HeroUINavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar,
} from "@heroui/react";
import { link as linkStyles } from "@heroui/theme";
import clsx from "clsx";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import { Logo } from "@/components/icons";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/utils/api";

export const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuthStore();

  const handleLogout = async () => {
    try {
      await api.auth.logout();
      logout();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error) {
      // Even if API call fails, logout locally
      logout();
      navigate("/login");
    }
  };

  // Don't render navbar on login page
  if (!isAuthenticated) {
    return null;
  }

  return (
    <HeroUINavbar maxWidth="xl" position="sticky">
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand className="gap-3 max-w-fit">
          <Link
            className="flex justify-start items-center gap-1"
            color="foreground"
            href="/dashboard"
          >
            <Logo />
            <p className="font-bold text-inherit">{siteConfig.name}</p>
          </Link>
        </NavbarBrand>
        <div className="hidden lg:flex gap-4 justify-start ml-2">
          {siteConfig.navItems.map((item) => (
            <NavbarItem key={item.href}>
              <Link
                className={clsx(
                  linkStyles({ color: "foreground" }),
                  "data-[active=true]:text-primary data-[active=true]:font-medium"
                )}
                color="foreground"
                href={item.href}
              >
                {item.label}
              </Link>
            </NavbarItem>
          ))}
        </div>
      </NavbarContent>

      <NavbarContent
        className="hidden sm:flex basis-1/5 sm:basis-full"
        justify="end"
      >
        <NavbarItem className="hidden sm:flex gap-2">
          <ThemeSwitch />
        </NavbarItem>

        <NavbarItem>
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Avatar
                as="button"
                className="transition-transform"
                color="primary"
                name={user?.name}
                size="sm"
                src={`https://ui-avatars.com/api/?name=${user?.name}&background=006fee&color=fff`}
              />
            </DropdownTrigger>
            <DropdownMenu aria-label="Profile Actions" variant="flat">
              <DropdownItem key="profile" className="h-14 gap-2">
                <p className="font-semibold">Signed in as</p>
                <p className="font-semibold">{user?.email}</p>
              </DropdownItem>
              <DropdownItem key="dashboard" href="/dashboard">
                Dashboard
              </DropdownItem>
              <DropdownItem key="settings" href="/settings">
                Settings
              </DropdownItem>
              <DropdownItem key="logout" color="danger" onClick={handleLogout}>
                Log Out
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </NavbarItem>
      </NavbarContent>

      <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
        <ThemeSwitch />
        <NavbarMenuToggle />
      </NavbarContent>

      <NavbarMenu>
        <div className="mx-4 mt-2 flex flex-col gap-2">
          {siteConfig.navMenuItems.map((item, index) => (
            <NavbarMenuItem key={`${item}-${index}`}>
              <Link
                color={item.label === "Logout" ? "danger" : "foreground"}
                href={item.href}
                size="lg"
                onClick={item.label === "Logout" ? handleLogout : undefined}
              >
                {item.label}
              </Link>
            </NavbarMenuItem>
          ))}
        </div>
      </NavbarMenu>
    </HeroUINavbar>
  );
};
