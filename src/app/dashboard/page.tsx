

"use client";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, ShoppingBag, TrendingUp, UserPlus, Package, Scissors, TrendingDown } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { Order } from "./orders/page";
import { ReadyMadeStock } from "./stock/readymade/page";
import { FabricStock } from "./stock/fabric/page";

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
};


export default function DashboardPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [readyMadeStock, setReadyMadeStock] = useState<ReadyMadeStock[]>([]);
    const [fabricStock, setFabricStock] = useState<FabricStock[]>([]);
    const [financials, setFinancials] = useState({
        totalSales: 0,
        totalPurchases: 0,
        totalProfit: 0,
        newOrdersThisMonth: 0,
        purchasesThisMonth: 0,
        profitThisMonth: 0,
    });
    const [salesData, setSalesData] = useState<any[]>([]);

    useEffect(() => {
        const unsubOrders = onSnapshot(query(collection(db, "orders"), orderBy("createdAt", "desc")), (snapshot) => {
            const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as Order));
            setOrders(ordersData);
        });

        const unsubReadyMade = onSnapshot(collection(db, "readyMadeStock"), (snapshot) => {
            const stockData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReadyMadeStock));
            setReadyMadeStock(stockData);
        });

        const unsubFabric = onSnapshot(collection(db, "fabricStock"), (snapshot) => {
            const fabricData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FabricStock));
            setFabricStock(fabricData);
        });

        return () => {
            unsubOrders();
            unsubReadyMade();
            unsubFabric();
        }
    }, []);

    useEffect(() => {
        // --- Overall Financials ---
        const totalSales = orders.reduce((sum, order) => sum + Number(order.sellingPrice || 0), 0);
        
        // This calculates the total value of all stock items ever created, which represents total purchases.
        // It's assumed that when a stock item is added, its full cost is recorded.
        const readyMadePurchases = readyMadeStock.reduce((sum, item) => sum + (Number(item.cost || 0) * Number(item.quantity || 0)), 0);
        const fabricPurchases = fabricStock.reduce((sum, item) => sum + (Number(item.costPerMtr || 0) * Number(item.length || 0)), 0);
        const totalPurchases = readyMadePurchases + fabricPurchases;
        
        const totalProfit = totalSales - totalPurchases;

        // --- Monthly Financials ---
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const ordersThisMonth = orders.filter(order => {
            if (!order.createdAt || typeof order.createdAt.toDate !== 'function') return false;
            const orderDate = order.createdAt.toDate();
            return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
        });

        const newOrdersThisMonth = ordersThisMonth.length;
        const salesThisMonth = ordersThisMonth.reduce((sum, order) => sum + Number(order.sellingPrice || 0), 0);

        // For monthly purchases, we assume new stock items have a "createdAt" field.
        // If not, this will only calculate purchases for items with that field.
        // A more robust system would have a dedicated 'purchases' collection.
        const readyMadePurchasesThisMonth = readyMadeStock
            .filter(item => {
                // @ts-ignore
                if (!item.createdAt || typeof item.createdAt.toDate !== 'function') return false;
                 // @ts-ignore
                const itemDate = item.createdAt.toDate();
                return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
            })
            .reduce((sum, item) => sum + (Number(item.cost || 0) * Number(item.quantity || 0)), 0);

        const fabricPurchasesThisMonth = fabricStock
            .filter(item => {
                 // @ts-ignore
                if (!item.createdAt || typeof item.createdAt.toDate !== 'function') return false;
                 // @ts-ignore
                const itemDate = item.createdAt.toDate();
                return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
            })
            .reduce((sum, item) => sum + (Number(item.costPerMtr || 0) * Number(item.length || 0)), 0);

        const purchasesThisMonth = readyMadePurchasesThisMonth + fabricPurchasesThisMonth;
        const profitThisMonth = salesThisMonth - purchasesThisMonth;

        setFinancials({ totalSales, totalPurchases, totalProfit, newOrdersThisMonth, purchasesThisMonth, profitThisMonth });

        // --- Chart Data ---
        const monthlySales: { [key: string]: number } = {};
        orders.forEach(order => {
             if (!order.createdAt || typeof order.createdAt.toDate !== 'function') {
                return;
            }
            const date = order.createdAt.toDate();
            const month = date.toLocaleString('default', { month: 'short' });
            if (monthlySales[month]) {
                monthlySales[month] += Number(order.sellingPrice || 0);
            } else {
                monthlySales[month] = Number(order.sellingPrice || 0);
            }
        });

        const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const chartData = monthOrder.map(month => ({
            month,
            sales: monthlySales[month] || 0
        }));

        setSalesData(chartData);

    }, [orders, readyMadeStock, fabricStock]);

    const recentOrders = orders.slice(0, 5);


  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard" subtitle="Welcome back, Raghav!" />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <Card className="shadow-lg xl:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground text-accent" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">
                    {formatCurrency(financials.totalSales)}
                </div>
                <p className="text-xs text-muted-foreground">Across all orders</p>
                </CardContent>
            </Card>
            <Card className="shadow-lg xl:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground text-accent" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">
                    {formatCurrency(financials.totalPurchases)}
                </div>
                <p className="text-xs text-muted-foreground">Total historical stock cost</p>
                </CardContent>
            </Card>
            <Card className="shadow-lg xl:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground text-accent" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">
                    {formatCurrency(financials.totalProfit)}
                </div>
                <p className="text-xs text-muted-foreground">Sales minus purchases</p>
                </CardContent>
            </Card>
            <Card className="shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Orders</CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground text-accent" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">+{financials.newOrdersThisMonth}</div>
                <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
            </Card>
            <Card className="shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Purchases</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground text-accent" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(financials.purchasesThisMonth)}</div>
                <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
            </Card>
             <Card className="shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Profit</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground text-accent" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(financials.profitThisMonth)}</div>
                <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
            </Card>
        </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline">Sales Overview</CardTitle>
                    <CardDescription>A summary of your monthly sales revenue.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                    <ChartContainer config={{ sales: { label: "Sales", color: "hsl(var(--primary))" } }} className="h-full w-full">
                        <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={salesData} accessibilityLayer>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="month" tickLine={false} axisLine={false} />
                            <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value / 1000}K`} />
                            <ChartTooltip cursor={{ fill: 'hsl(var(--accent) / 0.2)' }} content={<ChartTooltipContent />} />
                            <Bar dataKey="sales" fill="var(--color-sales)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Recent Orders</CardTitle>
            <CardDescription>Your 5 most recent orders.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div className="font-medium">{order.customerName}</div>
                      <div className="text-sm text-muted-foreground">
                        #{order.invoiceNumber}
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(order.sellingPrice)}</TableCell>
                    <TableCell>
                       <Badge
                        variant={
                          order.status === "Delivered"
                            ? "secondary"
                            : "outline"
                        }
                        className="capitalize"
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
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
