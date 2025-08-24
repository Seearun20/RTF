
"use client";

import {
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { RtfLogo } from "../rtf-logo";
import { Separator } from "../ui/separator";

interface MeasurementSlipProps {
    order: {
        id: string;
        customerName: string;
        deliveryDate: string;
        measurements?: {
            [key: string]: string | undefined;
        };
    };
}

export function MeasurementSlip({ order }: MeasurementSlipProps) {
    if (!order.measurements || Object.values(order.measurements).every(v => !v || v.trim() === '')) {
        return (
             <DialogContent>
                <DialogHeader>
                    <DialogTitle>No Measurements Recorded</DialogTitle>
                    <DialogDescription>There are no measurements recorded for order #{order.id}.</DialogDescription>
                </DialogHeader>
             </DialogContent>
        )
    }
    
    const handlePrint = () => {
        const printContent = document.getElementById('measurement-slip-content');
        if(printContent) {
            const printableArea = printContent.innerHTML;
            const printWindow = window.open('', '_blank');
            printWindow?.document.write(`
                <html>
                    <head>
                        <title>Measurement Slip - ${order.id}</title>
                        <style>
                            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Literata:wght@400;700&display=swap');
                            
                            body { 
                                font-family: 'Literata', serif;
                                margin: 0;
                                padding: 0;
                                -webkit-print-color-adjust: exact; 
                            }
                            .slip-container {
                                width: 302px; /* Approx 80mm thermal receipt paper width */
                                padding: 16px;
                                box-sizing: border-box;
                                color: #000;
                            }
                            .slip-header {
                                text-align: center;
                                margin-bottom: 16px;
                            }
                            .slip-header .logo {
                                font-family: 'Playfair Display', serif;
                                font-weight: bold;
                                font-size: 1.5rem;
                                color: #fff;
                                background-color: #4A0082;
                                width: 48px;
                                height: 48px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                border-radius: 8px;
                                margin: 0 auto;
                            }
                            .slip-header h1 {
                                font-family: 'Playfair Display', serif;
                                font-size: 1.25rem;
                                margin: 8px 0 4px;
                                color: #4B0082;
                            }
                            .slip-header p {
                                font-size: 0.8rem;
                                margin: 0;
                                color: #555;
                            }
                            .slip-separator {
                                border-top: 1px dashed #888;
                                margin: 16px 0;
                            }
                            .measurement-grid {
                                display: grid;
                                grid-template-columns: 1fr 1fr;
                                gap: 8px 16px;
                                font-size: 0.9rem;
                                font-family: monospace;
                            }
                            .measurement-item {
                                display: flex;
                                justify-content: space-between;
                                border-bottom: 1px dotted #ccc;
                                padding-bottom: 4px;
                            }
                            .measurement-item .label {
                                text-transform: capitalize;
                                color: #333;
                            }
                             .measurement-item .value {
                                font-weight: bold;
                            }
                            .notes-section {
                                margin-top: 16px;
                            }
                            .notes-section .notes-title {
                                text-transform: uppercase;
                                font-size: 0.75rem;
                                font-weight: bold;
                                color: #333;
                                letter-spacing: 0.5px;
                                margin-bottom: 4px;
                            }
                            .notes-section .notes-content {
                                font-size: 0.85rem;
                                white-space: pre-wrap;
                                background-color: #f7f7f7;
                                padding: 8px;
                                border-radius: 4px;
                            }
                            .slip-footer {
                                margin-top: 16px;
                                text-align: center;
                                font-size: 0.8rem;
                                color: #555;
                            }
                            @page {
                                size: 80mm auto;
                                margin: 0;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="slip-container">
                            ${printableArea}
                        </div>
                    </body>
                </html>
            `);
            // A delay to ensure stylesheet loads
            setTimeout(() => {
                printWindow?.document.close();
                printWindow?.focus();
                printWindow?.print();
                printWindow?.close();
            }, 250);
        }
    }

  return (
    <DialogContent className="sm:max-w-sm">
        <DialogHeader className="print:hidden">
            <DialogTitle>Measurement Slip</DialogTitle>
            <DialogDescription>
                A printable slip with customer measurements for the tailor.
            </DialogDescription>
        </DialogHeader>
        <div id="measurement-slip-content">
            <div className="slip-header text-center mb-4">
                <RtfLogo className="w-12 h-12 text-lg mx-auto" />
                <h1 className="font-headline text-xl font-bold text-primary mt-2">Measurement Slip</h1>
                <p className="text-sm text-muted-foreground">Order #{order.id}</p>
            </div>
            <Separator className="my-4"/>
            <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between"><span className="font-semibold">Customer:</span><span>{order.customerName}</span></div>
                <div className="flex justify-between"><span className="font-semibold">Delivery:</span><span>{order.deliveryDate}</span></div>
            </div>

            <div className="measurement-grid grid grid-cols-2 gap-x-8 gap-y-2 font-mono text-sm">
                {Object.entries(order.measurements).map(([key, value]) => value && key !== 'notes' && (
                    <div key={key} className="measurement-item flex justify-between border-b pb-1">
                        <span className="label capitalize text-muted-foreground">{key.replace(/([A-Z])/g, ' $1')}:</span>
                        <span className="value font-bold">{value}</span>
                    </div>
                ))}
            </div>
            {order.measurements.notes && (
                <div className="notes-section mt-4">
                    <p className="notes-title text-muted-foreground font-sans uppercase text-xs tracking-wider">Notes</p>
                    <Separator className="my-1"/>
                    <p className="notes-content whitespace-pre-wrap font-sans text-sm bg-muted p-2 rounded-md">{order.measurements.notes}</p>
                </div>
            )}
        </div>
      <DialogFooter className="mt-6 sm:justify-start print:hidden">
          <Button onClick={handlePrint} className="w-full">
              <Printer className="mr-2 h-4 w-4"/> Print Slip
          </Button>
      </DialogFooter>
    </DialogContent>
  );
}
