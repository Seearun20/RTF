
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { serviceCharges } from "@/lib/data";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect, useMemo } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Customer } from "@/app/dashboard/customers/page";
import { ReadyMadeStock } from "@/app/dashboard/stock/readymade/page";
import { FabricStock } from "@/app/dashboard/stock/fabric/page";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, doc, getDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Download, Loader2, Receipt, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { InvoicePrintWrapper } from "@/components/dashboard/invoice";
import { MeasurementSlip } from "@/components/dashboard/measurement-slip";

const measurementSchema = z.object({
    shirtLength: z.string().optional(),
    pantLength: z.string().optional(),
    chest: z.string().optional(),
    sleeve: z.string().optional(),
    shoulder: z.string().optional(),
    waist: z.string().optional(),
    hip: z.string().optional(),
    notes: z.string().optional(),
});

const orderSchema = z.object({
  customerType: z.enum(['existing', 'new']),
  customerId: z.string().optional(),
  newCustomerName: z.string().optional(),
  newCustomerPhone: z.string().optional(),
  newCustomerEmail: z.string().email("Invalid email address").optional().or(z.literal('')),
  orderType: z.enum(["stitching", "readymade", "fabric"]),
  deliveryDate: z.string().min(1, "Delivery date is required"),
  
  stitchingService: z.string().optional(),
  measurements: measurementSchema.optional(),
  
  readymadeItemName: z.string().optional(),
  readymadeSize: z.string().optional(),

  fabricId: z.string().optional(),
  fabricLength: z.coerce.number().optional(),

  sellingPrice: z.coerce.number().min(1, "Selling price is required"),
  advance: z.coerce.number().optional().default(0),

}).refine(data => {
    if (data.customerType === 'existing' && !data.customerId) return false;
    return true;
}, {
    message: "Please select an existing customer.",
    path: ['customerId'],
}).refine(data => {
    if (data.customerType === 'new' && (!data.newCustomerName || !data.newCustomerPhone)) return false;
    return true;
}, {
    message: "New customer name and phone are required.",
    path: ['newCustomerName'],
});


type OrderFormValues = z.infer<typeof orderSchema>;

const measurementFields: { [key: string]: Array<keyof z.infer<typeof measurementSchema>> } = {
    'Shirt': ['shirtLength', 'chest', 'sleeve', 'shoulder', 'notes'],
    'Pant': ['pantLength', 'waist', 'hip', 'notes'],
    'Kurta+Pyjama': ['shirtLength', 'chest', 'sleeve', 'shoulder', 'pantLength', 'waist', 'hip', 'notes'],
    'Kurta': ['shirtLength', 'chest', 'sleeve', 'shoulder', 'notes'],
    'Pyjama': ['pantLength', 'waist', 'hip', 'notes'],
    '3pc Suit': ['shirtLength', 'chest', 'sleeve', 'shoulder', 'pantLength', 'waist', 'hip', 'notes'],
    '2pc Suit': ['shirtLength', 'chest', 'sleeve', 'shoulder', 'pantLength', 'waist', 'hip', 'notes'],
    'Blazer': ['shirtLength', 'chest', 'sleeve', 'shoulder', 'notes'],
    'Sherwani': ['shirtLength', 'chest', 'sleeve', 'shoulder', 'notes'],
};

