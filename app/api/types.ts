// Core business entities
export interface Customer {
  _id?: string;
  id?: number;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  _id?: string;
  id?: number;
  name: string;
  category?: string;
  unitPrice?: number;
  instPrice?: number;
  price?: number;
  cartonQty?: number;
  stock: number;
  expiryDate?: string | null;
  [key: string]: any;
}

export interface DirectSale {
  _id?: string;
  id?: number;
  productId: string | number | { _id: string; name: string };
  customerId?: string | { _id: string; name: string };
  productName?: string;
  customer?: string;
  qty: number;
  unitPrice?: number;
  price?: number;
  total: number;
  paid: boolean;
  saleDate: string;
  [key: string]: any;
}

export interface DirectSaleForm {
  productId: string;
  customerId: string;
  qty: number;
  price: number;
  saleDate?: string;
}

export interface DistribDeal {
  _id?: string;
  id?: number;
  productId: string | number | { _id: string; name: string };
  productName?: string;
  distributor: string;
  qty: number;
  upfrontPayment: number;
  balancePayment: number;
  total: number;
  balancePaid: boolean;
  saleDate: string;
  [key: string]: any;
  distributorId: string;  
  unitPrice: number;   
}

export interface DistribDealForm {
  productId: string;
  distributor: string;
  qty: number;
  upfrontPayment: number;
}

export interface InstitutionalSale {
  _id?: string;
  id?: number;
  productId: string | number | { _id: string; name: string };
  productName?: string;
  institution: string;
  qty: number;
  unitPrice?: number;
  total: number;
  paid: boolean;
  saleDate: string;
  dueDate?: string;
  status?: "paid" | "active" | "overdue";
  [key: string]: any;
  institutionId: string;
  
}

export interface InstitutionalForm {
  productId: string;
  institution: string;
  qty: number;
  dueDate: string;

}

export interface PersonalPurchase {
  _id?: string;
  id?: number;
  productId: string | number | { _id: string; name: string };
  productName?: string;
  qty: number;
  unitPrice?: number;
  total: number;
  purchaseDate: string;
  [key: string]: any;
  
}

export interface PersonalPurchaseForm {
  productId: string;
  qty: number;
}

export interface PersonalSale {
  _id?: string;
  id?: number;
  productId: string | number | { _id: string; name: string };
  productName?: string;
  buyer: string;
  buyerType: "hospital" | "pharmacy";
  qty: number;
  unitPrice?: number;
  total: number;
  paid: boolean;
  saleDate: string;
  [key: string]: any;
}

export interface PersonalSaleForm {
  productId: string;
  buyer: string;
  buyerType: "hospital" | "pharmacy";
  qty: number;
}

export type ModalKey =
  | "add_product"
  | "restock"
  | "direct_sale"
  | "new_deal"
  | "new_inst"
  | "personal_purchase"
  | "personal_sale"
  | null;


  export type PageKey =
  | "dashboard" | "inventory" | "direct" | "distributor"
  | "institutional" | "personal" | "doctors" | "kpi" | "login";  