
"use client";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, PlusCircle, Loader2, Calendar as CalendarIcon, Wallet } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, arrayUnion, increment } from "firebase/firestore";
import { Textarea } from "@/components/ui/textarea";

export interface Leave {
    date: string;
    description: string;
}
export interface Payment {
    date: string;
    amount: number;
}
export interface Employee {
    id: string;
    name: string;
    role: string;
    salary: number;
    balance: number;
    leaves: Leave[];
    payments: Payment[];
}

const employeeSchema = z.object({
    name: z.string().min(1, "Employee name is required"),
    role: z.string().min(1, "Role is required"),
    salary: z.coerce.number().min(0, "Salary must be a positive number"),
});
type EmployeeFormValues = z.infer<typeof employeeSchema>;

const addLeaveSchema = z.object({
    date: z.string().min(1, "Date is required"),
    description: z.string().optional(),
});
type AddLeaveFormValues = z.infer<typeof addLeaveSchema>;

const recordPaymentSchema = z.object({
    date: z.string().min(1, "Date is required"),
    amount: z.coerce.number().min(1, "Payment amount is required"),
});
type RecordPaymentFormValues = z.infer<typeof recordPaymentSchema>;


function EmployeeForm({ setOpen, employee }: { setOpen: (open: boolean) => void; employee?: Employee | null }) {
    const { toast } = useToast();
    const isEditMode = !!employee;

    const form = useForm<EmployeeFormValues>({
        resolver: zodResolver(employeeSchema),
        defaultValues: {
            name: employee?.name || "",
            role: employee?.role || "",
            salary: employee?.salary || 0,
        },
    });

    const { formState: { isSubmitting } } = form;

    const onSubmit = async (values: EmployeeFormValues) => {
        try {
            if (isEditMode && employee) {
                const employeeDoc = doc(db, "employees", employee.id);
                await updateDoc(employeeDoc, values);
                toast({
                    title: "Employee Updated!",
                    description: `Successfully updated ${values.name}.`,
                });
            } else {
                const newEmployeeData = { ...values, balance: values.salary, leaves: [], payments: [] };
                await addDoc(collection(db, "employees"), newEmployeeData);
                toast({
                    title: "Employee Added!",
                    description: `Successfully added ${values.name}.`,
                });
            }
            setOpen(false);
            form.reset();
        } catch (error) {
             toast({
                variant: "destructive",
                title: "Error",
                description: "There was an error saving the employee details.",
            });
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl><Input placeholder="Employee's full name" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Role</FormLabel>
                                <FormControl><Input placeholder="e.g., Master Tailor" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="salary"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Salary</FormLabel>
                                <FormControl><Input type="number" placeholder="Monthly salary" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin" /> : (isEditMode ? "Save Changes" : "Add Employee")}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}

function AddLeaveForm({ employee, setOpen }: { employee: Employee; setOpen: (open: boolean) => void }) {
    const { toast } = useToast();
    const form = useForm<AddLeaveFormValues>({
        resolver: zodResolver(addLeaveSchema),
        defaultValues: { date: new Date().toISOString().split("T")[0], description: "" },
    });

    const onSubmit = async (values: AddLeaveFormValues) => {
        try {
            const employeeDoc = doc(db, "employees", employee.id);
            await updateDoc(employeeDoc, {
                leaves: arrayUnion({ ...values })
            });
            toast({
                title: "Leave Added",
                description: `Leave on ${values.date} has been recorded for ${employee.name}.`,
            });
            setOpen(false);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to add leave." });
        }
    };
    
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Date of Leave</FormLabel>
                            <FormControl><Input type="date" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description (Optional)</FormLabel>
                            <FormControl><Textarea placeholder="Reason for leave..." {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <DialogFooter>
                    <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                         {form.formState.isSubmitting ? <Loader2 className="animate-spin" /> : "Add Leave"}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}

function RecordPaymentForm({ employee, setOpen }: { employee: Employee; setOpen: (open: boolean) => void }) {
    const { toast } = useToast();
    const form = useForm<RecordPaymentFormValues>({
        resolver: zodResolver(recordPaymentSchema),
        defaultValues: { date: new Date().toISOString().split("T")[0], amount: 0 },
    });

    const onSubmit = async (values: RecordPaymentFormValues) => {
        try {
            const employeeDoc = doc(db, "employees", employee.id);
            await updateDoc(employeeDoc, {
                payments: arrayUnion({ ...values }),
                balance: increment(-values.amount) 
            });
            toast({
                title: "Payment Recorded",
                description: `Payment of ${formatCurrency(values.amount)} recorded for ${employee.name}.`,
            });
            setOpen(false);
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Error", description: "Failed to record payment." });
        }
    };
    
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Date of Payment</FormLabel>
                            <FormControl><Input type="date" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Amount</FormLabel>
                            <FormControl><Input type="number" placeholder="Enter amount" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                </div>
                <div className="text-sm text-muted-foreground p-2 rounded-md bg-muted">
                    Current balance due: <span className="font-bold">{formatCurrency(employee.balance)}</span>
                </div>
                <DialogFooter>
                    <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                         {form.formState.isSubmitting ? <Loader2 className="animate-spin" /> : "Record Payment"}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
    }).format(amount);
};

export default function EmployeesPage() {
    const { toast } = useToast();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
    const [dialogs, setDialogs] = useState({
        add: false,
        edit: false,
        delete: false,
        payment: false,
        paymentHistory: false,
        leaves: false,
        leaveHistory: false,
    });
    
    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "employees"), (snapshot) => {
            const employeesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
            setEmployees(employeesData);
        });
        return () => unsubscribe();
    }, []);

    const handleActionClick = (employee: Employee, dialog: keyof typeof dialogs) => {
        setCurrentEmployee(employee);
        setDialogs(prev => ({ ...prev, [dialog]: true }));
    };

    const handleRemoveEmployee = async () => {
        if (!currentEmployee) return;
        try {
            await deleteDoc(doc(db, "employees", currentEmployee.id));
            toast({
                variant: "destructive",
                title: "Employee Removed",
                description: `${currentEmployee.name} has been removed from your records.`
            });
        } catch (error) {
             toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to remove employee."
            });
        }
    }

    return (
        <div className="space-y-8">
            <PageHeader title="Employees" subtitle="Manage your staff, salaries, and leaves.">
                <Dialog open={dialogs.add} onOpenChange={(open) => setDialogs(p => ({ ...p, add: open }))}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setCurrentEmployee(null)}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Employee
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Employee</DialogTitle>
                            <DialogDescription>
                                Fill in the details below to add a new employee to your payroll.
                            </DialogDescription>
                        </DialogHeader>
                        <EmployeeForm setOpen={(open) => setDialogs(p => ({ ...p, add: open }))} />
                    </DialogContent>
                </Dialog>
            </PageHeader>
            <Card>
                <CardHeader>
                    <CardTitle>Staff List</CardTitle>
                    <CardDescription>
                        A list of all employees at your store.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Salary</TableHead>
                                <TableHead>Balance Due</TableHead>
                                <TableHead>Leaves Taken</TableHead>
                                <TableHead>
                                    <span className="sr-only">Actions</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {employees.map((employee) => (
                                <TableRow key={employee.id}>
                                    <TableCell className="font-medium">{employee.name}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{employee.role}</Badge>
                                    </TableCell>
                                    <TableCell>{formatCurrency(employee.salary)}</TableCell>
                                    <TableCell className={employee.balance > 0 ? "text-destructive" : ""}>{formatCurrency(employee.balance)}</TableCell>
                                    <TableCell>{employee.leaves?.length || 0}</TableCell>
                                    <TableCell>
                                        <AlertDialog>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onSelect={() => handleActionClick(employee, 'edit')}>Edit Details</DropdownMenuItem>
                                                    <DropdownMenuItem onSelect={() => handleActionClick(employee, 'payment')}>Record Payment</DropdownMenuItem>
                                                    <DropdownMenuItem onSelect={() => handleActionClick(employee, 'paymentHistory')}>View Payment History</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onSelect={() => handleActionClick(employee, 'leaves')}>Add Leave</DropdownMenuItem>
                                                    <DropdownMenuItem onSelect={() => handleActionClick(employee, 'leaveHistory')}>View Leave History</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <AlertDialogTrigger asChild>
                                                        <DropdownMenuItem className="text-destructive" onSelect={() => setCurrentEmployee(employee)}>
                                                            Remove Employee
                                                        </DropdownMenuItem>
                                                    </AlertDialogTrigger>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This action cannot be undone. This will permanently remove {currentEmployee?.name} from your records.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Back</AlertDialogCancel>
                                                    <AlertDialogAction onClick={handleRemoveEmployee}>
                                                        Yes, Remove Employee
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {currentEmployee && (
                <>
                    <Dialog open={dialogs.edit} onOpenChange={(open) => setDialogs(p => ({ ...p, edit: open }))}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Edit Employee Details</DialogTitle>
                                <DialogDescription>Update the details for {currentEmployee.name}.</DialogDescription>
                            </DialogHeader>
                            <EmployeeForm setOpen={(open) => setDialogs(p => ({ ...p, edit: open }))} employee={currentEmployee} />
                        </DialogContent>
                    </Dialog>
                    
                    <Dialog open={dialogs.payment} onOpenChange={(open) => setDialogs(p => ({...p, payment: open}))}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Record a Payment</DialogTitle>
                                <DialogDescription>Record a salary payment for {currentEmployee.name}.</DialogDescription>
                            </DialogHeader>
                            <RecordPaymentForm employee={currentEmployee} setOpen={(open) => setDialogs(p => ({ ...p, payment: open }))}/>
                        </DialogContent>
                    </Dialog>
                    
                     <Dialog open={dialogs.paymentHistory} onOpenChange={(open) => setDialogs(p => ({ ...p, paymentHistory: open }))}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Payment History: {currentEmployee.name}</DialogTitle>
                                <DialogDescription>A record of all salary payments made.</DialogDescription>
                            </DialogHeader>
                            <div className="py-4 max-h-96 overflow-y-auto">
                               {currentEmployee.payments?.length > 0 ? (
                                    <ul className="space-y-3">
                                        {currentEmployee.payments.map((payment, index) => (
                                            <li key={index} className="flex items-center justify-between p-3 bg-muted rounded-md">
                                                <div className="flex items-center gap-4">
                                                    <Wallet className="h-5 w-5 text-muted-foreground"/>
                                                    <div>
                                                        <p className="font-semibold">{payment.date}</p>
                                                    </div>
                                                </div>
                                                <p className="font-mono font-semibold">{formatCurrency(payment.amount)}</p>
                                            </li>
                                        ))}
                                    </ul>
                               ) : (
                                    <p className="text-center text-muted-foreground py-8">No payments have been recorded for this employee.</p>
                               )}
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={dialogs.leaves} onOpenChange={(open) => setDialogs(p => ({ ...p, leaves: open }))}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Leave</DialogTitle>
                                <DialogDescription>Record a new leave for {currentEmployee.name}.</DialogDescription>
                            </DialogHeader>
                            <AddLeaveForm employee={currentEmployee} setOpen={(open) => setDialogs(p => ({ ...p, leaves: open }))} />
                        </DialogContent>
                    </Dialog>
                    
                    <Dialog open={dialogs.leaveHistory} onOpenChange={(open) => setDialogs(p => ({ ...p, leaveHistory: open }))}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Leave History: {currentEmployee.name}</DialogTitle>
                                <DialogDescription>A record of all leaves taken.</DialogDescription>
                            </DialogHeader>
                            <div className="py-4 max-h-96 overflow-y-auto">
                               {currentEmployee.leaves?.length > 0 ? (
                                    <ul className="space-y-3">
                                        {currentEmployee.leaves.map((leave, index) => (
                                            <li key={index} className="flex items-start gap-4 p-3 bg-muted rounded-md">
                                                <CalendarIcon className="h-5 w-5 mt-1 text-muted-foreground"/>
                                                <div>
                                                    <p className="font-semibold">{leave.date}</p>
                                                    <p className="text-sm text-muted-foreground">{leave.description || "No description"}</p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                               ) : (
                                    <p className="text-center text-muted-foreground py-8">No leaves have been recorded for this employee.</p>
                               )}
                            </div>
                        </DialogContent>
                    </Dialog>
                </>
            )}

        </div>
    );
}


    

    