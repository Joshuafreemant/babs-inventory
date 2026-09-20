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
  { id: "analgesics", label: "Analgesics / Pain Relief (NSAIDs, opioids, etc.)", active: true },
  { id: "antibiotics", label: "Antibiotics / Antimicrobials", active: true },
  { id: "antivirals", label: "Antivirals", active: true },
  { id: "antifungals", label: "Antifungals", active: true },
  { id: "antimalarials", label: "Antimalarials", active: true },
  { id: "cardiovascular", label: "Cardiovascular (antihypertensives, statins, anticoagulants)", active: true },
  { id: "respiratory", label: "Respiratory (bronchodilators, antihistamines, decongestants)", active: true },
  { id: "gastrointestinal", label: "Gastrointestinal (antacids, laxatives, antiemetics)", active: true },
  { id: "endocrine_diabetes", label: "Endocrine / Diabetes (insulin, oral hypoglycemics)", active: true },
  { id: "cns_neurological", label: "CNS / Neurological (anticonvulsants, antidepressants, sedatives)", active: true },
  { id: "psychiatric", label: "Psychiatric (antipsychotics, anxiolytics)", active: true },
  { id: "dermatological", label: "Dermatological (topical creams, ointments)", active: true },
  { id: "ophthalmic", label: "Ophthalmic (eye drops, ointments)", active: true },
  { id: "ent", label: "ENT (ear/nose/throat preparations)", active: true },
  { id: "vitamins_supplements", label: "Vitamins & Supplements", active: true },
  { id: "vaccines_immunizations", label: "Vaccines / Immunizations", active: true },
  { id: "oncology_chemotherapy", label: "Oncology / Chemotherapy", active: true },
  { id: "hormonal_reproductive", label: "Hormonal / Reproductive (contraceptives, fertility drugs)", active: true },
  { id: "urological", label: "Urological", active: true },
  { id: "anti_inflammatory_steroids", label: "Anti-inflammatory / Steroids", active: true },
  { id: "anesthetics", label: "Anesthetics", active: true },
];

/** Short display label for a drug category — trims the "(examples...)" suffix. */
export function drugCategoryLabel(id: DrugCategory): string {
  const found = DRUG_CATEGORIES.find((c) => c.id === id);
  return found ? found.label.split(" (")[0] : id;
}

export interface Product {
  id: string;
  name: string;
  // legacy shape field — only used as a fallback icon when there's no photo.
  // Loosely typed on purpose: it's no longer staff-editable or DB-constrained,
  // so it must never be assumed to be one of the old `Category` values.
  category: string;
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

// Legacy shape/icon labels — kept only because ProductArt still looks these ids up
// for its fallback illustration. Not shown to staff anymore; use DRUG_CATEGORIES
// for anything user-facing.
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
