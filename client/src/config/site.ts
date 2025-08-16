export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Agentic City Planner",
  description: "AI-powered urban planning and city design platform.",
  navItems: [],
  navMenuItems: [
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: "Projects",
      href: "/projects",
    },
    {
      label: "Documents",
      href: "/documents",
    },
    {
      label: "Feedback",
      href: "/feedback",
    },
    {
      label: "Profile",
      href: "/profile",
    },
    {
      label: "Settings",
      href: "/settings",
    },
    {
      label: "Logout",
      href: "/logout",
    },
  ],
  links: {
    github: "https://github.com/anthropics/claude-code",
    twitter: "https://twitter.com/anthropicai",
    docs: "https://docs.anthropic.com",
    discord: "https://discord.gg/anthropic",
    sponsor: "https://www.anthropic.com",
  },
};
