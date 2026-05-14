"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/shared/Sidebar";
import { Dashboard } from "@/components/pages/Dashboard";
import { Inventory } from "@/components/pages/Inventory";
import { DirectSalesComponent } from "@/components/pages/DirectSales";
import { DistributorDealsComponent } from "@/components/pages/DistributorDeals";
import { InstitutionalComponent } from "@/components/pages/Institutional";
import { PersonalBusinessComponent } from "@/components/pages/PersonalBusiness";
import { DoctorsComponent } from "@/components/pages/Doctors";
import KPIComponent from "@/components/pages/KpiPage";

import type {
  DistribDeal,
  Product,
  InstitutionalSale,
  PersonalPurchase,
  PersonalSale,
  ModalKey,
  PageKey,
} from "@/lib/types";
import type { DirectSale, DirectSaleForm } from "@/app/api/types";
import toast from "react-hot-toast";

export function AppContainer() {
  const [page, setPage] = useState<PageKey>("dashboard");
  const [modal, setModal] = useState<ModalKey>(null);

  // Company Data
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [directSales, setDirectSales] = useState<DirectSale[]>([]);
  const [isLoadingDirectSales, setIsLoadingDirectSales] = useState(true);
  const [distribDeals, setDistribDeals] = useState<DistribDeal[]>([]);
  const [institutional, setInstitutional] = useState<InstitutionalSale[]>([]);

  // Personal Business Data
  const [personalPurchases, setPersonalPurchases] = useState<
    PersonalPurchase[]
  >([]);
  const [personalSales, setPersonalSales] = useState<PersonalSale[]>([]);

  // Fetch products from database on mount
  useEffect(() => {
    fetchProducts();
    fetchDirectSales();
    fetchInstitutional();
  }, []);

  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const response = await fetch("/api/products?limit=100");
      const data = await response.json();

      if (data.error) {
        console.error("Error fetching products:", data.error);
        toast.error("Failed to load products");
        return;
      }

      setProducts(data.data || []);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      toast.error("Failed to load products");
    } finally {
      setIsLoadingProducts(false);
    }
  };
  const fetchDirectSales = async () => {
    setIsLoadingDirectSales(true);
    try {
      const response = await fetch("/api/direct-sales?limit=100");
      const data = await response.json();

      if (data.error) {
        console.log("Error fetching direct sales:", data);
        // toast.error("Failed to load direct sales");
        return;
      }

      // Map populated fields to match DirectSale type
      const sales = (data.data || []).map((s: any) => ({
        ...s,
        productName: s.productId?.name || "",
        customer: s.customerId?.name || "",
      }));

      setDirectSales(sales);
    } catch (error) {
      console.error("Failed to fetch direct sales:", error);
      toast.error("Failed to load direct sales");
    } finally {
      setIsLoadingDirectSales(false);
    }
  };
  const fetchInstitutional = async () => {
    setIsLoadingDirectSales(true);
    try {
      const response = await fetch("/api/institutional-sales");
      const data = await response.json();

      if (data.error) {
        console.log("Error fetching institutional sales:", data);
        // toast.error("Failed to load institutional sales");
        return;
      }

      // Map populated fields to match DirectSale type
      const sales = (data.data || []).map((s: any) => ({
        ...s,
        productName: s.productId?.name || "",
        customer: s.customerId?.name || "",
      }));

      setInstitutional(sales);
    } catch (error) {
      console.error("Failed to fetch institutional sales:", error);
      toast.error("Failed to load institutional sales");
    } finally {
      setIsLoadingDirectSales(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar currentPage={page} onPageChange={setPage} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {page === "dashboard" && <Dashboard />}

        {page === "inventory" && (
          <Inventory
            products={products}
            setProducts={setProducts}
            modal={modal}
            setModal={setModal}
          />
        )}

        {page === "direct" && (
          <DirectSalesComponent
            directSales={directSales}
            setDirectSales={setDirectSales}
            products={products}
            setProducts={setProducts}
            modal={modal}
            setModal={setModal}
          />
        )}

        {page === "distributor" && (
          <DistributorDealsComponent
            distribDeals={distribDeals}
            setDistribDeals={setDistribDeals}
            products={products}
            setProducts={setProducts}
            modal={modal}
            setModal={setModal}
          />
        )}

        {/* {page === "institutional" && (
          <InstitutionalComponent
            // @ts-ignore
            institutional={institutional}
            // @ts-ignore
            setInstitutional={setInstitutional}
            products={products}
            setProducts={setProducts}
            setModal={setModal}
          />
        )} */}
        {page === "institutional" && (
  <InstitutionalComponent
    // @ts-ignore
    institutional={institutional}
    // @ts-ignore
    setInstitutional={setInstitutional}
    products={products}
    setProducts={setProducts}
    modal={modal}      
    setModal={setModal}
  />
)}

        {page === "personal" && (
          <PersonalBusinessComponent
            // @ts-ignore
            personalPurchases={personalPurchases}
            // @ts-ignore
            setPersonalPurchases={setPersonalPurchases}
            // @ts-ignore
            personalSales={personalSales}
            // @ts-ignore
            setPersonalSales={setPersonalSales}
            products={products}
            modal={modal}
            setModal={setModal}
          />
        )}
        {page === "doctors" && <DoctorsComponent />}
        {page === "kpi" && <KPIComponent />}
      </main>
    </div>
  );
}
