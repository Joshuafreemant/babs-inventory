"use client";

import { Card, StatCard } from "@/components/shared/Card";
import { Modal } from "@/components/shared/Modal";
import { Badge } from "@/components/shared/Badge";
import { formatCurrency } from "@/lib/constants";
import type { Product, ModalKey } from "@/lib/types";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { FaPlusCircle, FaSearch } from "react-icons/fa";
import { LucidePackageCheck } from "lucide-react";

interface InventoryProps {
  products: Product[];
  setProducts: (products: Product[]) => void;
  modal: ModalKey;
  setModal: (modal: ModalKey) => void;
}

const CATEGORIES = [
  "Antibiotic", "Analgesic", "Antidiabetic", "Antihypertensive",
  "GIT", "Cardiovascular", "Respiratory", "Dermatological",
  "Vitamins", "General", "Other",
];

const emptyProductForm = {
  name: "",
  category: "",
  customCategory: "",
  unitPrice: "",
  instPrice: "",
  cartonQty: "",
  stock: "0",
  expiryDate: "",
  manufacturer: "",
  strength: "",
};

export function Inventory({ products, setProducts, modal, setModal }: InventoryProps) {
  // List state
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 20;

  // Add product form state
  const [newProduct, setNewProduct] = useState(emptyProductForm);
  const [isSaving, setIsSaving] = useState(false);

  // Restock state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState("");
  const [isRestocking, setIsRestocking] = useState(false);

  // Edit state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState(emptyProductForm);
  const [isEditing, setIsEditing] = useState(false);

  // Categories from API
  const [categories, setCategories] = useState<string[]>(CATEGORIES);

  // Derived stats from loaded products
  const totalValue = products.reduce((sum, p) => sum + (p.unitPrice || p.price || 0) * p.stock, 0);
  const lowStockCount = products.filter((p) => p.stock < (p.reorderLevel || 5)).length;

  // Fetch products
  const fetchProducts = async (page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(PAGE_SIZE));
      if (search) params.set("search", search);
      if (filterCategory) params.set("category", filterCategory);
      if (filterLowStock) params.set("lowStock", "true");

      const res = await fetch(`/api/products?${params}`);
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }

      setProducts(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.total || 0);
      setCurrentPage(page);

      // Update categories from response
      if (data.filters?.categories?.length) {
        setCategories([...new Set([...CATEGORIES, ...data.filters.categories])]);
      }
    } catch {
      toast.error("Failed to load products");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(1);
  }, [filterCategory, filterLowStock]);

  // Debounced search
  useEffect(() => {
    const id = setTimeout(() => fetchProducts(1), 300);
    return () => clearTimeout(id);
  }, [search]);

  // Add product
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name.trim() || !newProduct.unitPrice || !newProduct.cartonQty) {
      toast.error("Name, unit price, and carton quantity are required");
      return;
    }
    if (Number(newProduct.unitPrice) < 0) { toast.error("Price cannot be negative"); return; }
    if (Number(newProduct.cartonQty) < 1) { toast.error("Carton quantity must be at least 1"); return; }

    setIsSaving(true);
    try {
      const category = newProduct.customCategory || newProduct.category || "General";
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProduct.name.trim(),
          category,
          unitPrice: Number(newProduct.unitPrice),
          instPrice: Number(newProduct.instPrice) || Number(newProduct.unitPrice),
          cartonQty: Number(newProduct.cartonQty),
          stock: Number(newProduct.stock) || 0,
          expiryDate: newProduct.expiryDate || null,
          manufacturer: newProduct.manufacturer || "",
          strength: newProduct.strength || "",
        }),
      });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }

      toast.success(data.message || "Product added");
      setNewProduct(emptyProductForm);
      setModal(null);
      fetchProducts(1);
    } catch {
      toast.error("Failed to add product");
    } finally {
      setIsSaving(false);
    }
  };

  // Restock
  const handleRestock = async () => {
    if (!selectedProduct || !restockQty || Number(restockQty) <= 0) {
      toast.error("Enter a valid quantity");
      return;
    }
    setIsRestocking(true);
    try {
      const res = await fetch(`/api/products/${selectedProduct._id}/restock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qty: Number(restockQty) }),
      });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }

      // Update locally
      setProducts(products.map((p) =>
        p._id === selectedProduct._id
          ? { ...p, stock: p.stock + Number(restockQty) }
          : p
      ));
      toast.success(`Restocked ${selectedProduct.name} by ${restockQty}`);
      setRestockQty("");
      setSelectedProduct(null);
      setModal(null);
    } catch {
      toast.error("Failed to restock");
    } finally {
      setIsRestocking(false);
    }
  };

  // Open edit modal
  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      category: product.category || "",
      customCategory: "",
      unitPrice: String(product.unitPrice || product.price || ""),
      instPrice: String(product.instPrice || ""),
      cartonQty: String(product.cartonQty || ""),
      stock: String(product.stock),
      expiryDate: product.expiryDate ? String(product.expiryDate).split("T")[0] : "",
      manufacturer: product.manufacturer || "",
      strength: product.strength || "",
    });
    setModal("add_product"); // reuse modal key for editing
  };

  // Save edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setIsEditing(true);
    try {
      const res = await fetch(`/api/products/${editingProduct._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name.trim(),
          category: editForm.customCategory || editForm.category || "General",
          unitPrice: Number(editForm.unitPrice),
          instPrice: Number(editForm.instPrice) || Number(editForm.unitPrice),
          cartonQty: Number(editForm.cartonQty),
          expiryDate: editForm.expiryDate || null,
          manufacturer: editForm.manufacturer,
          strength: editForm.strength,
        }),
      });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }

      toast.success("Product updated");
      setEditingProduct(null);
      setModal(null);
      fetchProducts(currentPage);
    } catch {
      toast.error("Failed to update product");
    } finally {
      setIsEditing(false);
    }
  };

  const isEditMode = modal === "add_product" && editingProduct !== null;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-3 md:p-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <div className="mt-16">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Inventory</h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">
              Manage products and stock levels
              {totalCount > 0 && <span className="ml-2 text-gray-400">({totalCount} products)</span>}
            </p>
          </div>
          <button
            onClick={() => { setEditingProduct(null); setNewProduct(emptyProductForm); setModal("add_product"); }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm md:text-base hover:bg-blue-700 flex items-center gap-2 justify-center md:justify-start"
          >

            <FaPlusCircle />
            Add Product
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-6">
          <StatCard label="Total Products" value={totalCount.toString()} color="blue" />
          <StatCard label="Total Value" value={formatCurrency(totalValue)} color="green" />
          <StatCard label="Low Stock" value={lowStockCount.toString()} color="red" />
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              checked={filterLowStock}
              onChange={(e) => setFilterLowStock(e.target.checked)}
              className="rounded"
            />
            Low Stock Only
          </label>
        </div>

        {/* Products Table */}
        <Card>
          <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-4">Products</h2>

          {isLoading ? (
            <div className="text-center py-12 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 text-gray-500 flex flex-col items-center gap-2">
              <LucidePackageCheck className="text-4xl mb-2 block" />
              <p>No products found</p>
              <button
                onClick={() => { setEditingProduct(null); setNewProduct(emptyProductForm); setModal("add_product"); }}
                className="mt-3 text-blue-600 text-sm hover:underline"
              >
                Add your first product
              </button>
            </div>
          ) : (
            <>
              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {products.map((product) => {
                  const price = product.unitPrice || product.price || 0;
                  const isLow = product.stock < (product.reorderLevel || 5);
                  return (
                    <div key={product._id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900 truncate">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.category}</p>
                        </div>
                        <Badge variant={isLow ? "warning" : "success"}>
                          {product.stock} {isLow ? "⚠" : ""}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600 mb-3">
                        <span>₦{price.toLocaleString()}/carton</span>
                        <span>Value: ₦{(price * product.stock).toLocaleString()}</span>
                      </div>
                      {product.expiryDate && (
                        <p className="text-xs text-orange-600 mb-2">
                          Exp: {new Date(product.expiryDate).toLocaleDateString()}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setSelectedProduct(product); setModal("restock"); }}
                          className="flex-1 bg-gray-100 text-gray-700 py-1.5 rounded text-xs font-medium hover:bg-gray-200"
                        >
                          Restock
                        </button>
                        <button
                          onClick={() => openEdit(product)}
                          className="flex-1 bg-blue-50 text-blue-700 py-1.5 rounded text-xs font-medium hover:bg-blue-100"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Product</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Unit Price</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Stock</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Value</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Expiry</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {products.map((product) => {
                      const price = product.unitPrice || product.price || 0;
                      const isLow = product.stock < (product.reorderLevel || 5);
                      return (
                        <tr key={product._id} className="hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <p className="font-medium text-gray-900">{product.name}</p>
                            {product.strength && <p className="text-xs text-gray-500">{product.strength}</p>}
                          </td>
                          <td className="py-3 px-4 text-gray-600">{product.category || "—"}</td>
                          <td className="py-3 px-4 text-right">₦{price.toLocaleString()}</td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant={isLow ? "warning" : "success"}>
                              {product.stock} {isLow ? "⚠" : ""}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right font-medium">
                            ₦{(price * product.stock).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-center text-gray-600 text-xs">
                            {product.expiryDate
                              ? <span className="text-orange-600">{new Date(product.expiryDate).toLocaleDateString()}</span>
                              : "—"}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-3">
                              <button
                                onClick={() => { setSelectedProduct(product); setModal("restock"); }}
                                className="text-green-600 hover:text-green-800 font-medium"
                              >
                                Restock
                              </button>
                              <button
                                onClick={() => openEdit(product)}
                                className="text-blue-600 hover:text-blue-800 font-medium"
                              >
                                Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => fetchProducts(currentPage - 1)}
                      disabled={currentPage === 1 || isLoading}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => fetchProducts(currentPage + 1)}
                      disabled={currentPage === totalPages || isLoading}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>

        {/* Add / Edit Product Modal */}
        <Modal
          isOpen={modal === "add_product"}
          onClose={() => { setModal(null); setEditingProduct(null); setNewProduct(emptyProductForm); }}
          title={isEditMode ? `Edit: ${editingProduct?.name}` : "Add New Product"}
        >
          <form onSubmit={isEditMode ? handleSaveEdit : handleAddProduct} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 gap-4">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Amoxicillin 500mg"
                  value={isEditMode ? editForm.name : newProduct.name}
                  onChange={(e) => isEditMode
                    ? setEditForm({ ...editForm, name: e.target.value })
                    : setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <div className="flex gap-2">
                  <select
                    value={isEditMode ? editForm.category : newProduct.category}
                    onChange={(e) => isEditMode
                      ? setEditForm({ ...editForm, category: e.target.value, customCategory: "" })
                      : setNewProduct({ ...newProduct, category: e.target.value, customCategory: "" })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select category...</option>
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input
                    type="text"
                    placeholder="Or custom"
                    value={isEditMode ? editForm.customCategory : newProduct.customCategory}
                    onChange={(e) => isEditMode
                      ? setEditForm({ ...editForm, customCategory: e.target.value })
                      : setNewProduct({ ...newProduct, customCategory: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (₦) *</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={isEditMode ? editForm.unitPrice : newProduct.unitPrice}
                    onChange={(e) => isEditMode
                      ? setEditForm({ ...editForm, unitPrice: e.target.value })
                      : setNewProduct({ ...newProduct, unitPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Inst. Price (₦)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={isEditMode ? editForm.instPrice : newProduct.instPrice}
                    onChange={(e) => isEditMode
                      ? setEditForm({ ...editForm, instPrice: e.target.value })
                      : setNewProduct({ ...newProduct, instPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Units/Carton *</label>
                  <input
                    type="number"
                    placeholder="100"
                    value={isEditMode ? editForm.cartonQty : newProduct.cartonQty}
                    onChange={(e) => isEditMode
                      ? setEditForm({ ...editForm, cartonQty: e.target.value })
                      : setNewProduct({ ...newProduct, cartonQty: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {!isEditMode && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Initial Stock</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Strength</label>
                  <input
                    type="text"
                    placeholder="e.g., 500mg"
                    value={isEditMode ? editForm.strength : newProduct.strength}
                    onChange={(e) => isEditMode
                      ? setEditForm({ ...editForm, strength: e.target.value })
                      : setNewProduct({ ...newProduct, strength: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={isEditMode ? editForm.expiryDate : newProduct.expiryDate}
                    onChange={(e) => isEditMode
                      ? setEditForm({ ...editForm, expiryDate: e.target.value })
                      : setNewProduct({ ...newProduct, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
                <input
                  type="text"
                  placeholder="Manufacturer name"
                  value={isEditMode ? editForm.manufacturer : newProduct.manufacturer}
                  onChange={(e) => isEditMode
                    ? setEditForm({ ...editForm, manufacturer: e.target.value })
                    : setNewProduct({ ...newProduct, manufacturer: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setModal(null); setEditingProduct(null); }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || isEditing}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                {isSaving || isEditing ? "Saving..." : isEditMode ? "Save Changes" : "Add Product"}
              </button>
            </div>
          </form>
        </Modal>

        {/* Restock Modal */}
        <Modal
          isOpen={modal === "restock"}
          onClose={() => { setModal(null); setSelectedProduct(null); setRestockQty(""); }}
          title="Restock Product"
        >
          {selectedProduct && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="font-medium text-gray-900">{selectedProduct.name}</p>
                <p className="text-sm text-gray-600 mt-1">
                  Current stock: <span className="font-medium">{selectedProduct.stock} cartons</span>
                </p>
                {selectedProduct.category && (
                  <p className="text-xs text-gray-500 mt-0.5">{selectedProduct.category}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity to Add (Cartons)
                </label>
                <input
                  type="number"
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  placeholder="Enter quantity"
                  min="0.1"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                {restockQty && Number(restockQty) > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    New stock will be: {(selectedProduct.stock + Number(restockQty)).toLocaleString()} cartons
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setModal(null); setSelectedProduct(null); setRestockQty(""); }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRestock}
                  disabled={isRestocking}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 text-sm"
                >
                  {isRestocking ? "Restocking..." : "Confirm Restock"}
                </button>
              </div>
            </div>
          )}
        </Modal>

      </div>
    </div>
  );
}