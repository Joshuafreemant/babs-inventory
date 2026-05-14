"use client";

import { Card, StatCard } from "@/components/shared/Card";
import { Modal } from "@/components/shared/Modal";
import { Badge } from "@/components/shared/Badge";
import { formatCurrency } from "@/lib/constants";
import type { Product, ModalKey, Customer } from "@/app/api/types";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { FaPlusCircle } from "react-icons/fa";
import { RiHospitalFill } from "react-icons/ri";

// ── Types ────────────────────────────────────────────────────────────────────

interface InstitutionalSale {
  _id?: string;
  productId: any;
  institutionId: any;
  qty: number;
  unitPrice: number;
  total: number;
  paid: boolean;
  saleDate: string | Date;
  dueDate: string | Date;
  productName?: string;
  institution?: string;
}

interface InstitutionalForm {
  productId: string;
  institutionId: string;
  qty: number;
  price: number;
  saleDate: string;
  dueDate: string;
}

// Compute status from paid + dueDate
function getStatus(sale: InstitutionalSale): "paid" | "overdue" | "active" {
  if (sale.paid) return "paid";
  const due = new Date(sale.dueDate);
  return due < new Date() ? "overdue" : "active";
}

interface InstitutionalProps {
  institutional: InstitutionalSale[];
  setInstitutional: (sales: InstitutionalSale[]) => void;
  products: Product[];
  setProducts: (products: Product[]) => void;
  modal: ModalKey;
  setModal: (modal: ModalKey) => void;
}

// ── Component ────────────────────────────────────────────────────────────────

