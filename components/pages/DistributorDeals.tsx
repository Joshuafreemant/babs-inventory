"use client";

import { Card, StatCard } from "@/components/shared/Card";
import { Modal } from "@/components/shared/Modal";
import { Badge } from "@/components/shared/Badge";
import { formatCurrency } from "@/lib/constants";
import type { Product, ModalKey, Customer } from "@/app/api/types";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { FaPlusCircle } from "react-icons/fa";
import { FaStore } from "react-icons/fa6";

// ── Types ────────────────────────────────────────────────────────────────────

interface DistribDeal {
  _id?: string;
  productId: any;
  distributorId: any;
  qty: number;
  unitPrice: number;
  upfrontPayment: number;
  balancePayment: number;
  total: number;
  balancePaid: boolean;
  saleDate: string | Date;
  productName?: string;
  distributor?: string;
}

interface DistribDealForm {
  productId: string;
  distributorId: string;
  qty: number;
  price: number;
  upfrontPayment: number;
  saleDate: string;
}

interface DistributorDealsProps {
  distribDeals: DistribDeal[];
  setDistribDeals: any;
  products: Product[];
  setProducts: (products: Product[]) => void;
  modal: ModalKey;
  setModal: (modal: ModalKey) => void;
}

// ── Component ────────────────────────────────────────────────────────────────

