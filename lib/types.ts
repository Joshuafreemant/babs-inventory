// Single source of truth is app/api/types.ts
// This file only re-exports so existing imports from @/lib/types keep working

export type {
  Customer,
  Product,
  DirectSale,
  DirectSaleForm,
  DistribDeal,
  DistribDealForm,
  InstitutionalSale,
  InstitutionalForm,
  PersonalPurchase,
  PersonalPurchaseForm,
  PersonalSale,
  PersonalSaleForm,
  ModalKey,
  PageKey,
} from "@/app/api/types";