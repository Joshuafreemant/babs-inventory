import type { Product, DirectSale, DistribDeal, InstitutionalSale, PersonalPurchase, PersonalSale } from "./types";


// export const initialDistribDeals: DistribDeal[] = [
//   { id: 1, productId: 3, productName: "Ibuprofen 400mg", distributor: "PharmCare Ltd", qty: 30, upfrontPayment: 20000, balancePayment: 25000, total: 45000, balancePaid: false, saleDate: "2026-04-20" },
//   { id: 2, productId: 4, productName: "Lisinopril 10mg", distributor: "HealthFirst Dist", qty: 15, upfrontPayment: 35000, balancePayment: 25000, total: 60000, balancePaid: true, saleDate: "2026-03-15" },
// ];

// export const initialInstitutional: InstitutionalSale[] = [
//   { id: 1, productId: 2, productName: "Paracetamol 500mg", institution: "UCH Ibadan", qty: 20, unitPrice: 1100, total: 22000, paid: false, saleDate: "2026-03-05", dueDate: "2026-05-05", status: "overdue" },
//   { id: 2, productId: 4, productName: "Lisinopril 10mg", institution: "LUTH Lagos", qty: 5, unitPrice: 3600, total: 18000, paid: false, saleDate: "2026-04-10", dueDate: "2026-06-10", status: "active" },
//   { id: 3, productId: 5, productName: "Omeprazole 20mg", institution: "Agodi Hospital", qty: 8, unitPrice: 3200, total: 25600, paid: true, saleDate: "2026-02-01", dueDate: "2026-04-01", status: "paid" },
// ];

// export const initialPersonalPurchases: PersonalPurchase[] = [
//   { id: 1, productId: 1, productName: "Amoxicillin 500mg", qty: 3, unitPrice: 1800, total: 5400, purchaseDate: "2026-04-15" },
//   { id: 2, productId: 2, productName: "Paracetamol 500mg", qty: 5, unitPrice: 950, total: 4750, purchaseDate: "2026-04-20" },
// ];

// export const initialPersonalSales: PersonalSale[] = [
//   { id: 1, productId: 1, productName: "Amoxicillin 500mg", buyer: "St. Mary's Pharmacy", buyerType: "pharmacy", qty: 2, unitPrice: 2200, total: 4400, paid: true, saleDate: "2026-04-22" },
//   { id: 2, productId: 2, productName: "Paracetamol 500mg", buyer: "City Medical Center", buyerType: "hospital", qty: 3, unitPrice: 1250, total: 3750, paid: false, saleDate: "2026-05-01" },
// ];


export const navItems = [
  { id: "dashboard", label: "Dashboard", icon: "ti-layout-dashboard" },
  { id: "inventory", label: "Inventory", icon: "ti-package" },
  { id: "personal", label: "Personal", icon: "ti-briefcase" },
] as const;

export const businessSubItems = [
  { id: "direct", label: "Direct Sales", icon: "ti-shopping-cart" },
  { id: "distributor", label: "Distributor", icon: "ti-users" },
  { id: "institutional", label: "Institutional", icon: "ti-building-hospital" },
] as const;

export const statusColors = {
  paid: "bg-green-100 text-green-800",
  active: "bg-blue-100 text-blue-800",
  overdue: "bg-red-100 text-red-800",
  hospital: "bg-purple-100 text-purple-800",
  pharmacy: "bg-teal-100 text-teal-800",
};

export const daysLeft = (dueDate: string): number => {
  const due = new Date(dueDate);
  const today = new Date();
  const diff = due.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const formatCurrency = (amount: number): string => {
  return `₦${amount.toLocaleString()}`;
};
