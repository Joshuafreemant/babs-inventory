"use client";

import { Card, StatCard } from "@/components/shared/Card";
import { Modal } from "@/components/shared/Modal";
import { Badge } from "@/components/shared/Badge";
import { formatCurrency } from "@/lib/constants";
import type {
  DirectSale,
  Product,
  ModalKey,
  DirectSaleForm,
  Customer,
} from "@/app/api/types";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  FaArrowDown,
  FaArrowUp,
  FaPlusCircle,
  FaSearch,
  FaShoppingCart,
  FaSort,
} from "react-icons/fa";

// ─── Types ────────────────────────────────────────────────────────────────────

type SortKey = "saleDate" | "amount" | "status" | "customer" | "product";
type SortOrder = "asc" | "desc";

interface SortConfig {
  key: SortKey;
  order: SortOrder;
}

interface DirectSalesProps {
  directSales: DirectSale[];
  setDirectSales: (sales: DirectSale[]) => void;
  products: Product[];
  modal: ModalKey;
  setModal: (modal: ModalKey) => void;
  setProducts: (products: Product[]) => void;
}

// ─── Sort Bar ─────────────────────────────────────────────────────────────────

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "saleDate", label: "Date" },
  { key: "customer", label: "Customer" },
  { key: "product", label: "Product" },
  { key: "amount", label: "Amount" },
  { key: "status", label: "Status" },
];

