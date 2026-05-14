"use client";

import { Card, StatCard } from "@/components/shared/Card";
import { Modal } from "@/components/shared/Modal";
import { Badge } from "@/components/shared/Badge";
import { formatCurrency } from "@/lib/constants";
import type { Product, ModalKey, Customer } from "@/app/api/types";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { FaPlusCircle } from "react-icons/fa";

// ── Types ────────────────────────────────────────────────────────────────────

interface PersonalPurchase {
  _id?: string;
  productId: any;
  qty: number;
  unitPrice: number;
  total: number;
  purchaseDate: string | Date;
  productName?: string;
}

interface PersonalSale {
  _id?: string;
  productId: any;
  customerId: any;
  buyer: string;
  buyerType: "pharmacy" | "hospital";
  qty: number;
  unitPrice: number;
  total: number;
  paid: boolean;
  saleDate: string | Date;
  productName?: string;
}

interface PersonalPurchaseForm {
  productId: string;
  qty: number;
  price: number; // editable total price
  purchaseDate: string;
}

interface PersonalSaleForm {
  productId: string;
  customerId?: string;
  buyerType: "pharmacy" | "hospital";
  qty: number;
  total: number;
  saleDate: string;
}

interface PersonalBusinessProps {
  personalPurchases: PersonalPurchase[];
  setPersonalPurchases: (purchases: PersonalPurchase[]) => void;
  personalSales: PersonalSale[];
  setPersonalSales: (sales: PersonalSale[]) => void;
  products: Product[];
  setProducts: (products: Product[]) => void;
  modal: ModalKey;
  setModal: (modal: ModalKey) => void;
}

const MARKUP = 0;

// ── Component ────────────────────────────────────────────────────────────────

