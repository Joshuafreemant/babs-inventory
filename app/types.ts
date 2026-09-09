export type Category = "bottle" | "syrup" | "jar" | "pump" | "tube" | "dropper";

export interface Product {
  id: string;
  name: string;
  category: Category;
  boxesPerCarton: number;
  price: number;
  stock: number;
  lowStockThreshold: number;
  forceLowStock: boolean;
  backorder: boolean;
  imageUrl?: string;
}

export interface TrackedOrder {
  code: string;
  items: string;
  total: number;
  status: string;
  statusLabel: string;
  createdAt: string;
}

export interface ConsoleOrder {
  id: string;
  code: string;
  customerName: string;
  phone: string;
  email: string;
  items: { name: string; qty: number; unitPrice: number; lineTotal: number; backordered: boolean }[];
  itemsSummary: string;
  total: number;
  method: "stand" | "transfer";
  status: string;
  hasBackorder: boolean;
  refSource: string;
  createdAt: string;
}

export interface ConsoleStats {
  ordersTotal: number;
  reservedAtStand: number;
  awaitingTransferAmount: number;
  outstandingAmount: number;
}

export interface StaffSession {
  id: string;
  name: string;
  staffId: string;
  role: "rep" | "admin";
}

export interface PlacedOrder {
  id: string;
  code: string;
  total: number;
  method: "stand" | "transfer";
  methodLabel: string;
  hasBackorder: boolean;
}

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: "bottle", label: "Tablets / capsules bottle" },
  { id: "syrup", label: "Syrup bottle" },
  { id: "jar", label: "Jar / tub" },
  { id: "pump", label: "Pump bottle" },
  { id: "tube", label: "Tube" },
  { id: "dropper", label: "Dropper bottle" },
];

export const CARTON_PRESETS = [12, 20, 24, 30, 36, 48, 60];
