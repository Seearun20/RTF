
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
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { ReadyMadeStock } from "./readymade/page";
import { FabricStock } from "./fabric/page";

export default function StockOverviewPage() {
  const [readyMadeStock, setReadyMadeStock] = useState<ReadyMadeStock[]>([]);
  const [fabricStock, setFabricStock] = useState<FabricStock[]>([]);

  useEffect(() => {
    const unsubReadyMade = onSnapshot(collection(db, "readyMadeStock"), (snapshot) => {
      setReadyMadeStock(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReadyMadeStock)));
    });

    const unsubFabric = onSnapshot(collection(db, "fabricStock"), (snapshot) => {
      setFabricStock(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FabricStock)));
    });

    return () => {
      unsubReadyMade();
      unsubFabric();
    };
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Stock Overview"
        subtitle="A consolidated view of your entire inventory."
      />
      <div className="space-y-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Ready-Made Stock</CardTitle>
                <CardDescription>
                Manage your sherwanis, suits, and blazers.
                </CardDescription>
            </div>
            <Link href="/dashboard/stock/readymade" passHref>
                <Button variant="outline">
                    <PlusCircle className="mr-2 h-4 w-4" /> Manage Ready-Made
                </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Cost Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {readyMadeStock.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium flex items-center gap-4">
                      {item.imageUrl && <img src={item.imageUrl} alt={item.item} className="w-12 h-12 object-cover rounded-md"/>}
                      <span>{item.item}</span>
                    </TableCell>
                    <TableCell>{item.size}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{formatCurrency(item.cost)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Fabric Stock</CardTitle>
                <CardDescription>
                Manage your fabric inventory.
                </CardDescription>
            </div>
             <Link href="/dashboard/stock/fabric" passHref>
                <Button variant="outline">
                    <PlusCircle className="mr-2 h-4 w-4" /> Manage Fabric
                </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fabric Type</TableHead>
                  <TableHead>Length (mtrs)</TableHead>
                  <TableHead>Cost/mtr</TableHead>
                  <TableHead>Supplier</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fabricStock.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.type}</TableCell>
                    <TableCell>{item.length}</TableCell>
                    <TableCell>{formatCurrency(item.costPerMtr)}</TableCell>
                    <TableCell>{item.supplier}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
