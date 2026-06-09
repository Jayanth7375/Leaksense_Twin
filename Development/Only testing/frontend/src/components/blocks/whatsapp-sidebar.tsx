import React from "react"
import {
  Menu,
  LayoutDashboard,
  Activity,
  History,
  Terminal,
  Box,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/blocks/sidebar"

import { useSidebar } from "@/components/blocks/sidebar"

export function AppSidebar({ activePage, setActivePage }) {

  const items = [
    {
      title: "Real-Time Dashboard",
      id: "dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Digital Twin",
      id: "digital-twin",
      icon: Box,
    },
    {
      title: "Analysis",
      id: "engine",
      icon: Activity,
    },
    {
      title: "Detection History",
      id: "history",
      icon: History,
    },
    {
      title: "DAX Console",
      id: "dax",
      icon: Terminal,
    },
  ]
  const { toggleSidebar } = useSidebar()
  return (
    <Sidebar
      variant="sidebar"
      collapsible="icon"
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            {/* Hamburger Toggle */}
            <SidebarMenu className="mb-6">
              <SidebarMenuItem>
                <SidebarMenuButton onClick={toggleSidebar} asChild>
                  <button className="cursor-pointer flex items-center justify-start w-full">
                    <Menu className="w-7 h-7" />
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>

            {/* Navigation Options */}
            <SidebarMenu className="space-y-2">
              {items.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={activePage === item.id}
                    onClick={(e) => {
                      e.preventDefault();
                      if (setActivePage) setActivePage(item.id);
                    }}
                    asChild
                  >
                    <a href="#" style={{ cursor: 'pointer' }}>
                      <item.icon style={{ width: '22px', height: '22px', flexShrink: 0 }} />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
