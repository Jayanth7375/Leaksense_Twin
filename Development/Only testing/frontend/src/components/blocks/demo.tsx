import { AppSidebar } from "@/components/blocks/whatsapp-sidebar"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/blocks/sidebar"

export function Demo() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>

      </SidebarInset>
    </SidebarProvider>
  )
}