export function PersonalBusinessComponent({
  personalPurchases,
  setPersonalPurchases,
  personalSales,
  setPersonalSales,
  products,
  setProducts,
  modal,
  setModal,
}: PersonalBusinessProps) {
  const [purchaseForm, setPurchaseForm] = useState<PersonalPurchaseForm>({
    productId: "",
    qty: 0,
    price: 0,
    purchaseDate: "",
  });

  const [saleForm, setSaleForm] = useState<PersonalSaleForm>({
    productId: "",
    customerId: "",
    buyerType: "pharmacy",
    qty: 0,
    total: 0,
    saleDate: "",
  });

  const [isSubmittingPurchase, setIsSubmittingPurchase] = useState(false);
  const [isSubmittingSale, setIsSubmittingSale] = useState(false);

  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [searchProduct, setSearchProduct] = useState("");

  // Separate product search for each modal
  const [searchPurchaseProduct, setSearchPurchaseProduct] = useState("");
  const [searchSaleProduct, setSearchSaleProduct] = useState("");

  // Add-new product inline form (shared for both modals)
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    unitPrice: "",
    instPrice: "",
    cartonQty: "",
    stock: "0",
    expiryDate: "",
  });
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  // Pagination for purchases
  const [purchasePage, setPurchasePage] = useState(1);
  const [purchaseTotalPages, setPurchaseTotalPages] = useState(1);
  const [isLoadingPurchases, setIsLoadingPurchases] = useState(false);

  // Pagination for sales
  const [salePage, setSalePage] = useState(1);
  const [saleTotalPages, setSaleTotalPages] = useState(1);
  const [isLoadingSales, setIsLoadingSales] = useState(false);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [searchSaleCustomer, setSearchSaleCustomer] = useState("");

  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);

  const PAGE_SIZE = 20;

  // ── Derived stats ─────────────────────────────────────────────────────────

  const totalInvestment = personalPurchases.reduce(
    (sum, p) => sum + p.total,
    0,
  );
  const totalRevenue = personalSales.reduce((sum, s) => sum + s.total, 0);
  const totalProfit = totalRevenue - totalInvestment;
  const paidAmount = personalSales
    .filter((s) => s.paid)
    .reduce((sum, s) => sum + s.total, 0);

  // ── Data fetching ─────────────────────────────────────────────────────────

  const fetchPurchases = async (page = 1) => {
    setIsLoadingPurchases(true);
    try {
      const response = await fetch(
        `/api/personal-purchases?page=${page}&limit=${PAGE_SIZE}`,
      );
      const data = await response.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }

      const purchases = (data.data || []).map((p: any) => ({
        ...p,
        productName: p.productId?.name || "",
      }));

      setPersonalPurchases(purchases);
      setPurchaseTotalPages(data.pagination?.totalPages || 1);
      setPurchasePage(page);
    } catch {
      toast.error("Failed to load purchases");
    } finally {
      setIsLoadingPurchases(false);
    }
  };

  const fetchSales = async (page = 1) => {
    setIsLoadingSales(true);
    try {
      const response = await fetch(
        `/api/personal-sales?page=${page}&limit=${PAGE_SIZE}`,
      );
      const data = await response.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }

      const sales = (data.data || []).map((s: any) => ({
        ...s,
        productName: s.productId?.name || "",
      }));

      setPersonalSales(sales);
      setSaleTotalPages(data.pagination?.totalPages || 1);
      setSalePage(page);
    } catch {
      toast.error("Failed to load sales");
    } finally {
      setIsLoadingSales(false);
    }
  };

  const fetchProducts = async (search?: string) => {
    setIsLoadingProducts(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      params.append("limit", "50");

      const response = await fetch(`/api/products?${params}`);
      const data = await response.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }
      setProducts(data.data);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // Add fetch function
  const fetchCustomers = async (search?: string) => {
    setIsLoadingCustomers(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      params.append("limit", "50");
      const response = await fetch(`/api/customers?${params}`);
      const data = await response.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }
      setCustomers(data.data);
    } catch {
      toast.error("Failed to load customers");
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  // Add to the modal open useEffect
  useEffect(() => {
    if (modal === "personal_purchase" || modal === "personal_sale") {
      fetchProducts();
      fetchPersonalInventory();
      if (modal === "personal_sale") fetchCustomers();
    }
  }, [modal]);

  // Add debounced customer search
  useEffect(() => {
    const id = setTimeout(() => {
      if (modal === "personal_sale") fetchCustomers(searchSaleCustomer);
    }, 300);
    return () => clearTimeout(id);
  }, [searchSaleCustomer]);

  useEffect(() => {
    fetchPurchases(1);
    fetchSales(1);
  }, []);

  // Debounced product search — purchase modal
  useEffect(() => {
    const id = setTimeout(() => {
      if (modal === "personal_purchase") fetchProducts(searchPurchaseProduct);
    }, 300);
    return () => clearTimeout(id);
  }, [searchPurchaseProduct]);

  // Debounced product search — sale modal
  useEffect(() => {
    const id = setTimeout(() => {
      if (modal === "personal_sale") fetchProducts(searchSaleProduct);
    }, 300);
    return () => clearTimeout(id);
  }, [searchSaleProduct]);

  // ── Auto-calculate purchase price ─────────────────────────────────────────

  useEffect(() => {
    if (purchaseForm.productId && purchaseForm.qty > 0) {
      const product = products.find((p) => p._id === purchaseForm.productId);
      if (product) {
        const unitPrice = product.unitPrice || product.price || 0;
        setPurchaseForm((prev) => ({ ...prev, price: unitPrice * prev.qty }));
      }
    } else {
      setPurchaseForm((prev) => ({ ...prev, price: 0 }));
    }
  }, [purchaseForm.productId, purchaseForm.qty, products]);

  // ── Auto-calculate sale total (with markup) ───────────────────────────────

  useEffect(() => {
    if (saleForm.productId && saleForm.qty > 0) {
      const product = products.find((p) => p._id === saleForm.productId);
      if (product) {
        const unitPrice = product.unitPrice || product.price || 0;
        setSaleForm((prev) => ({
          ...prev,
          total: unitPrice * (1 + MARKUP) * prev.qty,
        }));
      }
    } else {
      setSaleForm((prev) => ({ ...prev, total: 0 }));
    }
  }, [saleForm.productId, saleForm.qty, products]);

  // ── Add new product ───────────────────────────────────────────────────────

  const handleAddProduct = async () => {
    if (
      !newProduct.name.trim() ||
      !newProduct.unitPrice ||
      !newProduct.cartonQty
    ) {
      toast.error("Name, price, and carton quantity are required");
      return;
    }
    setIsSavingProduct(true);
    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProduct.name.trim(),
          category: newProduct.category || "General",
          unitPrice: Number(newProduct.unitPrice),
          instPrice:
            Number(newProduct.instPrice) || Number(newProduct.unitPrice),
          cartonQty: Number(newProduct.cartonQty),
          stock: Number(newProduct.stock) || 0,
          expiryDate: newProduct.expiryDate || null,
        }),
      });
      const data = await response.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }

      setProducts([...products, data.data]);

      if (modal === "personal_purchase") {
        setPurchaseForm((prev) => ({ ...prev, productId: data.data._id }));
      } else {
        setSaleForm((prev) => ({ ...prev, productId: data.data._id }));
      }

      setNewProduct({
        name: "",
        category: "",
        unitPrice: "",
        instPrice: "",
        cartonQty: "",
        stock: "0",
        expiryDate: "",
      });
      setShowAddProduct(false);
      toast.success(data.message || "Product added successfully");
    } catch {
      toast.error("Failed to save product");
    } finally {
      setIsSavingProduct(false);
    }
  };

  // ── Record purchase ───────────────────────────────────────────────────────

  const handleAddPurchase = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!purchaseForm.productId) {
      toast.error("Please select a product");
      return;
    }
    if (purchaseForm.qty <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }
    if (!purchaseForm.price || purchaseForm.price <= 0) {
      toast.error("Price must be greater than 0");
      return;
    }

    const product = products.find((p) => p._id === purchaseForm.productId);
    if (!product) {
      toast.error("Product not found");
      return;
    }
    if (purchaseForm.qty > product.stock) {
      toast.error(`Only ${product.stock} cartons available in company stock`);
      return;
    }

    setIsSubmittingPurchase(true);
    try {
      const response = await fetch("/api/personal-purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: purchaseForm.productId,
          qty: purchaseForm.qty,
          price: purchaseForm.price,
          purchaseDate: purchaseForm.purchaseDate,
        }),
      });
      const data = await response.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }

      const newPurchase: PersonalPurchase = {
        ...data.data,
        productName: data.data.productId?.name || product.name,
      };

      setPersonalPurchases([newPurchase, ...personalPurchases]);

      // Update company stock locally
      setProducts(
        products.map((p) =>
          p._id === product._id
            ? { ...p, stock: p.stock - purchaseForm.qty }
            : p,
        ),
      );

      setPurchaseForm({ productId: "", qty: 0, price: 0, purchaseDate: "" });
      setModal(null);
      toast.success(data.message || "Purchase recorded");
    } catch {
      toast.error("Failed to record purchase");
    } finally {
      setIsSubmittingPurchase(false);
    }
  };

  // ── Record sale ───────────────────────────────────────────────────────────

  const handleAddSale = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!saleForm.productId) {
      toast.error("Please select a product");
      return;
    }
    if (!saleForm.customerId) {
      toast.error("Please select a customer");
      return;
    }
    if (saleForm.qty <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }
    if (!saleForm.total || saleForm.total <= 0) {
      toast.error("Total must be greater than 0");
      return;
    }

    setIsSubmittingSale(true);
    try {
      const response = await fetch("/api/personal-sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saleForm),
      });
      const data = await response.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }

      const product = products.find((p) => p._id === saleForm.productId);
      const newSale: PersonalSale = {
        ...data.data,
        productName: data.data.productId?.name || product?.name || "Unknown",
      };

      setPersonalSales([newSale, ...personalSales]);

      setSaleForm({
        productId: "",
        customerId: "",
        buyerType: "pharmacy",
        qty: 0,
        total: 0,
        saleDate: "",
      });
      setModal(null);
      toast.success(data.message || "Sale recorded");
    } catch {
      toast.error("Failed to record sale");
    } finally {
      setIsSubmittingSale(false);
    }
  };

  // ── Toggle paid ───────────────────────────────────────────────────────────

  const toggleSalePaid = async (saleId: string) => {
    if (!saleId) {
      toast.error("Invalid sale ID");
      return;
    }
    try {
      const response = await fetch(
        `/api/personal-sales/${saleId}/toggle-paid`,
        {
          method: "PATCH",
        },
      );
      const data = await response.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }

      setPersonalSales(
        personalSales.map((s) =>
          s._id === saleId ? { ...s, paid: data.data.paid } : s,
        ),
      );
      toast.success(data.message || "Payment status updated");
    } catch {
      toast.error("Failed to update payment status");
    }
  };

  const handleDeleteSale = async (saleId: string) => {
    if (!saleId) return;
    if (!confirm("Delete this sale record? This cannot be undone.")) return;

    try {
      const response = await fetch(`/api/personal-sales/${saleId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }
      setPersonalSales(personalSales.filter((s) => s._id !== saleId));
      toast.success("Sale deleted");
    } catch {
      toast.error("Failed to delete sale");
    }
  };

  const handleAddCustomer = async () => {
    if (!newCustomer.name.trim() || !newCustomer.phone.trim()) {
      toast.error("Name and phone number are required");
      return;
    }
    setIsSavingCustomer(true);
    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCustomer),
      });
      const data = await response.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }
      setCustomers((prev) => [...prev, data.data]);
      setSaleForm((prev) => ({ ...prev, customerId: data.data._id }));
      setNewCustomer({ name: "", phone: "", email: "", address: "" });
      setShowAddCustomer(false);
      toast.success(data.message || "Customer added successfully");
    } catch {
      toast.error("Failed to save customer");
    } finally {
      setIsSavingCustomer(false);
    }
  };
  // ── Helpers ───────────────────────────────────────────────────────────────

  const getProductName = (item: PersonalPurchase | PersonalSale) => {
    if (item.productName) return item.productName;
    if (typeof item.productId === "object") return item.productId?.name;
    return products.find((p) => p._id === item.productId)?.name || "Unknown";
  };

  const filteredPurchaseProducts = searchPurchaseProduct
    ? products.filter((p) =>
        p.name.toLowerCase().includes(searchPurchaseProduct.toLowerCase()),
      )
    : products;

  const filteredSaleProducts = searchSaleProduct
    ? products.filter((p) =>
        p.name.toLowerCase().includes(searchSaleProduct.toLowerCase()),
      )
    : products;

  // ── Render ────────────────────────────────────────────────────────────────
  // Add after existing state declarations
  const [personalInventory, setPersonalInventory] = useState<
    { productId: any; qty: number; productName: string }[]
  >([]);

  // Add fetch function
  const fetchPersonalInventory = async () => {
    try {
      // Get all personal purchases grouped by product
      const response = await fetch("/api/personal-purchases?limit=200");
      const data = await response.json();
      if (data.error) return;

      // Aggregate qty per product (personal stock on hand)
      const inventoryMap = new Map<
        string,
        { productId: any; qty: number; productName: string }
      >();

      for (const purchase of data.data || []) {
        const id = purchase.productId?._id || purchase.productId;
        const name = purchase.productId?.name || purchase.productName || "";
        if (inventoryMap.has(id)) {
          inventoryMap.get(id)!.qty += purchase.qty;
        } else {
          inventoryMap.set(id, {
            productId: purchase.productId,
            qty: purchase.qty,
            productName: name,
          });
        }
      }

      // Subtract personal sales
      const salesResp = await fetch("/api/personal-sales?limit=200");
      const salesData = await salesResp.json();
      for (const sale of salesData.data || []) {
        const id = sale.productId?._id || sale.productId;
        if (inventoryMap.has(id)) {
          inventoryMap.get(id)!.qty -= sale.qty;
        }
      }

      // Only products with stock > 0
      setPersonalInventory(
        Array.from(inventoryMap.values()).filter((item) => item.qty > 0),
      );
    } catch {
      console.error("Failed to load personal inventory");
    }
  };
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-3 md:p-6">
        {/* Header */}
        <div className="mb-6 mt-16">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Personal Business
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Your personal pharmaceutical sales and purchases
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <StatCard
            label="Total Investment"
            value={formatCurrency(totalInvestment)}
            color="purple"
          />
          <StatCard
            label="Total Revenue"
            value={formatCurrency(totalRevenue)}
            color="green"
          />
          <StatCard
            label="Total Profit/Loss"
            value={formatCurrency(totalProfit)}
            color={totalProfit >= 0 ? "green" : "red"}
          />
          <StatCard
            label="Amount Collected"
            value={formatCurrency(paidAmount)}
            color="teal"
          />
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── Personal Purchases ─────────────────────────────────────────── */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base md:text-lg font-semibold text-gray-900">
                Personal Purchases
              </h2>
              <button
                onClick={() => setModal("personal_purchase")}
                className="bg-purple-600 text-white px-3 py-1 rounded-lg text-xs md:text-sm hover:bg-purple-700 flex items-center gap-1"
              >
                <FaPlusCircle className="text-sm" />
                Buy
              </button>
            </div>

            {personalPurchases.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No purchases yet
              </p>
            ) : (
              <>
                <div className="space-y-3">
                  {personalPurchases.map((purchase) => (
                    <div
                      key={purchase._id}
                      className="border border-gray-200 rounded-lg p-3"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <p className="font-medium text-sm text-gray-900">
                            {getProductName(purchase)}
                          </p>
                          <p className="text-xs text-gray-600">
                            {purchase.qty} cartons × ₦
                            {purchase.unitPrice.toLocaleString()}
                          </p>
                        </div>
                        <Badge variant="info">
                          ₦{purchase.total.toLocaleString()}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(purchase.purchaseDate).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>

                {purchaseTotalPages > 1 && (
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Page {purchasePage} of {purchaseTotalPages}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => fetchPurchases(purchasePage - 1)}
                        disabled={purchasePage === 1 || isLoadingPurchases}
                        className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                      >
                        Prev
                      </button>
                      <button
                        onClick={() => fetchPurchases(purchasePage + 1)}
                        disabled={
                          purchasePage === purchaseTotalPages ||
                          isLoadingPurchases
                        }
                        className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>

          {/* ── Personal Sales ─────────────────────────────────────────────── */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base md:text-lg font-semibold text-gray-900">
                Personal Sales
              </h2>
              <button
                onClick={() => setModal("personal_sale")}
                className="bg-teal-600 text-white px-3 py-1 rounded-lg text-xs md:text-sm hover:bg-teal-700 flex items-center gap-1"
              >
                <FaPlusCircle className="text-sm" />
                Sell
              </button>
            </div>

            {personalSales.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No sales yet
              </p>
            ) : (
              <>
                <div className="space-y-3">
                  {personalSales.map((sale) => (
                    <div
                      key={sale._id}
                      className={`border rounded-lg p-3 transition-colors ${
                        sale.paid
                          ? "border-green-200 bg-green-50"
                          : "border-orange-200 bg-orange-50"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => toggleSalePaid(sale._id as string)}
                        >
                          <p className="font-medium text-sm text-gray-900">
                            {getProductName(sale)}
                          </p>
                          <p className="text-xs text-gray-600 flex items-center gap-1">
                            {sale.customerId?.name ||
                              sale.buyer ||
                              "Unknown Buyer"}{" "}
                            ·{" "}
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                              {sale.buyerType}
                            </span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={sale.paid ? "success" : "warning"}>
                            {sale.paid ? "Paid" : "Pending"}
                          </Badge>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSale(sale._id as string);
                            }}
                            className="text-red-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50"
                            title="Delete sale"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <p
                        className="text-sm font-semibold text-gray-900 cursor-pointer"
                        onClick={() => toggleSalePaid(sale._id as string)}
                      >
                        ₦{sale.total.toLocaleString()}
                      </p>
                      <p
                        className="text-xs text-gray-500 mt-0.5 cursor-pointer"
                        onClick={() => toggleSalePaid(sale._id as string)}
                      >
                        {new Date(sale.saleDate).toLocaleDateString()} ·{" "}
                        {sale.qty} carton{sale.qty !== 1 ? "s" : ""}
                      </p>
                    </div>
                  ))}
                </div>

                {saleTotalPages > 1 && (
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Page {salePage} of {saleTotalPages}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => fetchSales(salePage - 1)}
                        disabled={salePage === 1 || isLoadingSales}
                        className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                      >
                        Prev
                      </button>
                      <button
                        onClick={() => fetchSales(salePage + 1)}
                        disabled={salePage === saleTotalPages || isLoadingSales}
                        className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>
        </div>

        {/* ── Purchase Modal ────────────────────────────────────────────────── */}
        <Modal
          isOpen={modal === "personal_purchase"}
          onClose={() => setModal(null)}
          title="Buy from Company"
        >
          <form onSubmit={handleAddPurchase} className="space-y-4" noValidate>
            {/* Product */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Product
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddProduct(!showAddProduct)}
                  className="text-purple-600 hover:text-purple-800 text-sm font-medium flex items-center gap-1"
                >
                  <FaPlusCircle className="mr-1" />
                  Add New Product
                </button>
              </div>
              {/* Replace <AddProductForm /> with the inlined JSX in both modals */}
              {showAddProduct && (
                <div className="mb-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    New Product Details
                  </h4>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Product Name *"
                      value={newProduct.name}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={newProduct.category}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          category: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select category...</option>
                      <option value="Antibiotic">Antibiotic</option>
                      <option value="Analgesic">Analgesic</option>
                      <option value="Antidiabetic">Antidiabetic</option>
                      <option value="Antihypertensive">Antihypertensive</option>
                      <option value="GIT">GIT</option>
                      <option value="Cardiovascular">Cardiovascular</option>
                      <option value="Respiratory">Respiratory</option>
                      <option value="Vitamins">Vitamins & Supplements</option>
                      <option value="Other">Other</option>
                    </select>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Unit Price (₦) *"
                        value={newProduct.unitPrice}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            unitPrice: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        placeholder="Inst. Price (₦)"
                        value={newProduct.instPrice}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            instPrice: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Units/Carton *"
                        value={newProduct.cartonQty}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            cartonQty: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        placeholder="Initial Stock"
                        value={newProduct.stock}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            stock: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <input
                      type="date"
                      value={newProduct.expiryDate}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          expiryDate: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setNewProduct({
                            name: "",
                            category: "",
                            unitPrice: "",
                            instPrice: "",
                            cartonQty: "",
                            stock: "0",
                            expiryDate: "",
                          })
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={handleAddProduct}
                        disabled={isSavingProduct}
                        className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                      >
                        {isSavingProduct ? "Saving..." : "Save Product"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <input
                type="text"
                placeholder="Search products..."
                value={searchPurchaseProduct}
                onChange={(e) => setSearchPurchaseProduct(e.target.value)}
                className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <select
                value={purchaseForm.productId}
                onChange={(e) =>
                  setPurchaseForm({
                    ...purchaseForm,
                    productId: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              >
                <option value="">Select product...</option>
                {filteredPurchaseProducts.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} — ₦
                    {p.unitPrice?.toLocaleString() || p.price?.toLocaleString()}{" "}
                    ({p.stock} in stock)
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity (Cartons)
              </label>
              <input
                type="number"
                value={purchaseForm.qty || ""}
                onChange={(e) =>
                  setPurchaseForm({
                    ...purchaseForm,
                    qty: parseFloat(e.target.value) || 0,
                  })
                }
                min="0.1"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              />
              {purchaseForm.productId && (
                <p className="text-xs text-gray-500 mt-1">
                  Available:{" "}
                  {products.find((p) => p._id === purchaseForm.productId)
                    ?.stock || 0}{" "}
                  cartons
                </p>
              )}
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Price (₦){" "}
                <span className="text-xs text-gray-400 font-normal">
                  auto-calculated, editable
                </span>
              </label>
              <input
                type="text"
                value={
                  purchaseForm.price
                    ? purchaseForm.price.toLocaleString("en-NG")
                    : ""
                }
                onChange={(e) => {
                  const raw = e.target.value.replace(/,/g, "");
                  setPurchaseForm({
                    ...purchaseForm,
                    price: parseFloat(raw) || 0,
                  });
                }}
                placeholder="0"
                inputMode="decimal"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Purchase Date
              </label>
              <input
                type="date"
                value={
                  purchaseForm.purchaseDate ||
                  new Date().toISOString().split("T")[0]
                }
                onChange={(e) =>
                  setPurchaseForm({
                    ...purchaseForm,
                    purchaseDate: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              />
            </div>

            {/* Summary */}
            {purchaseForm.productId && purchaseForm.qty > 0 && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <h4 className="text-sm font-medium text-purple-900 mb-1">
                  Purchase Summary
                </h4>
                <p className="text-sm text-purple-900">
                  {products.find((p) => p._id === purchaseForm.productId)?.name}
                </p>
                <p className="text-sm font-semibold text-purple-900">
                  Total: ₦{purchaseForm.price.toLocaleString()}
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingPurchase}
                className="flex-1 bg-purple-600 text-white py-2 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 text-sm"
              >
                {isSubmittingPurchase ? "Recording..." : "Record Purchase"}
              </button>
            </div>
          </form>
        </Modal>

        {/* ── Sale Modal ────────────────────────────────────────────────────── */}
        <Modal
          isOpen={modal === "personal_sale"}
          onClose={() => setModal(null)}
          title="Sell to Hospital / Pharmacy"
        >
          <form onSubmit={handleAddSale} className="space-y-4" noValidate>
            {/* Product */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Product
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddProduct(!showAddProduct)}
                  className="text-teal-600 hover:text-teal-800 text-sm font-medium flex items-center gap-1"
                >
                  <FaPlusCircle className="mr-1" />
                  Add New Product
                </button>
              </div>
              {/* Replace <AddProductForm /> with the inlined JSX in both modals */}
              {showAddProduct && (
                <div className="mb-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    New Product Details
                  </h4>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Product Name *"
                      value={newProduct.name}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={newProduct.category}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          category: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select category...</option>
                      <option value="Antibiotic">Antibiotic</option>
                      <option value="Analgesic">Analgesic</option>
                      <option value="Antidiabetic">Antidiabetic</option>
                      <option value="Antihypertensive">Antihypertensive</option>
                      <option value="GIT">GIT</option>
                      <option value="Cardiovascular">Cardiovascular</option>
                      <option value="Respiratory">Respiratory</option>
                      <option value="Vitamins">Vitamins & Supplements</option>
                      <option value="Other">Other</option>
                    </select>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Unit Price (₦) *"
                        value={newProduct.unitPrice}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            unitPrice: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        placeholder="Inst. Price (₦)"
                        value={newProduct.instPrice}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            instPrice: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Units/Carton *"
                        value={newProduct.cartonQty}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            cartonQty: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        placeholder="Initial Stock"
                        value={newProduct.stock}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            stock: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <input
                      type="date"
                      value={newProduct.expiryDate}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          expiryDate: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setNewProduct({
                            name: "",
                            category: "",
                            unitPrice: "",
                            instPrice: "",
                            cartonQty: "",
                            stock: "0",
                            expiryDate: "",
                          })
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={handleAddProduct}
                        disabled={isSavingProduct}
                        className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                      >
                        {isSavingProduct ? "Saving..." : "Save Product"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <input
                type="text"
                placeholder="Search products..."
                value={searchSaleProduct}
                onChange={(e) => setSearchSaleProduct(e.target.value)}
                className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              {/* Product — in sale modal only */}
              <select
                value={saleForm.productId}
                onChange={(e) =>
                  setSaleForm({ ...saleForm, productId: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              >
                <option value="">Select product from your inventory...</option>
                {personalInventory
                  .filter((item) =>
                    searchSaleProduct
                      ? item.productName
                          .toLowerCase()
                          .includes(searchSaleProduct.toLowerCase())
                      : true,
                  )
                  .map((item) => {
                    const id = item.productId?._id || item.productId;
                    return (
                      <option key={id} value={id}>
                        {item.productName} ({item.qty.toFixed(1)} cartons
                        available)
                      </option>
                    );
                  })}
              </select>
            </div>

            {/* Customer section — in sale modal */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Customer
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddCustomer(!showAddCustomer)}
                  className="text-teal-600 hover:text-teal-800 text-sm font-medium flex items-center gap-1"
                >
                  <FaPlusCircle className="mr-1" />
                  Add New Customer
                </button>
              </div>

              {showAddCustomer && (
                <div className="mb-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    New Customer Details
                  </h4>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Customer Name *"
                      value={newCustomer.name}
                      onChange={(e) =>
                        setNewCustomer({ ...newCustomer, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <input
                      type="text"
                      placeholder="Phone Number *"
                      value={newCustomer.phone}
                      onChange={(e) =>
                        setNewCustomer({
                          ...newCustomer,
                          phone: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <input
                      type="email"
                      placeholder="Email (optional)"
                      value={newCustomer.email}
                      onChange={(e) =>
                        setNewCustomer({
                          ...newCustomer,
                          email: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <textarea
                      placeholder="Address (optional)"
                      value={newCustomer.address}
                      onChange={(e) =>
                        setNewCustomer({
                          ...newCustomer,
                          address: e.target.value,
                        })
                      }
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setNewCustomer({
                            name: "",
                            phone: "",
                            email: "",
                            address: "",
                          })
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={handleAddCustomer}
                        disabled={isSavingCustomer}
                        className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                      >
                        {isSavingCustomer ? "Saving..." : "Save Customer"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <input
                type="text"
                placeholder="Search customers..."
                value={searchSaleCustomer}
                onChange={(e) => setSearchSaleCustomer(e.target.value)}
                className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <div className="relative">
                <select
                  value={saleForm.customerId}
                  onChange={(e) =>
                    setSaleForm({ ...saleForm, customerId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                >
                  <option value="">Select customer...</option>
                  {customers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </select>
                {isLoadingCustomers && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Buyer Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buyer Type
              </label>
              <select
                value={saleForm.buyerType}
                onChange={(e) =>
                  setSaleForm({
                    ...saleForm,
                    buyerType: e.target.value as "pharmacy" | "hospital",
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              >
                <option value="pharmacy">Pharmacy</option>
                <option value="hospital">Hospital</option>
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity (Cartons)
              </label>
              <input
                type="number"
                value={saleForm.qty || ""}
                onChange={(e) =>
                  setSaleForm({
                    ...saleForm,
                    qty: parseFloat(e.target.value) || 0,
                  })
                }
                min="0.1"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              />
            </div>

            {/* Total */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Price (₦){" "}
                <span className="text-xs text-gray-400 font-normal">
                  {MARKUP * 100}% markup applied, editable
                </span>
              </label>
              <input
                type="number"
                value={saleForm.total || ""}
                onChange={(e) =>
                  setSaleForm({
                    ...saleForm,
                    total: parseFloat(e.target.value) || 0,
                  })
                }
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sale Date
              </label>
              <input
                type="date"
                value={
                  saleForm.saleDate || new Date().toISOString().split("T")[0]
                }
                onChange={(e) =>
                  setSaleForm({ ...saleForm, saleDate: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              />
            </div>

            {/* Summary */}
            {saleForm.productId && saleForm.qty > 0 && (
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
                <h4 className="text-sm font-medium text-teal-900 mb-1">
                  Sale Summary
                </h4>
                <p className="text-sm text-teal-900">
                  {products.find((p) => p._id === saleForm.productId)?.name}
                </p>
                <p className="text-sm text-teal-900">
                  {customers.find((c) => c._id === saleForm.customerId)?.name ||
                    "Not selected"}
                </p>
                {(() => {
                  const product = products.find(
                    (p) => p._id === saleForm.productId,
                  );
                  const costPrice =
                    (product?.unitPrice || product?.price || 0) * saleForm.qty;
                  const profit = saleForm.total - costPrice;
                  return (
                    <>
                      <p className="text-sm text-teal-900">
                        Cost price: ₦{costPrice.toLocaleString()}
                      </p>
                      <p className="text-sm font-semibold text-teal-900">
                        Selling price: ₦{saleForm.total.toLocaleString()}
                      </p>
                      <p
                        className={`text-sm font-bold mt-1 ${profit >= 0 ? "text-green-700" : "text-red-600"}`}
                      >
                        Profit: ₦{profit.toLocaleString()}
                      </p>
                    </>
                  );
                })()}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingSale}
                className="flex-1 bg-teal-600 text-white py-2 rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50 text-sm"
              >
                {isSubmittingSale ? "Recording..." : "Record Sale"}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}
