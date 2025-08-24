
"use client"
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Package,
  Scissors,
  User,
  LogOut,
  Shirt,
  HandPlatter,
  View,
} from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { RtfLogo } from "@/components/rtf-logo";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;
  const isParentActive = (path: string) => pathname.startsWith(path);

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <RtfLogo className="w-8 h-8 text-sm" />
            <span className="text-lg font-semibold font-headline text-sidebar-foreground">
              Raghav Tailors
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/dashboard" passHref>
                <SidebarMenuButton isActive={isActive('/dashboard')} tooltip="Dashboard">
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>

             <Accordion type="multiple" className="w-full" defaultValue={isParentActive('/dashboard/stock') ? ['stock'] : []}>
              <AccordionItem value="stock" className="border-none">
                <AccordionTrigger className="hover:no-underline [&[data-state=open]>svg]:text-sidebar-accent-foreground p-2 text-sm rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground">
                  <div className="flex items-center gap-2">
                    <Package />
                    <span>Stock</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-0 pl-4">
                   <SidebarMenu className="py-2">
                      <SidebarMenuItem>
                        <Link href="/dashboard/stock" passHref>
                          <SidebarMenuButton isActive={isActive('/dashboard/stock')} variant="ghost" size="sm">
                            <View />
                            <span>Overview</span>
                          </SidebarMenuButton>
                        </Link>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <Link href="/dashboard/stock/readymade" passHref>
                          <SidebarMenuButton isActive={isActive('/dashboard/stock/readymade')} variant="ghost" size="sm">
                            <Shirt/>
                            <span>Ready-Made</span>
                          </SidebarMenuButton>
                        </Link>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <Link href="/dashboard/stock/fabric" passHref>
                          <SidebarMenuButton isActive={isActive('/dashboard/stock/fabric')} variant="ghost" size="sm">
                            <HandPlatter />
                            <span>Fabric</span>
                          </SidebarMenuButton>
                        </Link>
                      </SidebarMenuItem>
                    </SidebarMenu>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <Accordion type="multiple" className="w-full" defaultValue={isParentActive('/dashboard/orders') ? ['orders'] : []}>
              <AccordionItem value="orders" className="border-none">
                <AccordionTrigger className="hover:no-underline [&[data-state=open]>svg]:text-sidebar-accent-foreground p-2 text-sm rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground">
                   <div className="flex items-center gap-2">
                    <Scissors />
                    <span>Orders</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-0 pl-4">
                   <SidebarMenu className="py-2">
                      <SidebarMenuItem>
                        <Link href="/dashboard/orders/new" passHref>
                          <SidebarMenuButton isActive={isActive('/dashboard/orders/new')} variant="ghost" size="sm">
                            <span>New Order</span>
                          </SidebarMenuButton>
                        </Link>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <Link href="/dashboard/orders" passHref>
                          <SidebarMenuButton isActive={isActive('/dashboard/orders')} variant="ghost" size="sm">
                            <span>All Orders</span>
                          </SidebarMenuButton>
                        </Link>
                      </SidebarMenuItem>
                    </SidebarMenu>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <SidebarMenuItem>
              <Link href="/dashboard/customers" passHref>
                <SidebarMenuButton isActive={isActive('/dashboard/customers')} tooltip="Customers">
                  <Users />
                  <span>Customers</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <Link href="/dashboard/employees" passHref>
                <SidebarMenuButton isActive={isActive('/dashboard/employees')} tooltip="Employees">
                  <User />
                  <span>Employees</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <Link href="/" passHref>
            <SidebarMenuButton>
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
          </Link>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center justify-between p-4 bg-background border-b">
           <SidebarTrigger className="md:hidden"/>
           <div className="flex-1"></div>
           <Button variant="ghost" size="icon">
              <User />
           </Button>
        </header>
        <main className="p-4 sm:p-6 lg:p-8 bg-background">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
