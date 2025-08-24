
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
  UserPlus,
  Trash2,
  Loader2,
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
import { usePathname, useRouter } from "next/navigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { db } from "@/lib/firebase";
import { collection, addDoc, onSnapshot, deleteDoc, doc, DocumentData } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

interface Signatory {
    id: string;
    name: string;
    email: string;
}

const signatorySchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
});
type SignatoryFormValues = z.infer<typeof signatorySchema>;


function SignatoryManager() {
    const { toast } = useToast();
    const [signatories, setSignatories] = useState<Signatory[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    
    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "signatories"), (snapshot) => {
            const signatoriesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Signatory));
            setSignatories(signatoriesData);
        });
        return () => unsubscribe();
    }, []);

    const form = useForm<SignatoryFormValues>({
        resolver: zodResolver(signatorySchema),
        defaultValues: { name: "", email: "" },
    });

    const onSubmit = async (values: SignatoryFormValues) => {
        try {
            await addDoc(collection(db, "signatories"), values);
            toast({
                title: "Signatory Added",
                description: `${values.name} can now log in.`,
            });
            form.reset();
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Could not add signatory." });
        }
    };

    const handleDelete = async (signatoryId: string) => {
        try {
            await deleteDoc(doc(db, "signatories", signatoryId));
            toast({ variant: "destructive", title: "Signatory Removed" });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Could not remove signatory." });
        }
    }

    return (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <User />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DialogTrigger asChild>
                        <DropdownMenuItem>
                            <UserPlus className="mr-2 h-4 w-4" />
                            <span>Manage Signatories</span>
                        </DropdownMenuItem>
                    </DialogTrigger>
                    <DropdownMenuItem disabled>
                         <span>Settings</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Manage Signatories</DialogTitle>
                    <DialogDescription>
                        Add or remove users who can sign in to the application.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                    <div className="space-y-4 max-h-64 overflow-y-auto pr-4">
                         {signatories.length > 0 ? signatories.map(s => (
                            <div key={s.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                                <div>
                                    <p className="font-medium">{s.name}</p>
                                    <p className="text-sm text-muted-foreground">{s.email}</p>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive"/>
                                </Button>
                            </div>
                         )) : <p className="text-sm text-center text-muted-foreground py-4">No signatories added yet.</p>}
                    </div>

                    <Separator/>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <p className="font-semibold text-sm">Add New Signatory</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input placeholder="Signatory's name" {...field}/></FormControl><FormMessage/></FormItem>)} />
                                <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="signatory@email.com" {...field}/></FormControl><FormMessage/></FormItem>)} />
                            </div>
                             <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? <Loader2 className="animate-spin" /> : "Add Signatory"}
                            </Button>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const loginDate = localStorage.getItem('loginDate');
    const today = new Date().toISOString().split('T')[0];
    if (loginDate !== today) {
        // Clear session and redirect to login
        localStorage.removeItem('loginDate');
        router.push('/');
    }
  }, [router]);


  const isActive = (path: string) => pathname === path;
  const isParentActive = (path: string) => pathname.startsWith(path);
  
  const handleLogout = () => {
      localStorage.removeItem('loginDate');
      router.push('/');
  }

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
            <SidebarMenuButton onClick={handleLogout}>
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center justify-between p-4 bg-background border-b">
           <SidebarTrigger className="md:hidden"/>
           <div className="flex-1"></div>
           <SignatoryManager />
        </header>
        <main className="p-4 sm:p-6 lg:p-8 bg-background">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
