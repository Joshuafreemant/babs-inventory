export type Category =
  | "bottle"
  | "syrup"
  | "jar"
  | "pump"
  | "tube"
  | "dropper"
  | "granule"
  | "cream"
  | "powder"
  | "condom";

export type DrugCategory =
  | "analgesics"
  | "antibiotics"
  | "antivirals"
  | "antifungals"
  | "antimalarials"
  | "cardiovascular"
  | "respiratory"
  | "gastrointestinal"
  | "endocrine_diabetes"
  | "cns_neurological"
  | "psychiatric"
  | "dermatological"
  | "ophthalmic"
  | "ent"
  | "vitamins_supplements"
  | "vaccines_immunizations"
  | "oncology_chemotherapy"
  | "hormonal_reproductive"
  | "urological"
  | "anti_inflammatory_steroids"
  | "anesthetics";

/**
 * Therapeutic classification shown to staff when adding/editing a product.
 * `active: false` entries stay in the enum (so old data / the API keep validating
 * them) but are hidden from the dropdown until the rest are turned on post-test.
 */
export const DRUG_CATEGORIES: { id: DrugCategory; label: string; active: boolean }[] = [
  { id: "analgesics", label: "Analgesics / Pain Relief (NSAIDs, opioids, etc.)", active: false },
  { id: "antibiotics", label: "Antibiotics / Antimicrobials", active: false },
  { id: "antivirals", label: "Antivirals", active: false },
  { id: "antifungals", label: "Antifungals", active: false },
  { id: "antimalarials", label: "Antimalarials", active: false },
  { id: "cardiovascular", label: "Cardiovascular (antihypertensives, statins, anticoagulants)", active: true },
  { id: "respiratory", label: "Respiratory (bronchodilators, antihistamines, decongestants)", active: false },
  { id: "gastrointestinal", label: "Gastrointestinal (antacids, laxatives, antiemetics)", active: false },
  { id: "endocrine_diabetes", label: "Endocrine / Diabetes (insulin, oral hypoglycemics)", active: false },
  { id: "cns_neurological", label: "CNS / Neurological (anticonvulsants, antidepressants, sedatives)", active: false },
  { id: "psychiatric", label: "Psychiatric (antipsychotics, anxiolytics)", active: false },
  { id: "dermatological", label: "Dermatological (topical creams, ointments)", active: false },
  { id: "ophthalmic", label: "Ophthalmic (eye drops, ointments)", active: false },
  { id: "ent", label: "ENT (ear/nose/throat preparations)", active: false },
  { id: "vitamins_supplements", label: "Vitamins & Supplements", active: false },
  { id: "vaccines_immunizations", label: "Vaccines / Immunizations", active: false },
  { id: "oncology_chemotherapy", label: "Oncology / Chemotherapy", active: false },
  { id: "hormonal_reproductive", label: "Hormonal / Reproductive (contraceptives, fertility drugs)", active: false },
  { id: "urological", label: "Urological", active: false },
  { id: "anti_inflammatory_steroids", label: "Anti-inflammatory / Steroids", active: false },
  { id: "anesthetics", label: "Anesthetics", active: false },
];

export interface Product {
  id: string;
  name: string;
  category: Category;
  drugCategory: DrugCategory;
  boxesPerCarton: number;
  price: number;
  stock: number;
  lowStockThreshold: number;
  forceLowStock: boolean;
  showStock: boolean;
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
  items: {
    name: string;
    qty: number;
    unitPrice: number;
    lineTotal: number;
    backordered: boolean;
    boxesPerCarton?: number;
  }[];
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
  { id: "granule", label: "Granules sachet" },
  { id: "cream", label: "Cream / ointment tub" },
  { id: "powder", label: "Powder tin" },
  { id: "condom", label: "Condom pack" },
];

export const CARTON_PRESETS = [12, 20, 24, 30, 36, 48, 60];
