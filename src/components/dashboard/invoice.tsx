
"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RtfLogo } from "@/components/rtf-logo";
import { Button } from "../ui/button";
import { Printer } from "lucide-react";
import React from "react";

interface InvoiceProps {
    order: {
        id: string; 
        orderId?: string; // Kept for cases where it might still be passed
        invoiceNumber: number;
        customerName: string;
        deliveryDate: string;
        total: number;
        paid: number;
        balance: number;
        items: string;
    };
}

export const Invoice = React.forwardRef<HTMLDivElement, InvoiceProps>(({ order }, ref) => {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
        }).format(amount);
    };

    return (
        <div ref={ref} className="p-8 print:p-0">
            <Card className="print:shadow-none print:border-none">
                <CardHeader className="space-y-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <RtfLogo className="w-16 h-16 text-primary" />
                            <h1 className="text-2xl font-bold font-headline mt-2">Raghav Tailors & Fabrics</h1>
                            <p className="text-muted-foreground text-sm">Dineshpur Main Market 263150, U.S.Nagar Uttarakhand, India</p>
                             <p className="text-muted-foreground text-sm">Ph: 8766877348</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-3xl font-bold text-primary font-headline">Invoice</h2>
                            <p className="text-muted-foreground">#{order.invoiceNumber}</p>
                            <p>Date: {new Date().toLocaleDateString()}</p>
                        </div>
                    </div>
                     <Separator />
                    <div>
                        <h3 className="font-semibold">Bill To:</h3>
                        <p>{order.customerName}</p>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-4 font-semibold py-2 bg-muted rounded-t-lg">
                        <div className="col-span-2 p-2">Item Description</div>
                        <div className="p-2 text-right">Rate</div>
                        <div className="p-2 text-right">Amount</div>
                    </div>
                     <div className="grid grid-cols-4 border-b">
                        <div className="col-span-2 p-2">{order.items}</div>
                        <div className="p-2 text-right">{formatCurrency(order.total)}</div>
                        <div className="p-2 text-right">{formatCurrency(order.total)}</div>
                    </div>
                    <div className="grid grid-cols-4 mt-4">
                        <div className="col-span-3 text-right font-semibold p-2">Subtotal</div>
                        <div className="text-right p-2">{formatCurrency(order.total)}</div>
                    </div>
                     <div className="grid grid-cols-4">
                        <div className="col-span-3 text-right font-semibold p-2">Advance Paid</div>
                        <div className="text-right p-2">{formatCurrency(order.paid)}</div>
                    </div>
                     <Separator />
                      <div className="grid grid-cols-4">
                        <div className="col-span-3 text-right font-bold p-2 text-lg">Balance Due</div>
                        <div className="text-right p-2 font-bold text-lg">{formatCurrency(order.balance)}</div>
                    </div>
                </CardContent>
                <CardFooter className="flex-col items-start gap-4 p-8 pt-0 print:p-8">
                     <div className="text-sm text-muted-foreground">
                        <p className="font-semibold">Terms & Conditions</p>
                        <ul className="list-disc list-inside">
                            <li>Goods once sold will not be taken back.</li>
                            <li>Delivery by: {order.deliveryDate}</li>
                            <li>Alterations will be charged extra.</li>
                        </ul>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
});
Invoice.displayName = "Invoice";

export function InvoicePrintWrapper({ order }: InvoiceProps) {
    const componentRef = React.useRef(null);
    
    const handlePrint = async () => {
        const printContent = (componentRef.current as HTMLDivElement | null)?.innerHTML;
        if (printContent) {
            try {
                // Fetch the content of globals.css
                const cssResponse = await fetch('/globals.css');
                const cssText = await cssResponse.text();

                const printWindow = window.open('', '_blank');
                if (!printWindow) {
                    alert('Please allow popups for this website');
                    return;
                }
                
                printWindow.document.write(`
                    <html>
                        <head>
                            <title>Print Invoice #${order.invoiceNumber}</title>
                            <style>
                                ${cssText}
                                @media print {
                                    body { -webkit-print-color-adjust: exact; padding: 1rem; }
                                    .print\\:p-0 { padding: 0 !important; }
                                    .print\\:shadow-none { box-shadow: none !important; }
                                    .print\\:border-none { border: none !important; }
                                }
                            </style>
                        </head>
                        <body>${printContent}</body>
                    </html>
                `);

                setTimeout(() => {
                    printWindow.document.close();
                    printWindow.focus();
                    printWindow.print();
                    printWindow.close();
                }, 250);

            } catch (error) {
                console.error("Failed to fetch styles for printing:", error);
                // Fallback for printing without styles if CSS fetch fails
                const printWindow = window.open('', '_blank');
                printWindow?.document.write(printContent);
                printWindow?.document.close();
                printWindow?.print();
            }
        }
    };
    
    return (
        <div className="max-h-[80vh] overflow-y-auto">
            <Invoice ref={componentRef} order={order} />
            <div className="p-6 pt-0 print:hidden sticky bottom-0 bg-background/80 backdrop-blur-sm">
                 <Button onClick={handlePrint} className="w-full">
                    <Printer className="mr-2"/>
                    Print Invoice
                </Button>
            </div>
        </div>
    )
}