export function DistributorDealsComponent({
  distribDeals,
  setDistribDeals,
  products,
  setProducts,
  modal,
  setModal,
}: DistributorDealsProps) {
  const [form, setForm] = useState<DistribDealForm>({
    productId: "",
    distributorId: "",
    qty: 0,
    price: 0,
    upfrontPayment: 0,
    saleDate: "",
  });

  const [distributors, setDistributors] = useState<Customer[]>([]);
  const [isLoadingDistributors, setIsLoadingDistributors] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchDistributor, setSearchDistributor] = useState("");
  const [searchProduct, setSearchProduct] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingDeals, setIsLoadingDeals] = useState(false);
  const PAGE_SIZE = 20;

  // Add-new distributor form
  const [showAddDistributor, setShowAddDistributor] = useState(false);
  const [newDistributor, setNewDistributor] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });
  const [isSavingDistributor, setIsSavingDistributor] = useState(false);

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

  const totalDeals = distribDeals.reduce((sum, d) => sum + d.total, 0);
  const paidUpfront = distribDeals.reduce(
    (sum, d) => sum + d.upfrontPayment,
    0,
  );
  const balancePending = distribDeals
    .filter((d) => !d.balancePaid)
    .reduce((sum, d) => sum + d.balancePayment, 0);

  // ── Data fetching ─────────────────────────────────────────────────────────

  const fetchDeals = async (page = 1) => {
    setIsLoadingDeals(true);
    try {
      const response = await fetch(
        `/api/distrib-deals?page=${page}&limit=${PAGE_SIZE}`,
      );
      const data = await response.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }

      const deals = (data.data || []).map((d: any) => ({
        ...d,
        productName: d.productId?.name || "",
        distributor: d.distributorId?.name || "",
      }));

      setDistribDeals(deals);
      setTotalPages(data.pagination?.totalPages || 1);
      setCurrentPage(page);
    } catch {
      toast.error("Failed to load deals");
    } finally {
      setIsLoadingDeals(false);
    }
  };

  useEffect(() => {
    fetchDeals(1);
  }, []);

  useEffect(() => {
    if (modal === "new_deal") {
      fetchDistributors();
      fetchProducts();
    }
  }, [modal]);

  // Debounced distributor search
  useEffect(() => {
    const id = setTimeout(() => {
      if (modal === "new_deal") fetchDistributors(searchDistributor);
    }, 300);
    return () => clearTimeout(id);
  }, [searchDistributor]);

  // Debounced product search
  useEffect(() => {
    const id = setTimeout(() => {
      if (modal === "new_deal") fetchProducts(searchProduct);
    }, 300);
    return () => clearTimeout(id);
  }, [searchProduct]);

  const fetchDistributors = async (search?: string) => {
    setIsLoadingDistributors(true);
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
      setDistributors(data.data);
    } catch {
      toast.error("Failed to load distributors");
    } finally {
      setIsLoadingDistributors(false);
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
        const unitPrice = product.price || product.unitPrice || 0;
        setForm((prev) => ({ ...prev, price: unitPrice * prev.qty }));
      }
    } else {
      setForm((prev) => ({ ...prev, price: 0 }));
    }
  }, [form.productId, form.qty, products]);

  // ── Add new distributor ───────────────────────────────────────────────────

  const handleAddDistributor = async () => {
    if (!newDistributor.name.trim() || !newDistributor.phone.trim()) {
      toast.error("Name and phone number are required");
      return;
    }
    setIsSavingDistributor(true);
    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDistributor),
      });
      const data = await response.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }

      setDistributors((prev) => [...prev, data.data]);
      setForm((prev) => ({ ...prev, distributorId: data.data._id }));
      setNewDistributor({ name: "", phone: "", email: "", address: "" });
      setShowAddDistributor(false);
      toast.success(data.message || "Distributor added successfully");
    } catch {
      toast.error("Failed to save distributor");
    } finally {
      setIsSavingDistributor(false);
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

  // ── Create deal ───────────────────────────────────────────────────────────

  const handleAddDeal = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.productId) {
      toast.error("Please select a product");
      return;
    }
    if (!form.distributorId) {
      toast.error("Please select a distributor");
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
    if (form.upfrontPayment < 0) {
      toast.error("Upfront payment cannot be negative");
      return;
    }
    if (form.upfrontPayment > form.price) {
      toast.error("Upfront payment cannot exceed total price");
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
      const response = await fetch("/api/distrib-deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }

      const newDeal: DistribDeal = {
        ...data.data,
        productName: data.data.productId?.name || product.name,
        distributor: data.data.distributorId?.name || "Unknown",
      };

      setDistribDeals([...distribDeals, newDeal]);

      // Update product stock locally
      setProducts(
        products.map((p) =>
          p._id === product._id ? { ...p, stock: p.stock - form.qty } : p,
        ),
      );

      setForm({
        productId: "",
        distributorId: "",
        qty: 0,
        price: 0,
        upfrontPayment: 0,
        saleDate: "",
      });
      setModal(null);
      toast.success(data.message || "Deal created successfully");
    } catch {
      toast.error("Failed to create deal");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Toggle balance ────────────────────────────────────────────────────────

  const toggleBalance = async (dealId: string) => {
    if (!dealId) {
      toast.error("Invalid deal ID");
      return;
    }
    try {
      const response = await fetch(
        `/api/distrib-deals/${dealId}/toggle-balance`,
        {
          method: "PATCH",
        },
      );
      const data = await response.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }

      setDistribDeals(
        distribDeals.map((d) =>
          d._id === dealId
            ? {
                ...d,
                balancePaid: data.data.balancePaid,
                updatedAt: data.data.updatedAt,
              }
            : d,
        ),
      );
      toast.success(data.message || "Balance status updated");
    } catch {
      toast.error("Failed to update balance status");
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  const getProductName = (deal: DistribDeal) => {
    if (deal.productName) return deal.productName;
    if (typeof deal.productId === "object") return deal.productId?.name;
    return products.find((p) => p._id === deal.productId)?.name || "Unknown";
  };

  const getDistributorName = (deal: DistribDeal) => {
    if (deal.distributor) return deal.distributor;
    if (typeof deal.distributorId === "object") return deal.distributorId?.name;
    return (
      distributors.find((d) => d._id === deal.distributorId)?.name || "Unknown"
    );
  };

  const filteredProducts = searchProduct
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
          p.category?.toLowerCase().includes(searchProduct.toLowerCase()),
      )
    : products;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-3 md:p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <div className="mt-16">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Distributor Deals
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">
              Split payment transactions
            </p>
          </div>
          <button
            onClick={() => setModal("new_deal")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm md:text-base hover:bg-blue-700 flex items-center gap-2 justify-center md:justify-start"
          >
            <FaPlusCircle />
            New Deal
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-6">
          <StatCard
            label="Total Deals"
            value={formatCurrency(totalDeals)}
            color="blue"
          />
          <StatCard
            label="Upfront Paid"
            value={formatCurrency(paidUpfront)}
            color="green"
          />
          <StatCard
            label="Balance Pending"
            value={formatCurrency(balancePending)}
            color="red"
          />
        </div>

        {/* Deals list */}
        <Card>
          <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-4">
            Active Deals
          </h2>

          {distribDeals.length === 0 ? (
            <div className="text-center py-8 text-gray-500 flex flex-col items-center gap-2">
              <FaStore className="text-4xl mb-2" />
              <p>No deals recorded yet</p>
            </div>
          ) : (
            <>
              {/* Mobile */}
              <div className="md:hidden space-y-3">
                {distribDeals.map((deal) => (
                  <div
                    key={deal._id}
                    className="border border-gray-200 rounded-lg p-3"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-sm text-gray-900">
                          {getProductName(deal)}
                        </p>
                        <p className="text-xs text-gray-600">
                          {getDistributorName(deal)}
                        </p>
                      </div>
                      <Badge variant={deal.balancePaid ? "success" : "warning"}>
                        {deal.balancePaid ? "Completed" : "Pending"}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-600 mb-2 space-y-1">
                      <p>Upfront: ₦{deal.upfrontPayment.toLocaleString()}</p>
                      <p>Balance: ₦{deal.balancePayment.toLocaleString()}</p>
                      <p>Total: ₦{deal.total.toLocaleString()}</p>
                      <p>{new Date(deal.saleDate).toLocaleDateString()}</p>
                    </div>
                    <button
                      onClick={() => toggleBalance(deal._id as string)}
                      className="w-full text-xs py-1 px-2 border border-gray-300 rounded hover:bg-gray-50"
                    >
                      {deal.balancePaid ? "Mark Pending" : "Mark Balance Paid"}
                    </button>
                  </div>
                ))}
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
                        Distributor
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">
                        Qty
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">
                        Upfront
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">
                        Balance
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">
                        Total
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">
                        Date
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
                    {distribDeals.map((deal) => (
                      <tr key={deal._id}>
                        <td className="py-3 px-4 text-gray-900">
                          {getProductName(deal)}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {getDistributorName(deal)}
                        </td>
                        <td className="py-3 px-4 text-center text-gray-900">
                          {deal.qty}
                        </td>
                        <td className="py-3 px-4 text-right text-green-600">
                          ₦{deal.upfrontPayment.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right text-orange-600">
                          ₦{deal.balancePayment.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-gray-900">
                          ₦{deal.total.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center text-gray-600">
                          {new Date(deal.saleDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge
                            variant={deal.balancePaid ? "success" : "warning"}
                          >
                            {deal.balancePaid ? "Complete" : "Pending"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => toggleBalance(deal._id as string)}
                            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                          >
                            {deal.balancePaid ? "Unpaid" : "Paid"}
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
                onClick={() => fetchDeals(currentPage - 1)}
                disabled={currentPage === 1 || isLoadingDeals}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => fetchDeals(currentPage + 1)}
                disabled={currentPage === totalPages || isLoadingDeals}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* ── Modal ─────────────────────────────────────────────────────────── */}
        <Modal
          isOpen={modal === "new_deal"}
          onClose={() => setModal(null)}
          title="New Distributor Deal"
        >
          <form onSubmit={handleAddDeal} className="space-y-4" noValidate>
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
                    setShowAddDistributor(false);
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                >
                  <FaPlusCircle className="mr-1" />
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
                    {p.price?.toLocaleString() ||
                      p.unitPrice?.toLocaleString()}{" "}
                    — {p.stock} in stock)
                  </option>
                ))}
              </select>
            </div>

            {/* Distributor Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Distributor
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddDistributor(!showAddDistributor);
                    setShowAddProduct(false);
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                >
                  <FaPlusCircle className="mr-1" />
                  Add New Distributor
                </button>
              </div>

              {showAddDistributor && (
                <div className="mb-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    New Distributor Details
                  </h4>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Distributor Name *"
                      value={newDistributor.name}
                      onChange={(e) =>
                        setNewDistributor({
                          ...newDistributor,
                          name: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Phone Number *"
                      value={newDistributor.phone}
                      onChange={(e) =>
                        setNewDistributor({
                          ...newDistributor,
                          phone: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="email"
                      placeholder="Email (optional)"
                      value={newDistributor.email}
                      onChange={(e) =>
                        setNewDistributor({
                          ...newDistributor,
                          email: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <textarea
                      placeholder="Address (optional)"
                      value={newDistributor.address}
                      onChange={(e) =>
                        setNewDistributor({
                          ...newDistributor,
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
                          setNewDistributor({
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
                        onClick={handleAddDistributor}
                        disabled={isSavingDistributor}
                        className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                      >
                        {isSavingDistributor ? "Saving..." : "Save Distributor"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <input
                type="text"
                placeholder="Search distributors..."
                value={searchDistributor}
                onChange={(e) => setSearchDistributor(e.target.value)}
                className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="relative">
                <select
                  value={form.distributorId}
                  onChange={(e) =>
                    setForm({ ...form, distributorId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Select distributor...</option>
                  {distributors.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} ({d.phone})
                    </option>
                  ))}
                </select>
                {isLoadingDistributors && (
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

            {/* Total Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Price (₦){" "}
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

            {/* Upfront Payment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upfront Payment (₦)
              </label>
              
              <input
                type="text"
                value={
                  form.upfrontPayment
                    ? form.upfrontPayment.toLocaleString("en-NG")
                    : ""
                }
                onChange={(e) => {
                  const raw = e.target.value.replace(/,/g, "");
                  setForm({ ...form, upfrontPayment: parseFloat(raw) || 0 });
                }}
                placeholder="0"
                inputMode="decimal"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
             
              {form.price > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Balance due: ₦
                  {Math.max(
                    0,
                    form.price - form.upfrontPayment,
                  ).toLocaleString()}
                </p>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deal Date
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
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="text-sm font-medium text-blue-900 mb-2">
                  Deal Summary
                </h4>
                <p className="text-sm text-blue-900">
                  Product:{" "}
                  {products.find((p) => p._id === form.productId)?.name}
                </p>
                <p className="text-sm text-blue-900">
                  Distributor:{" "}
                  {distributors.find((d) => d._id === form.distributorId)
                    ?.name || "Not selected"}
                </p>
                <p className="text-sm text-blue-900">
                  Upfront: ₦{form.upfrontPayment.toLocaleString()}
                </p>
                <p className="text-sm text-blue-900">
                  Balance: ₦
                  {Math.max(
                    0,
                    form.price - form.upfrontPayment,
                  ).toLocaleString()}
                </p>
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
                {isSubmitting ? "Creating Deal..." : "Create Deal"}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}