export default function NewOrderPage() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [readyMadeStock, setReadyMadeStock] = useState<ReadyMadeStock[]>([]);
  const [fabricStock, setFabricStock] = useState<FabricStock[]>([]);
  const [orderId, setOrderId] = useState('');
  const [lastSavedOrder, setLastSavedOrder] = useState<any>(null);
  const [dialogs, setDialogs] = useState({
      postOrder: false,
      invoice: false,
      measurementSlip: false
  });

  const generateOrderId = () => {
      const date = new Date();
      const prefix = "ORD-"
      const timestamp = date.getTime();
      setOrderId(`${prefix}${timestamp}`);
  }

  useEffect(() => {
    generateOrderId();
    const unsubCustomers = onSnapshot(collection(db, "customers"), (snapshot) => {
      setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer)));
    });
    const unsubReadyMade = onSnapshot(collection(db, "readyMadeStock"), (snapshot) => {
      setReadyMadeStock(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReadyMadeStock)));
    });
    const unsubFabric = onSnapshot(collection(db, "fabricStock"), (snapshot) => {
      setFabricStock(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FabricStock)));
    });
    
    return () => {
        unsubCustomers();
        unsubReadyMade();
        unsubFabric();
    };
  }, []);

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customerType: 'existing',
      customerId: "",
      newCustomerName: "",
      newCustomerPhone: "",
      newCustomerEmail: "",
      orderType: "stitching",
      deliveryDate: "",
      sellingPrice: 0,
      advance: 0,
      stitchingService: "",
      readymadeItemName: "",
      readymadeSize: "",
      fabricId: "",
      fabricLength: 0,
      measurements: {
        shirtLength: "",
        pantLength: "",
        chest: "",
        sleeve: "",
        shoulder: "",
        waist: "",
        hip: "",
        notes: "",
      }
    },
  });

  const { formState: { isSubmitting }, watch, setValue, getValues } = form;
  const watchedValues = watch();

  const handleFetchMeasurements = async () => {
    const customerId = getValues("customerId");
    if (!customerId) {
        toast({ variant: "destructive", title: "No Customer Selected", description: "Please select a customer first." });
        return;
    }
    const customer = customers.find(c => c.id === customerId);
    if (customer?.measurements) {
        Object.entries(customer.measurements).forEach(([key, value]) => {
            if(value) {
                setValue(`measurements.${key as keyof z.infer<typeof measurementSchema>}`, value);
            }
        });
        toast({ title: "Measurements Fetched", description: `Measurements for ${customer.name} have been loaded.` });
    } else {
        toast({ variant: "destructive", title: "No Measurements Found", description: `No saved measurements for ${customer?.name}.` });
    }
  };


  const onSubmit = async (data: OrderFormValues) => {
    let customerId = data.customerId;
    let customerName = customers.find(c => c.id === customerId)?.name;

    if (data.customerType === 'new' && data.newCustomerName && data.newCustomerPhone) {
        const newCustomerData = {
            name: data.newCustomerName,
            phone: data.newCustomerPhone,
            email: data.newCustomerEmail || '',
        };
        const docRef = await addDoc(collection(db, "customers"), newCustomerData);
        customerId = docRef.id;
        customerName = newCustomerData.name;
    }

    if (!customerId || !customerName) {
        toast({ variant: "destructive", title: "Error", description: "Could not determine customer." });
        return;
    }

    const orderData = {
        orderId,
        customerId,
        customerName,
        ...data,
        status: "In Progress",
        createdAt: new Date(),
    };
    
    // Clean up unnecessary fields
    delete (orderData as any).newCustomerName;
    delete (orderData as any).newCustomerPhone;
    delete (orderData as any).newCustomerEmail;
    delete (orderData as any).customerType;
    
    try {
        await addDoc(collection(db, "orders"), orderData);
        setLastSavedOrder({
            id: orderId,
            customerName: customerName,
            deliveryDate: data.deliveryDate,
            total: data.sellingPrice,
            paid: data.advance || 0,
            balance: data.sellingPrice - (data.advance || 0),
            items: getOrderItems(data),
            measurements: data.measurements
        });
        setDialogs(prev => ({...prev, postOrder: true}));
        toast({ title: "Order Created!", description: `Order ${orderId} has been saved.` });
        form.reset();
        generateOrderId();
    } catch (error) {
        console.error("Error creating order: ", error);
        toast({ variant: "destructive", title: "Error", description: "There was a problem creating the order." });
    }
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };
  
  const getOrderItems = (data: OrderFormValues) => {
      switch(data.orderType) {
        case 'stitching':
            return data.stitchingService || 'Stitching Service';
        case 'readymade':
            return `${data.readymadeItemName} (Size: ${data.readymadeSize})` || 'Ready-made Item';
        case 'fabric':
            return fabricStock.find(f => f.id === data.fabricId)?.type || 'Fabric';
        default:
            return 'N/A';
      }
  }
  
  const uniqueReadyMadeItems = useMemo(() => {
    const itemNames = new Set(readyMadeStock.map(item => item.item));
    return Array.from(itemNames);
  }, [readyMadeStock]);

  const availableSizes = useMemo(() => {
      if (!watchedValues.readymadeItemName) return [];
      return readyMadeStock
        .filter(item => item.item === watchedValues.readymadeItemName && item.quantity > 0)
        .map(item => item.size);
  }, [watchedValues.readymadeItemName, readyMadeStock]);


  const getCustomerName = (receiptData: Partial<OrderFormValues> | null) => {
    if (!receiptData) return 'N/A';
    if (receiptData.customerType === 'new') return receiptData.newCustomerName || 'N/A';
    return customers.find(c => c.id === receiptData.customerId)?.name || "N/A";
  }
  
  const renderMeasurementFields = () => {
      const stitchingService = watchedValues.stitchingService;
      if (!stitchingService || !measurementFields[stitchingService]) return null;
      
      return (
         <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="font-headline">Measurements</CardTitle>
                        <CardDescription>Enter measurements for the {stitchingService}.</CardDescription>
                    </div>
                    {watchedValues.customerType === 'existing' && watchedValues.customerId && (
                        <Button type="button" size="sm" variant="outline" onClick={handleFetchMeasurements}><Download className="mr-2 h-4 w-4"/> Fetch</Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {measurementFields[stitchingService].map(field => 
                    field !== 'notes' ? (
                     <FormField
                        key={field}
                        control={form.control}
                        name={`measurements.${field as keyof z.infer<typeof measurementSchema>}`}
                        render={({ field: formField }) => (
                            <FormItem>
                                <FormLabel className="capitalize">{field.replace(/([A-Z])/g, ' $1')}</FormLabel>
                                <FormControl>
                                    <Input placeholder="..." {...formField} />
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                        />
                    ) : null
                )}
                {measurementFields[stitchingService].includes('notes') && (
                     <div className="col-span-2 md:col-span-4">
                        <FormField
                            control={form.control}
                            name="measurements.notes"
                            render={({ field: formField }) => (
                                <FormItem>
                                    <FormLabel>Special Instructions</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Any special notes or instructions..." {...formField} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                )}
            </CardContent>
         </Card>
      )
  }

  return (
    <div className="space-y-8">
      <PageHeader title="New Order" subtitle="Create a new order and generate a receipt."/>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Customer Details</CardTitle>
              </CardHeader>
               <CardContent className="space-y-4">
                 <FormField
                    control={form.control}
                    name="customerType"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex items-center space-x-4"
                          >
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="existing" />
                              </FormControl>
                              <FormLabel className="font-normal">Existing Customer</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="new" />
                              </FormControl>
                              <FormLabel className="font-normal">New Customer</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {watchedValues.customerType === 'existing' ? (
                     <FormField
                        control={form.control}
                        name="customerId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Select Customer</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder="Select an existing customer" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name} - {c.phone}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <FormField control={form.control} name="newCustomerName" render={({ field }) => (<FormItem><FormLabel>New Customer Name</FormLabel><FormControl><Input placeholder="Enter customer's full name" {...field} /></FormControl><FormMessage/></FormItem>)}/>
                        <FormField control={form.control} name="newCustomerPhone" render={({ field }) => (<FormItem><FormLabel>New Customer Phone</FormLabel><FormControl><Input placeholder="Enter customer's phone number" {...field} /></FormControl><FormMessage/></FormItem>)}/>
                        <div className="md:col-span-2">
                            <FormField control={form.control} name="newCustomerEmail" render={({ field }) => (<FormItem><FormLabel>New Customer Email (Optional)</FormLabel><FormControl><Input placeholder="customer@example.com" {...field} /></FormControl><FormMessage/></FormItem>)}/>
                        </div>
                    </div>
                  )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Order Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <FormField control={form.control} name="deliveryDate" render={({ field }) => (<FormItem><FormLabel>Delivery Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                   <FormField control={form.control} name="orderType" render={({ field }) => (<FormItem><FormLabel>Order Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select the type of order" /></SelectTrigger></FormControl><SelectContent><SelectItem value="stitching">Stitching Service</SelectItem><SelectItem value="readymade">Sell Ready-Made Item</SelectItem><SelectItem value="fabric">Sell Fabric Only</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
                </div>
              </CardContent>
            </Card>
            
            {watchedValues.orderType === 'stitching' && (
                <>
                <Card>
                    <CardHeader><CardTitle className="font-headline">Service & Fabric</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <FormField control={form.control} name="stitchingService" render={({ field }) => (<FormItem><FormLabel>Stitching Service</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a stitching service" /></SelectTrigger></FormControl><SelectContent>{Object.keys(serviceCharges).map((service) => (<SelectItem key={service} value={service}>{service}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)}/>
                         <FormField control={form.control} name="fabricId" render={({ field }) => (<FormItem><FormLabel>Fabric (Optional)</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select fabric from stock" /></SelectTrigger></FormControl><SelectContent>{fabricStock.map(f => <SelectItem key={f.id} value={f.id}>{f.type}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                    </CardContent>
                </Card>
                {renderMeasurementFields()}
                </>
            )}

            {watchedValues.orderType === 'readymade' && (
                <Card>
                    <CardHeader><CardTitle className="font-headline">Ready-Made Item Details</CardTitle></CardHeader>
                     <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <FormField 
                            control={form.control} 
                            name="readymadeItemName" 
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Item</FormLabel>
                                    <Select 
                                        onValueChange={(value) => {
                                            field.onChange(value);
                                            setValue("readymadeSize", ""); // Reset size on item change
                                        }} 
                                        defaultValue={field.value}
                                    >
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select an item" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {uniqueReadyMadeItems.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField 
                            control={form.control} 
                            name="readymadeSize" 
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Size</FormLabel>
                                     <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!watchedValues.readymadeItemName}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a size" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {availableSizes.map(size => <SelectItem key={size} value={size}>{size}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>
            )}

            {watchedValues.orderType === 'fabric' && (
                <Card>
                    <CardHeader><CardTitle className="font-headline">Fabric Sale Details</CardTitle></CardHeader>
                     <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="fabricId" render={({ field }) => (<FormItem><FormLabel>Fabric</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a fabric" /></SelectTrigger></FormControl><SelectContent>{fabricStock.map(f => <SelectItem key={f.id} value={f.id}>{f.type}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                        <FormField control={form.control} name="fabricLength" render={({ field }) => (<FormItem><FormLabel>Length (mtrs)</FormLabel><FormControl><Input type="number" placeholder="Enter length" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    </CardContent>
                </Card>
            )}
            
            <Card>
                <CardHeader><CardTitle>Pricing</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="sellingPrice" render={({ field }) => (<FormItem><FormLabel>Total Selling Price</FormLabel><FormControl><Input type="number" placeholder="Enter final price" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={form.control} name="advance" render={({ field }) => (<FormItem><FormLabel>Advance Paid</FormLabel><FormControl><Input type="number" placeholder="Enter advance amount" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                </CardContent>
            </Card>

          </div>

          <div className="lg:col-span-1">
              <Card className="sticky top-24">
                  <CardHeader>
                      <CardTitle className="font-headline">Order Summary</CardTitle>
                      <CardDescription>Preview of the order details.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 font-mono text-sm">
                      <div className="flex justify-between"><span>Order ID:</span> <span>{orderId}</span></div>
                      <div className="flex justify-between"><span>Customer:</span> <span>{getCustomerName(watchedValues)}</span></div>
                      <div className="flex justify-between"><span>Delivery:</span> <span>{watchedValues.deliveryDate}</span></div>
                      <Separator/>
                      <p className="font-semibold uppercase">{watchedValues.orderType || 'N/A'}</p>
                      
                       {watchedValues.orderType === 'stitching' && watchedValues.stitchingService && (
                            <div className="p-4 bg-muted rounded-md whitespace-pre-wrap">
                                <p className="font-sans font-semibold pb-2">{watchedValues.stitchingService}</p>
                                {watchedValues.measurements && Object.entries(watchedValues.measurements).map(([key, value]) => value && (
                                   <div key={key} className="flex justify-between text-xs">
                                       <span className="capitalize text-muted-foreground">{key.replace(/([A-Z])/g, ' $1')}:</span>
                                       <span>{value}</span>
                                   </div>
                                ))}
                            </div>
                       )}
                       {watchedValues.orderType === 'readymade' && (
                           <div className="p-4 bg-muted rounded-md">
                               <p>{watchedValues.readymadeItemName}</p>
                               <p className="text-xs">Size: {watchedValues.readymadeSize}</p>
                           </div>
                       )}
                        {watchedValues.orderType === 'fabric' && (
                           <div className="p-4 bg-muted rounded-md">
                               <p>{fabricStock.find(f => f.id === watchedValues.fabricId)?.type}</p>
                               <p className="text-xs">Length: {watchedValues.fabricLength} mtrs</p>
                           </div>
                       )}

                       <Separator/>
                      <div className="space-y-2">
                        <div className="flex justify-between font-bold"><span>Total Bill:</span> <span>{formatCurrency(watchedValues.sellingPrice || 0)}</span></div>
                         <div className="flex justify-between"><span>Advance:</span> <span>{formatCurrency(watchedValues.advance || 0)}</span></div>
                        <div className="flex justify-between text-destructive font-bold"><span>Balance:</span> <span>{formatCurrency((watchedValues.sellingPrice || 0) - (watchedValues.advance || 0))}</span></div>
                      </div>
                      <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin" /> : "Save & Generate Receipt"}
                      </Button>
                  </CardContent>
              </Card>
          </div>
        </form>
      </Form>
      
      {lastSavedOrder && (
          <>
            <Dialog open={dialogs.postOrder} onOpenChange={(open) => setDialogs(p => ({...p, postOrder: open}))}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Order Created Successfully!</DialogTitle>
                        <DialogDescription>
                            Order #{lastSavedOrder.id} has been saved. What would you like to do next?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:justify-center">
                        <Button variant="outline" onClick={() => setDialogs(p => ({...p, measurementSlip: true}))}>
                            <Receipt className="mr-2 h-4 w-4"/> Measurement Slip
                        </Button>
                        <Button onClick={() => setDialogs(p => ({...p, invoice: true}))}>
                            <FileText className="mr-2 h-4 w-4"/> Full Invoice
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={dialogs.invoice} onOpenChange={(open) => setDialogs(p => ({...p, invoice: open}))}>
                <DialogContent className="max-w-3xl p-0">
                    <InvoicePrintWrapper order={lastSavedOrder} />
                </DialogContent>
            </Dialog>

            <Dialog open={dialogs.measurementSlip} onOpenChange={(open) => setDialogs(p => ({...p, measurementSlip: open}))}>
                 <MeasurementSlip order={lastSavedOrder}/>
            </Dialog>
        </>
      )}

    </div>
  );
}