export function InstitutionalComponent({
  institutional,
  setInstitutional,
  products,
  setProducts,
  modal,
  setModal,
}: InstitutionalProps) {
  const [form, setForm] = useState<InstitutionalForm>({
    productId: "",
    institutionId: "",
    qty: 0,
    price: 0,
    saleDate: new Date().toISOString().split("T")[0],
    dueDate: "",
  });

  const [institutions, setInstitutions] = useState<Customer[]>([]);
  const [isLoadingInstitutions, setIsLoadingInstitutions] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchInstitution, setSearchInstitution] = useState("");
  const [searchProduct, setSearchProduct] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingSales, setIsLoadingSales] = useState(false);
  const PAGE_SIZE = 20;

  // Add-new institution form
  const [showAddInstitution, setShowAddInstitution] = useState(false);
  const [newInstitution, setNewInstitution] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });
  const [isSavingInstitution, setIsSavingInstitution] = useState(false);

  // Add-new product form
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

  // ── Derived stats ─────────────────────────────────────────────────────────

  const totalSales = institutional.reduce((sum, s) => sum + s.total, 0);
  const paidAmount = institutional
    .filter((s) => s.paid)
    .reduce((sum, s) => sum + s.total, 0);
  const unpaidAmount = institutional
    .filter((s) => !s.paid)
    .reduce((sum, s) => sum + s.total, 0);

  // ── Data fetching ─────────────────────────────────────────────────────────

  const fetchSales = async (page = 1) => {
    setIsLoadingSales(true);
    try {
      const response = await fetch(
        `/api/institutional-sales?page=${page}&limit=${PAGE_SIZE}`,
      );
      const data = await response.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }

      const sales = (data.data || []).map((s: any) => ({
        ...s,
        productName: s.productId?.name || "",
        institution: s.institutionId?.name || "",
      }));

      setInstitutional(sales);
      setTotalPages(data.pagination?.totalPages || 1);
      setCurrentPage(page);
    } catch {
      toast.error("Failed to load sales");
    } finally {
      setIsLoadingSales(false);
    }
  };

  useEffect(() => {
    fetchSales(1);
  }, []);

  console.log(modal)
  useEffect(() => {
    if (modal === "new_inst") {
      fetchInstitutions();
      fetchProducts();
    }
  }, [modal]);

  // Debounced institution search
  useEffect(() => {
    const id = setTimeout(() => {
      if (modal === "new_inst") fetchInstitutions(searchInstitution);
    }, 300);
    return () => clearTimeout(id);
  }, [searchInstitution]);

  // Debounced product search
  useEffect(() => {
    const id = setTimeout(() => {
      if (modal === "new_inst") fetchProducts(searchProduct);
    }, 300);
    return () => clearTimeout(id);
  }, [searchProduct]);

  const fetchInstitutions = async (search?: string) => {
    setIsLoadingInstitutions(true);
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
      setInstitutions(data.data);
    } catch {
      toast.error("Failed to load institutions");
    } finally {
      setIsLoadingInstitutions(false);
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

  // ── Auto-calculate price ───────────────────────────────────────────────────

  useEffect(() => {
    if (form.productId && form.qty > 0) {
      const product = products.find((p) => p._id === form.productId);
      if (product) {
        const unitPrice =
          product.instPrice || product.unitPrice || product.price || 0;
        setForm((prev) => ({ ...prev, price: unitPrice * prev.qty }));
      }
    } else {
      setForm((prev) => ({ ...prev, price: 0 }));
    }
  }, [form.productId, form.qty, products]);

  // ── Add new institution ───────────────────────────────────────────────────

  const handleAddInstitution = async () => {
    if (!newInstitution.name.trim() || !newInstitution.phone.trim()) {
      toast.error("Name and phone number are required");
      return;
    }
    setIsSavingInstitution(true);
    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newInstitution),
      });
      const data = await response.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }

      setInstitutions((prev) => [...prev, data.data]);
      setForm((prev) => ({ ...prev, institutionId: data.data._id }));
      setNewInstitution({ name: "", phone: "", email: "", address: "" });
      setShowAddInstitution(false);
      toast.success(data.message || "Institution added successfully");
    } catch {
      toast.error("Failed to save institution");
    } finally {
      setIsSavingInstitution(false);
    }
  };

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
      toast.success(data.message || "Product added successfully");
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
      toast.error("Please select a product");
      return;
    }
    if (!form.institutionId) {
      toast.error("Please select an institution");
      return;
    }
    if (form.qty <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }
    if (!form.price || form.price <= 0) {
      toast.error("Price must be greater than 0");
      return;
    }
    if (!form.dueDate) {
      toast.error("Due date is required");
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
      const response = await fetch("/api/institutional-sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }

      const newSale: InstitutionalSale = {
        ...data.data,
        productName: data.data.productId?.name || product.name,
        institution: data.data.institutionId?.name || "Unknown",
      };

      setInstitutional([...institutional, newSale]);

      // Update product stock locally
      setProducts(
        products.map((p) =>
          p._id === product._id ? { ...p, stock: p.stock - form.qty } : p,
        ),
      );

      setForm({
        productId: "",
        institutionId: "",
        qty: 0,
        price: 0,
        saleDate: new Date().toISOString().split("T")[0],
        dueDate: "",
      });
      setModal(null);
      toast.success(data.message || "Sale recorded successfully");
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
      const response = await fetch(
        `/api/institutional-sales/${saleId}/toggle-paid`,
        { method: "PATCH" },
      );
      const data = await response.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }

      setInstitutional(
        institutional.map((s) =>
          s._id === saleId
            ? { ...s, paid: data.data.paid, updatedAt: data.data.updatedAt }
            : s,
        ),
      );
      toast.success(data.message || "Payment status updated");
    } catch {
      toast.error("Failed to update payment status");
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  const getProductName = (sale: InstitutionalSale) => {
    if (sale.productName) return sale.productName;
    if (typeof sale.productId === "object") return sale.productId?.name;
    return products.find((p) => p._id === sale.productId)?.name || "Unknown";
  };

  const getInstitutionName = (sale: InstitutionalSale) => {
    if (sale.institution) return sale.institution;
    if (typeof sale.institutionId === "object") return sale.institutionId?.name;
    return (
      institutions.find((i) => i._id === sale.institutionId)?.name || "Unknown"
    );
  };

  const filteredProducts = searchProduct
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
          p.category?.toLowerCase().includes(searchProduct.toLowerCase()),
      )
    : products;

  const statusBadgeVariant = (sale: InstitutionalSale) => {
    const s = getStatus(sale);
    if (s === "paid") return "success";
    if (s === "overdue") return "error";
    return "info";
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-3 md:p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <div className="mt-16">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Institutional Sales
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">
              Credit sales to institutions with due dates
            </p>
          </div>
          <button
            onClick={() => setModal("new_inst")}
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
            label="Unpaid"
            value={formatCurrency(unpaidAmount)}
            color="red"
          />
        </div>

        {/* Sales list */}
        <Card>
          <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-4">
            Sales List
          </h2>

          {institutional.length === 0 ? (
            <div className="text-center py-8 text-gray-500 flex flex-col items-center gap-2">
              <RiHospitalFill className="text-4xl mb-2" />
              <p>No sales recorded yet</p>
            </div>
          ) : (
            <>
              {/* Mobile */}
              <div className="md:hidden space-y-3">
                {institutional.map((sale) => {
                  const status = getStatus(sale);
                  return (
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
                            {getInstitutionName(sale)}
                          </p>
                        </div>
                        <Badge variant={statusBadgeVariant(sale)}>
                          {status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-600 mb-2 space-y-1">
                        <p>Amount: ₦{sale.total.toLocaleString()}</p>
                        <p>
                          Due: {new Date(sale.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => togglePaid(sale._id as string)}
                        className="w-full text-xs py-1 px-2 border border-gray-300 rounded hover:bg-gray-50"
                      >
                        {sale.paid ? "Mark Unpaid" : "Mark Paid"}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Product
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Institution
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">
                        Qty
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">
                        Amount
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">
                        Sale Date
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">
                        Due Date
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">
                        Status
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {institutional.map((sale) => {
                      const status = getStatus(sale);
                      return (
                        <tr key={sale._id}>
                          <td className="py-3 px-4 text-gray-900">
                            {getProductName(sale)}
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {getInstitutionName(sale)}
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
                          <td className="py-3 px-4 text-center text-gray-600">
                            {new Date(sale.dueDate).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant={statusBadgeVariant(sale)}>
                              {status.toUpperCase()}
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
                      );
                    })}
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
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => fetchSales(currentPage + 1)}
                disabled={currentPage === totalPages || isLoadingSales}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* ── Modal ─────────────────────────────────────────────────────────── */}
        <Modal
          isOpen={modal === "new_inst"}
          onClose={() => setModal(null)}
          title="New Institutional Sale"
        >
          <form onSubmit={handleAddSale} className="space-y-4" noValidate>
            {/* Product Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Product
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddProduct(!showAddProduct);
                    setShowAddInstitution(false);
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                >
                  <FaPlusCircle className=" mr-1" />
                  Add New Product
                </button>
              </div>

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
                value={searchProduct}
                onChange={(e) => setSearchProduct(e.target.value)}
                className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={form.productId}
                onChange={(e) =>
                  setForm({ ...form, productId: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">Select product...</option>
                {filteredProducts.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} (₦
                    {p.instPrice?.toLocaleString() ||
                      p.unitPrice?.toLocaleString() ||
                      p.price?.toLocaleString()}{" "}
                    — {p.stock} in stock)
                  </option>
                ))}
              </select>
            </div>

            {/* Institution Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Institution
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddInstitution(!showAddInstitution);
                    setShowAddProduct(false);
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                >
                  <FaPlusCircle className="mr-1" />
                  Add New Institution
                </button>
              </div>

              {showAddInstitution && (
                <div className="mb-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    New Institution Details
                  </h4>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Institution Name *"
                      value={newInstitution.name}
                      onChange={(e) =>
                        setNewInstitution({
                          ...newInstitution,
                          name: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Phone Number *"
                      value={newInstitution.phone}
                      onChange={(e) =>
                        setNewInstitution({
                          ...newInstitution,
                          phone: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="email"
                      placeholder="Email (optional)"
                      value={newInstitution.email}
                      onChange={(e) =>
                        setNewInstitution({
                          ...newInstitution,
                          email: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <textarea
                      placeholder="Address (optional)"
                      value={newInstitution.address}
                      onChange={(e) =>
                        setNewInstitution({
                          ...newInstitution,
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
                          setNewInstitution({
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
                        onClick={handleAddInstitution}
                        disabled={isSavingInstitution}
                        className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                      >
                        {isSavingInstitution ? "Saving..." : "Save Institution"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <input
                type="text"
                placeholder="Search institutions..."
                value={searchInstitution}
                onChange={(e) => setSearchInstitution(e.target.value)}
                className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="relative">
                <select
                  value={form.institutionId}
                  onChange={(e) =>
                    setForm({ ...form, institutionId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Select institution...</option>
                  {institutions.map((i) => (
                    <option key={i._id} value={i._id}>
                      {i.name} ({i.phone})
                    </option>
                  ))}
                </select>
                {isLoadingInstitutions && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Quantity */}
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
              {form.productId && (
                <p className="text-xs text-gray-400 mt-1">
                  Uses institutional price (instPrice) if set
                </p>
              )}
            </div>

            {/* Sale Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sale Date
              </label>
              <input
                type="date"
                value={form.saleDate}
                onChange={(e) => setForm({ ...form, saleDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* Summary */}
            {form.productId && form.qty > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="text-sm font-medium text-blue-900 mb-2">
                  Sale Summary
                </h4>
                <p className="text-sm text-blue-900">
                  Product:{" "}
                  {products.find((p) => p._id === form.productId)?.name}
                </p>
                <p className="text-sm text-blue-900">
                  Institution:{" "}
                  {institutions.find((i) => i._id === form.institutionId)
                    ?.name || "Not selected"}
                </p>
                {form.dueDate && (
                  <p className="text-sm text-blue-900">
                    Due: {new Date(form.dueDate).toLocaleDateString()}
                  </p>
                )}
                <p className="text-sm font-semibold text-blue-900 mt-1">
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
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isSubmitting ? "Recording Sale..." : "Record Sale"}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}