function SortBar({
  sort,
  search,
  onSort,
  onSearch,
}: {
  sort: SortConfig;
  search: string;
  onSort: (key: SortKey) => void;
  onSearch: (v: string) => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 mb-4">
      {/* Search */}
      <div className="relative flex-1">
        <FaSearch className=" absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search by customer or product…"
          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Sort pills */}
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-xs text-gray-400 mr-1 hidden sm:inline">
          Sort:
        </span>
        {SORT_OPTIONS.map(({ key, label }) => {
          const active = sort.key === key;
          return (
            <button
              key={key}
              onClick={() => onSort(key)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                active
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-300 hover:border-blue-300 hover:text-blue-600"
              }`}
            >
              {label}
              {active &&
                (sort.order === "asc" ? (
                  <FaArrowUp className="text-xs" />
                ) : (
                  <FaArrowDown className="text-xs" />
                ))}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DirectSalesComponent({
  directSales,
  setDirectSales,
  products,
  modal,
  setModal,
  setProducts,
}: DirectSalesProps) {
  const [form, setForm] = useState<DirectSaleForm>({
    productId: "",
    customerId: "",
    qty: 0,
    price: 0,
    saleDate: "",
  });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingSales, setIsLoadingSales] = useState(false);
  const PAGE_SIZE = 20;

  // ── Sort & search state ───────────────────────────────────────────────────
  const [sort, setSort] = useState<SortConfig>({
    key: "saleDate",
    order: "desc",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // ── Customer / product forms ──────────────────────────────────────────────
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);

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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchCustomer, setSearchCustomer] = useState("");
  const [searchProduct, setSearchProduct] = useState("");

  const totalSales = directSales.reduce((s, x) => s + x.total, 0);
  const paidAmount = directSales
    .filter((s) => s.paid)
    .reduce((s, x) => s + x.total, 0);
  const pendingAmount = directSales
    .filter((s) => !s.paid)
    .reduce((s, x) => s + x.total, 0);

  // ── Fetch helpers ─────────────────────────────────────────────────────────

  const fetchSales = async (
    page = 1,
    overrides: Partial<{
      sort: SortConfig;
      search: string;
      status: string;
    }> = {},
  ) => {
    setIsLoadingSales(true);
    const s = overrides.sort ?? sort;
    const q = overrides.search ?? searchQuery;
    const f = overrides.status ?? statusFilter;

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
        sortBy: s.key,
        order: s.order,
        ...(q ? { search: q } : {}),
        ...(f ? { status: f } : {}),
      });

      const res = await fetch(`/api/direct-sales?${params}`);
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }

      const sales = (data.data || []).map((s: any) => ({
        ...s,
        productName: s.productId?.name || "",
        customer: s.customerId?.name || "",
      }));

      setDirectSales(sales);
      setTotalPages(data.pagination?.totalPages || 1);
      setCurrentPage(page);
    } catch {
      toast.error("Failed to load sales");
    } finally {
      setIsLoadingSales(false);
    }
  };

  const handleSort = (key: SortKey) => {
    const newSort: SortConfig =
      sort.key === key
        ? { key, order: sort.order === "asc" ? "desc" : "asc" }
        : { key, order: "asc" };
    setSort(newSort);
    fetchSales(1, { sort: newSort });
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    fetchSales(1, { search: value });
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    fetchSales(1, { status: value });
  };

  useEffect(() => {
    fetchSales(1);
  }, []);

  // ── Customer / product load on modal open ─────────────────────────────────

  useEffect(() => {
    if (modal === "direct_sale") {
      fetchCustomers();
      fetchProductsModal();
    }
  }, [modal]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (modal === "direct_sale") fetchCustomers(searchCustomer);
    }, 300);
    return () => clearTimeout(t);
  }, [searchCustomer]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (modal === "direct_sale") fetchProductsModal(searchProduct);
    }, 300);
    return () => clearTimeout(t);
  }, [searchProduct]);

  const fetchCustomers = async (search?: string) => {
    setIsLoadingCustomers(true);
    try {
      const params = new URLSearchParams({
        limit: "50",
        ...(search ? { search } : {}),
      });
      const res = await fetch(`/api/customers?${params}`);
      const data = await res.json();
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

  const fetchProductsModal = async (search?: string) => {
    setIsLoadingProducts(true);
    try {
      const params = new URLSearchParams({
        limit: "50",
        ...(search ? { search } : {}),
      });
      const res = await fetch(`/api/products?${params}`);
      const data = await res.json();
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

  // ── Auto-calc price ───────────────────────────────────────────────────────

  useEffect(() => {
    if (form.productId && form.qty > 0) {
      const product = products.find((p) => p._id === form.productId);
      if (product) {
        setForm((prev) => ({
          ...prev,
          price: (product.price || product.unitPrice || 0) * prev.qty,
        }));
      }
    } else {
      setForm((prev) => ({ ...prev, price: 0 }));
    }
  }, [form.productId, form.qty, products]);

  // ── Add customer ──────────────────────────────────────────────────────────

  const handleAddCustomer = async () => {
    if (!newCustomer.name.trim() || !newCustomer.phone.trim()) {
      toast.error("Name and phone are required");
      return;
    }
    setIsSavingCustomer(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCustomer),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }
      setCustomers((prev) => [...prev, data.data]);
      setForm((prev) => ({ ...prev, customerId: data.data._id }));
      setNewCustomer({ name: "", phone: "", email: "", address: "" });
      setShowAddCustomer(false);
      toast.success("Customer added");
    } catch {
      toast.error("Failed to save customer");
    } finally {
      setIsSavingCustomer(false);
    }
  };

  // ── Add product ───────────────────────────────────────────────────────────

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
      const res = await fetch("/api/products", {
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
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }
      setProducts([...products, data.data]);
      setForm((prev) => ({ ...prev, productId: data.data._id }));
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
      toast.success("Product added");
    } catch {
      toast.error("Failed to save product");
    } finally {
      setIsSavingProduct(false);
    }
  };

  // ── Record sale ───────────────────────────────────────────────────────────

  const handleAddSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productId) {
      toast.error("Select a product");
      return;
    }
    if (!form.customerId) {
      toast.error("Select a customer");
      return;
    }
    if (form.qty <= 0) {
      toast.error("Qty must be > 0");
      return;
    }
    if (!form.price || form.price <= 0) {
      toast.error("Price must be > 0");
      return;
    }

    const product = products.find((p) => p._id === form.productId);
    if (!product) {
      toast.error("Product not found");
      return;
    }
    if (form.qty > product.stock) {
      toast.error(`Insufficient stock. Available: ${product.stock}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/direct-sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }

      const newSale: DirectSale = {
        ...data.data,
        productName: data.data.productId?.name || product.name,
        customer: data.data.customerId?.name || "Unknown",
      };
      setDirectSales([newSale, ...directSales]);
      setProducts(
        products.map((p) =>
          p._id === product._id ? { ...p, stock: p.stock - form.qty } : p,
        ),
      );
      setForm({
        productId: "",
        customerId: "",
        qty: 0,
        price: 0,
        saleDate: "",
      });
      setModal(null);
      toast.success("Sale recorded");
    } catch {
      toast.error("Failed to record sale");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Toggle paid ───────────────────────────────────────────────────────────

  const togglePaid = async (saleId: string) => {
    if (!saleId) {
      toast.error("Invalid sale ID");
      return;
    }
    try {
      const res = await fetch(`/api/direct-sales/${saleId}/toggle-paid`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }
      setDirectSales(
        directSales.map((s) =>
          s._id === saleId ? { ...s, paid: data.data.paid } : s,
        ),
      );
      toast.success("Payment status updated");
    } catch {
      toast.error("Failed to update payment status");
    }
  };

  // ── Display helpers ───────────────────────────────────────────────────────

  const getProductName = (sale: DirectSale) => {
    if (sale.productName) return sale.productName;
    if (typeof sale.productId === "object") return (sale.productId as any).name;
    return products.find((p) => p._id === sale.productId)?.name || "Unknown";
  };

  const getCustomerName = (sale: DirectSale) => {
    if (sale.customer) return sale.customer;
    if (typeof sale.customerId === "object")
      return (sale.customerId as any).name;
    return customers.find((c) => c._id === sale.customerId)?.name || "Unknown";
  };

  const filteredProducts = searchProduct
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
          p.category?.toLowerCase().includes(searchProduct.toLowerCase()),
      )
    : products;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-3 md:p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <div className="mt-16">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Direct Sales
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">
              Direct customer transactions
            </p>
          </div>
          <button
            onClick={() => setModal("direct_sale")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm md:text-base hover:bg-blue-700 flex items-center gap-2 justify-center md:justify-start"
          >
            <FaPlusCircle />
            New Sale
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-6">
          <StatCard
            label="Total Sales"
            value={formatCurrency(totalSales)}
            color="blue"
          />
          <StatCard
            label="Paid"
            value={formatCurrency(paidAmount)}
            color="green"
          />
          <StatCard
            label="Pending"
            value={formatCurrency(pendingAmount)}
            color="red"
          />
        </div>

        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <h2 className="text-base md:text-lg font-semibold text-gray-900">
              Sales List
            </h2>

            {/* Status filter */}
            <div className="flex gap-1">
              {[
                ["", "All"],
                ["paid", "Paid"],
                ["pending", "Pending"],
              ].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => handleStatusFilter(val)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    statusFilter === val
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-300 hover:border-blue-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Sort bar */}
          <SortBar
            sort={sort}
            search={searchQuery}
            onSort={handleSort}
            onSearch={handleSearch}
          />

          {directSales.length === 0 ? (
            <div className="text-center py-8 text-gray-500 flex flex-col items-center gap-2">
              <FaShoppingCart className="text-4xl mb-2 block" />
              <p>{isLoadingSales ? "Loading…" : "No sales found"}</p>
            </div>
          ) : (
            <>
              {/* Mobile */}
              <div className="md:hidden space-y-3">
                {directSales.map((sale) => (
                  <div
                    key={sale._id}
                    className="border border-gray-200 rounded-lg p-3"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-sm text-gray-900">
                          {getProductName(sale)}
                        </p>
                        <p className="text-xs text-gray-600">
                          {getCustomerName(sale)}
                        </p>
                      </div>
                      <Badge variant={sale.paid ? "success" : "warning"}>
                        {sale.paid ? "Paid" : "Pending"}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">
                        ₦{sale.total.toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-600">
                        {new Date(sale.saleDate).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      onClick={() => togglePaid(sale._id as string)}
                      className="w-full text-xs py-1 px-2 border border-gray-300 rounded hover:bg-gray-50"
                    >
                      {sale.paid ? "Mark Unpaid" : "Mark Paid"}
                    </button>
                  </div>
                ))}
              </div>

              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-200">
                    <tr>
                      {[
                        { key: "product", label: "Product", align: "left" },
                        { key: "customer", label: "Customer", align: "left" },
                        { key: null, label: "Qty", align: "center" },
                        { key: "amount", label: "Amount", align: "right" },
                        { key: "saleDate", label: "Date", align: "center" },
                        { key: "status", label: "Status", align: "center" },
                        { key: null, label: "Action", align: "center" },
                      ].map(({ key, label, align }) => (
                        <th
                          key={label}
                          onClick={() => key && handleSort(key as SortKey)}
                          className={`py-3 px-4 font-semibold text-gray-700 text-${align} ${key ? "cursor-pointer select-none hover:text-blue-600" : ""}`}
                        >
                          <span className="inline-flex items-center gap-1">
                            {label}
                            {key &&
                              sort.key === key &&
                              (sort.order === "asc" ? (
                                <FaArrowUp className="text-xs text-blue-600" />
                              ) : (
                                <FaArrowDown className="text-xs text-blue-600" />
                              ))}
                            {key && sort.key !== key && (
                              <FaSort className="text-xs text-gray-300" />
                            )}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {directSales.map((sale) => (
                      <tr
                        key={sale._id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 px-4 text-gray-900">
                          {getProductName(sale)}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {getCustomerName(sale)}
                        </td>
                        <td className="py-3 px-4 text-center text-gray-900">
                          {sale.qty}
                        </td>
                        <td className="py-3 px-4 text-right font-medium">
                          ₦{sale.total.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center text-gray-600">
                          {new Date(sale.saleDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={sale.paid ? "success" : "warning"}>
                            {sale.paid ? "Paid" : "Pending"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => togglePaid(sale._id as string)}
                            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                          >
                            {sale.paid ? "Unpaid" : "Paid"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => fetchSales(currentPage - 1)}
                disabled={currentPage === 1 || isLoadingSales}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => fetchSales(currentPage + 1)}
                disabled={currentPage === totalPages || isLoadingSales}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* ── New Direct Sale Modal ── */}
        <Modal
          isOpen={modal === "direct_sale"}
          onClose={() => setModal(null)}
          title="New Direct Sale"
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
                  onClick={() => {
                    setShowAddProduct(!showAddProduct);
                    setShowAddCustomer(false);
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                >
                  <FaPlusCircle className=" mr-1" />
                  Add New Product
                </button>
              </div>

              {showAddProduct && (
                <div className="mb-3 p-3 border border-gray-200 rounded-lg bg-gray-50 space-y-2">
                  <h4 className="text-sm font-medium text-gray-900 mb-1">
                    New Product
                  </h4>
                  <input
                    type="text"
                    placeholder="Product Name *"
                    value={newProduct.name}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    <select
                      value={newProduct.category}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          category: e.target.value,
                        })
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Category…</option>
                      {[
                        "Antibiotic",
                        "Analgesic",
                        "Antidiabetic",
                        "Antihypertensive",
                        "GIT",
                        "Cardiovascular",
                        "Respiratory",
                        "Dermatological",
                        "Vitamins",
                        "Other",
                      ].map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Or type custom"
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          category: e.target.value,
                        })
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
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
                        setNewProduct({ ...newProduct, stock: e.target.value })
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
                      {isSavingProduct ? "Saving…" : "Save Product"}
                    </button>
                  </div>
                </div>
              )}

              <input
                type="text"
                placeholder="Search products…"
                value={searchProduct}
                onChange={(e) => setSearchProduct(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
              />
              <select
                value={form.productId}
                onChange={(e) =>
                  setForm({ ...form, productId: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">Select product…</option>
                {filteredProducts.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} (₦{(p.price ?? p.unitPrice)?.toLocaleString()} —{" "}
                    {p.stock} in stock)
                  </option>
                ))}
              </select>
            </div>

            {/* Customer */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Customer
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCustomer(!showAddCustomer);
                    setShowAddProduct(false);
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                >
                  <FaPlusCircle />
                  Add New Customer
                </button>
              </div>

              {showAddCustomer && (
                <div className="mb-3 p-3 border border-gray-200 rounded-lg bg-gray-50 space-y-2">
                  <h4 className="text-sm font-medium text-gray-900 mb-1">
                    New Customer
                  </h4>
                  <input
                    type="text"
                    placeholder="Name *"
                    value={newCustomer.name}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Phone *"
                    value={newCustomer.phone}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="email"
                    placeholder="Email (optional)"
                    value={newCustomer.email}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      {isSavingCustomer ? "Saving…" : "Save Customer"}
                    </button>
                  </div>
                </div>
              )}

              <input
                type="text"
                placeholder="Search customers…"
                value={searchCustomer}
                onChange={(e) => setSearchCustomer(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
              />
              <div className="relative">
                <select
                  value={form.customerId}
                  onChange={(e) =>
                    setForm({ ...form, customerId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Select customer…</option>
                  {customers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </select>
                {isLoadingCustomers && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                  </div>
                )}
              </div>
            </div>

            {/* Qty */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity (Cartons)
              </label>
              <input
                type="number"
                value={form.qty || ""}
                onChange={(e) =>
                  setForm({ ...form, qty: parseFloat(e.target.value) || 0 })
                }
                min="0.1"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              {form.productId && (
                <p className="text-xs text-gray-500 mt-1">
                  Available:{" "}
                  {products.find((p) => p._id === form.productId)?.stock || 0}{" "}
                  cartons
                </p>
              )}
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (₦){" "}
                <span className="text-xs text-gray-400 font-normal">
                  auto-calculated, editable
                </span>
              </label>
              <input
                type="text"
                value={form.price ? form.price.toLocaleString("en-NG") : ""}
                onChange={(e) => {
                  const raw = e.target.value.replace(/,/g, "");
                  setForm({ ...form, price: parseFloat(raw) || 0 });
                }}
                placeholder="0"
                inputMode="decimal"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sale Date
              </label>
              <input
                type="date"
                value={form.saleDate || new Date().toISOString().split("T")[0]}
                onChange={(e) => setForm({ ...form, saleDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* Summary */}
            {form.productId && form.qty > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900 space-y-1">
                <p className="font-medium mb-1">Sale Summary</p>
                <p>
                  Product:{" "}
                  {products.find((p) => p._id === form.productId)?.name}
                </p>
                <p>
                  Unit Price: ₦
                  {(
                    products.find((p) => p._id === form.productId)?.price ??
                    products.find((p) => p._id === form.productId)?.unitPrice
                  )?.toLocaleString()}
                </p>
                <p>
                  Customer:{" "}
                  {customers.find((c) => c._id === form.customerId)?.name ||
                    "Not selected"}
                </p>
                <p className="font-semibold mt-1">
                  Total: ₦{form.price.toLocaleString()}
                </p>
              </div>
            )}

            {/* Actions */}
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
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                {isSubmitting ? "Recording…" : "Record Sale"}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}
