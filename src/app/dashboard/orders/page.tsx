

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
import { MoreHorizontal, PlusCircle } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { InvoicePrintWrapper } from "@/components/dashboard/invoice";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, DocumentData, QueryDocumentSnapshot, query, orderBy } from "firebase/firestore";
import { MeasurementSlip } from "@/components/dashboard/measurement-slip";

// Re-defining the Order interface here based on what's stored in Firestore
export interface Order {
    id: string; // Firestore document ID
    orderId: string;
    invoiceNumber: number;
    customerName: string;
    deliveryDate: string;
    sellingPrice: number;
    advance: number;
    status: "In Progress" | "Ready" | "Delivered";
    orderType: "stitching" | "readymade" | "fabric";
    stitchingService?: string;
    readymadeItemName?: string;
    readymadeSize?: string;
    fabricId?: string;
    measurements?: { [key: string]: string | undefined };
    createdAt: any; // Using any for Firestore Timestamp for simplicity
}

function getOrderItems(order: Order) {
    switch (order.orderType) {
        case 'stitching':
            return order.stitchingService || 'Stitching Service';
        case 'readymade':
            return `${order.readymadeItemName} (Size: ${order.readymadeSize})` || 'Ready-made Item';
        case 'fabric':
            return `Fabric Sale`; // fabricId might not be enough to get a name here without another fetch
        default:
            return 'N/A';
    }
}

function UpdateStatusDialog({ order, setOpen }: { order: Order; setOpen: (open: boolean) => void }) {
  const [status, setStatus] = useState(order.status);
  const { toast } = useToast();

  const handleUpdate = async () => {
    try {
        const orderDoc = doc(db, "orders", order.id);
        await updateDoc(orderDoc, { status: status });
        toast({
            title: "Status Updated!",
            description: `Order ${order.orderId} has been marked as ${status}.`,
        });
        setOpen(false);
    } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Could not update order status." });
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Update Order Status</DialogTitle>
        <DialogDescription>
          Change the status for order #{order.orderId}.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="status">New Status</Label>
          <Select value={status} onValueChange={(value) => setStatus(value as Order['status'])}>
            <SelectTrigger id="status">
              <SelectValue placeholder="Select a status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Ready">Ready</SelectItem>
              <SelectItem value="Delivered">Delivered</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button onClick={handleUpdate}>Update Status</Button>
    </DialogContent>
  );
}


export default function OrdersPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [dialogs, setDialogs] = useState({
      invoice: false,
      status: false,
      receipt: false,
      delete: false,
  });

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<Order, 'id'>) }));
        setOrders(ordersData);
    });
    return () => unsubscribe();
  }, []);


  const handleActionClick = (order: Order, dialog: keyof typeof dialogs) => {
    setCurrentOrder(order);
    setDialogs(prev => ({ ...prev, [dialog]: true }));
  };
  
  const handleCancelOrder = async () => {
    if (!currentOrder) return;
    try {
        await deleteDoc(doc(db, "orders", currentOrder.id));
        toast({
            variant: "destructive",
            title: "Order Cancelled",
            description: `Order ${currentOrder.orderId} has been cancelled.`
        });
        setDialogs(p => ({...p, delete: false}));
    } catch(error) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not cancel the order."
        })
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const getInvoiceData = (order: Order | null) => {
      if (!order) return null;
      const balance = order.sellingPrice - (order.advance || 0);
      return {
        id: order.id, // Use firestore id
        orderId: order.orderId,
        invoiceNumber: order.invoiceNumber,
        customerName: order.customerName,
        deliveryDate: order.deliveryDate,
        total: order.sellingPrice,
        paid: order.advance || 0,
        balance: balance,
        status: order.status,
        items: getOrderItems(order),
        measurements: order.measurements,
      }
  }

  const invoiceData = getInvoiceData(currentOrder);

  return (
    <div className="space-y-8">
      <PageHeader
        title="All Orders"
        subtitle="Manage all customer orders and invoices."
      >
        <Link href="/dashboard/orders/new" passHref>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> New Order
          </Button>
        </Link>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
          <CardDescription>
            A list of all past and present orders.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const balance = order.sellingPrice - (order.advance || 0);
                return (
                    <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.invoiceNumber}</TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                        {getOrderItems(order)}
                    </TableCell>
                    <TableCell>{formatCurrency(order.sellingPrice)}</TableCell>
                    <TableCell
                        className={balance > 0 ? "text-destructive" : ""}
                    >
                        {formatCurrency(balance)}
                    </TableCell>
                    <TableCell>
                        <Badge
                        variant={
                            order.status === "Delivered" ? "secondary" : "outline"
                        }
                        className="capitalize"
                        >
                        {order.status}
                        </Badge>
                    </TableCell>
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
                            <DropdownMenuItem onSelect={() => handleActionClick(order, 'invoice')}>
                                Generate Invoice
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleActionClick(order, 'receipt')}>
                                View Measurement Slip
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleActionClick(order, 'status')}>
                                Update Status
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-destructive" onSelect={() => setCurrentOrder(order)}>
                                    Cancel Order
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                This action cannot be undone. This will permanently cancel the order #{currentOrder?.orderId}.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Back</AlertDialogCancel>
                                <AlertDialogAction onClick={handleCancelOrder}>
                                Yes, Cancel Order
                                </AlertDialogAction>
                            </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </TableCell>
                    </TableRow>
                )
            })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {currentOrder && (
         <>
            <Dialog open={dialogs.invoice} onOpenChange={(open) => setDialogs(p => ({...p, invoice: open}))}>
               {invoiceData && (
                 <DialogContent className="max-w-3xl p-0">
                    <DialogHeader className="p-6 pb-0">
                       <DialogTitle>Invoice #{invoiceData.invoiceNumber}</DialogTitle>
                       <DialogDescription>
                         Review the invoice details below or print a copy for order {invoiceData.orderId}.
                       </DialogDescription>
                     </DialogHeader>
                    <InvoicePrintWrapper order={invoiceData} />
                </DialogContent>
               )}
            </Dialog>
            <Dialog open={dialogs.status} onOpenChange={(open) => setDialogs(p => ({...p, status: open}))}>
               <UpdateStatusDialog order={currentOrder} setOpen={(open) => setDialogs(p => ({...p, status: open}))} />
            </Dialog>
            <Dialog open={dialogs.receipt} onOpenChange={(open) => setDialogs(p => ({...p, receipt: open}))}>
                 {invoiceData && <MeasurementSlip order={invoiceData}/>}
            </Dialog>
         </>
      )}

    </div>
  );
}

    
