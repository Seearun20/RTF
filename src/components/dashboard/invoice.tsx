
"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RtfLogo } from "@/components/rtf-logo";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import React from "react";

interface InvoiceProps {
    order: {
        id: string; 
        orderId?: string;
        invoiceNumber: number;
        customerName: string;
        deliveryDate: string;
        total: number;
        paid: number;
        balance: number;
        items: string;
    };
}

class InvoiceToPrint extends React.Component<InvoiceProps> {
    render() {
        const { order } = this.props;
        const formatCurrency = (amount: number) => {
            return new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
            }).format(amount);
        };

        return (
            <div className="p-8 print:p-0 bg-background text-foreground">
                <div className="max-w-4xl mx-auto p-8 rounded-lg shadow-lg bg-card border print:shadow-none print:border-none">
                    <header className="flex justify-between items-center pb-6 border-b">
                        <div>
                            <RtfLogo className="w-16 h-16 text-primary" />
                            <h1 className="text-3xl font-bold font-headline mt-2 text-primary">Raghav Tailors & Fabrics</h1>
                            <p className="text-muted-foreground">Dineshpur Main Market 263150, U.S.Nagar Uttarakhand, India</p>
                            <p className="text-muted-foreground">Ph: 8766877348</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-4xl font-bold font-headline text-muted-foreground tracking-widest uppercase">Invoice</h2>
                            <p className="text-muted-foreground mt-1"># {order.invoiceNumber}</p>
                            <p className="mt-1">Date: {new Date().toLocaleDateString()}</p>
                        </div>
                    </header>

                    <section className="mt-8">
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <h3 className="font-semibold text-muted-foreground mb-2">Bill To:</h3>
                                <p className="font-bold text-lg">{order.customerName}</p>
                            </div>
                            <div className="text-right">
                                <h3 className="font-semibold text-muted-foreground mb-2">Delivery Date:</h3>
                                <p className="font-bold text-lg">{order.deliveryDate}</p>
                            </div>
                        </div>
                    </section>

                    <section className="mt-8">
                        <div className="w-full overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-muted text-left text-muted-foreground uppercase text-sm">
                                        <th className="p-3 font-semibold">Item Description</th>
                                        <th className="p-3 text-right font-semibold">Rate</th>
                                        <th className="p-3 text-right font-semibold">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b">
                                        <td className="p-3">{order.items}</td>
                                        <td className="p-3 text-right">{formatCurrency(order.total)}</td>
                                        <td className="p-3 text-right">{formatCurrency(order.total)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className="mt-8 flex justify-end">
                        <div className="w-full max-w-xs space-y-4">
                            <div className="flex justify-between font-medium">
                                <span>Subtotal</span>
                                <span>{formatCurrency(order.total)}</span>
                            </div>
                            <div className="flex justify-between font-medium">
                                <span>Advance Paid</span>
                                <span>{formatCurrency(order.paid)}</span>
                            </div>
                            <Separator/>
                            <div className="flex justify-between font-bold text-lg text-primary">
                                <span>Balance Due</span>
                                <span>{formatCurrency(order.balance)}</span>
                            </div>
                        </div>
                    </section>

                    <footer className="mt-12 pt-6 border-t">
                        <h3 className="font-semibold text-muted-foreground mb-2">Terms & Conditions</h3>
                        <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                            <li>Goods once sold will not be taken back.</li>
                            <li>Delivery by: {order.deliveryDate}</li>
                            <li>Alterations will be charged extra.</li>
                            <li>Please bring this invoice at the time of delivery.</li>
                        </ul>
                    </footer>
                </div>
            </div>
        )
    }
}


export function InvoicePrintWrapper({ order }: InvoiceProps) {
    const componentRef = React.useRef<InvoiceToPrint>(null);
    
    const handlePrint = () => {
        const printWindow = window.open('', '', 'height=800,width=1200');
        if (printWindow && componentRef.current) {
            const printContent = componentRef.current;
            const styles = Array.from(document.styleSheets)
                .map(s => Array.from(s.cssRules).map(r => r.cssText).join('\n'))
                .join('\n');
            
            const contentEl = document.createElement('div');
            const ReactDOMServer = require('react-dom/server');
            contentEl.innerHTML = ReactDOMServer.renderToString(
              <InvoiceToPrint order={order} />
            );


            printWindow.document.write('<html><head><title>Print Invoice</title>');
            printWindow.document.write('<style>');
            printWindow.document.write(styles);
            printWindow.document.write('</style></head><body>');
            printWindow.document.write(contentEl.innerHTML);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 250);
        }
    };
    
    return (
        <div className="max-h-[80vh] overflow-y-auto">
            <div className="hidden">
                 <InvoiceToPrint ref={componentRef} order={order} />
            </div>
            <div className="p-6 pt-0 print:hidden sticky bottom-0 bg-background/80 backdrop-blur-sm">
                 <Button onClick={handlePrint} className="w-full">
                    <Printer className="mr-2"/>
                    Print Invoice
                </Button>
            </div>
            {/* The visible component for the user to see */}
            <div className="p-8">
                 <InvoiceToPrint order={order} />
            </div>
        </div>
    )
}
