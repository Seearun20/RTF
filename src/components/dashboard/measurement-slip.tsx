
import {
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Order } from "@/lib/data";
import { Printer } from "lucide-react";
import { StitchSavvyLogo } from "../stitch-savvy-logo";
import { Separator } from "../ui/separator";

interface MeasurementSlipProps {
    order: Order;
}

export function MeasurementSlip({ order }: MeasurementSlipProps) {
    if (!order.measurements || Object.values(order.measurements).every(v => !v)) {
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
        const originalContents = document.body.innerHTML;
        if(printContent) {
            document.body.innerHTML = printContent.innerHTML;
            window.print();
            document.body.innerHTML = originalContents;
            window.location.reload();
        }
    }

  return (
    <DialogContent>
        <div id="measurement-slip-content">
            <DialogHeader className="text-left">
                <div className="flex items-center gap-4">
                    <StitchSavvyLogo className="w-12 h-12 text-primary" />
                    <div>
                        <DialogTitle className="font-headline text-2xl">Measurement Slip</DialogTitle>
                        <DialogDescription>Order #{order.id} for {order.customerName}</DialogDescription>
                    </div>
                </div>
            </DialogHeader>
            <div className="font-mono text-sm space-y-2 py-4">
                <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                    {Object.entries(order.measurements).map(([key, value]) => value && key !== 'notes' && (
                        <div key={key} className="flex justify-between border-b pb-1">
                            <span className="capitalize text-muted-foreground">{key.replace(/([A-Z])/g, ' $1')}:</span>
                            <span className="font-bold">{value}</span>
                        </div>
                    ))}
                </div>
                {order.measurements.notes && (
                    <div className="pt-4">
                        <p className="text-muted-foreground font-sans uppercase text-xs tracking-wider">Notes</p>
                        <Separator className="my-1"/>
                        <p className="whitespace-pre-wrap">{order.measurements.notes}</p>
                    </div>
                )}
            </div>
            <p className="text-xs text-muted-foreground text-center">Delivery Date: {order.deliveryDate}</p>
        </div>
      <DialogFooter className="mt-4">
          <Button onClick={handlePrint} className="w-full">
              <Printer className="mr-2"/> Print Slip
          </Button>
      </DialogFooter>
    </DialogContent>
  );
}


    