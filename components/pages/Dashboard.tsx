"use client";

import { StatCard, Card } from "@/components/shared/Card";
import { Badge } from "@/components/shared/Badge";
import { formatCurrency } from "@/lib/constants";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { IoIosRefreshCircle } from "react-icons/io";
import { GoAlertFill } from "react-icons/go";
import { FcClock } from "react-icons/fc";
import { FaPills, FaReceipt } from "react-icons/fa";
import { GiCash } from "react-icons/gi";
import { TbAlertOctagonFilled } from "react-icons/tb";
import { LucidePackageCheck } from "lucide-react";
interface DashboardStats {
  totalRevenue: number;
  totalUnpaid: number;
  totalProducts: number;
  totalStock: number;
  overdueCount: number;
  expiredCount: number;
  expiringCount: number;
  lowStockCount: number;
  revenueBreakdown: {
    direct: number;
    distributor: number;
    institutional: number;
  };
}

interface RecentSale {
  _id: string;
  type: "Direct" | "Distributor" | "Institutional";
  productName: string;
  party: string;
  total: number;
  paid: boolean;
  date: string;
  dueDate?: string;
}

interface AlertProduct {
  _id: string;
  name: string;
  expiryDate?: string;
  stock: number;
  category?: string;
  reorderLevel?: number;
}

interface OverdueInstitutional {
  _id: string;
  institution: string;
  productName: string;
  total: number;
  dueDate: string;
}

export function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [alerts, setAlerts] = useState<{
    expired: AlertProduct[];
    expiring: AlertProduct[];
    lowStock: AlertProduct[];
    overdue: OverdueInstitutional[];
  }>({ expired: [], expiring: [], lowStock: [], overdue: [] });

  const fetchDashboard = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/dashboard");
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      setStats(data.stats);
      setRecentSales(data.recentSales || []);
      setAlerts(data.alerts || { expired: [], expiring: [], lowStock: [], overdue: [] });
    } catch {
      toast.error("Failed to load dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const typeBadgeVariant = (type: string) => {
    if (type === "Direct") return "success";
    if (type === "Distributor") return "default";
    return "warning";
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-3 md:p-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-16">Dashboard</h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">Sales Overview & Key Metrics</p>
          </div>
          <button
            onClick={fetchDashboard}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
          
            <IoIosRefreshCircle />
            Refresh
          </button>
        </div>

        {/* Alert Banner — expired/expiring/overdue */}
        {(alerts.expired.length > 0 || alerts.expiring.length > 0 || alerts.overdue.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            {alerts.expired.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <GoAlertFill className="text-red-500 text-lg mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-700">{alerts.expired.length} Expired Product{alerts.expired.length > 1 ? "s" : ""}</p>
                  <p className="text-xs text-red-600 mt-0.5">{alerts.expired.slice(0, 2).map(p => p.name).join(", ")}{alerts.expired.length > 2 ? ` +${alerts.expired.length - 2} more` : ""}</p>
                </div>
              </div>
            )}
            {alerts.expiring.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-2">
                <FcClock className=" text-orange-500 text-lg mt-0.5"/>
                <div>
                  <p className="text-sm font-semibold text-orange-700">{alerts.expiring.length} Expiring Soon</p>
                  <p className="text-xs text-orange-600 mt-0.5">{alerts.expiring.slice(0, 2).map(p => p.name).join(", ")}{alerts.expiring.length > 2 ? ` +${alerts.expiring.length - 2} more` : ""}</p>
                </div>
              </div>
            )}
            {alerts.overdue.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                <FaReceipt className="text-yellow-600 text-lg mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-yellow-700">{alerts.overdue.length} Overdue Payment{alerts.overdue.length > 1 ? "s" : ""}</p>
                  <p className="text-xs text-yellow-600 mt-0.5">{alerts.overdue.slice(0, 2).map(p => p.institution).join(", ")}{alerts.overdue.length > 2 ? ` +${alerts.overdue.length - 2} more` : ""}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Main Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <StatCard label="Total Revenue" value={formatCurrency(stats?.totalRevenue || 0)} icon={<GiCash />}  color="green" />
          <StatCard label="Unpaid Amount" value={formatCurrency(stats?.totalUnpaid || 0)} icon={<TbAlertOctagonFilled  />} color="red" />
          <StatCard label="Total Stock" value={(stats?.totalStock || 0).toString()} icon={<LucidePackageCheck />} color="blue" />
          <StatCard label="Products" value={(stats?.totalProducts || 0).toString()} icon={<FaPills  />} color="purple" />
        </div>

        {/* Revenue Breakdown */}
        <Card className="mb-6">
          <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-4">Revenue Breakdown</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Direct Sales", value: stats?.revenueBreakdown.direct || 0, color: "text-blue-600" },
              { label: "Distributor", value: stats?.revenueBreakdown.distributor || 0, color: "text-green-600" },
              { label: "Institutional", value: stats?.revenueBreakdown.institutional || 0, color: "text-purple-600" },
            ].map(({ label, value, color }) => {
              const total = stats?.totalRevenue || 1;
              const pct = Math.round((value / total) * 100);
              return (
                <div key={label} className="text-center">
                  <p className={`text-lg md:text-xl font-bold ${color}`}>{formatCurrency(value)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                  <div className="mt-2 bg-gray-100 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full bg-current ${color}`} style={{ width: `${pct}%` }}></div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{pct}%</p>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Recent Sales */}
        <Card className="mb-6">
          <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-4">Recent Sales</h2>

          {recentSales.length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-6">No sales recorded yet</p>
          ) : (
            <>
              {/* Mobile */}
              <div className="md:hidden space-y-3">
                {recentSales.map((sale) => (
                  <div key={sale._id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <p className="font-medium text-sm text-gray-900">{sale.productName}</p>
                        <p className="text-xs text-gray-500">{sale.party}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={typeBadgeVariant(sale.type)}>{sale.type}</Badge>
                        <Badge variant={sale.paid ? "success" : "warning"}>{sale.paid ? "Paid" : "Pending"}</Badge>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600 mt-1">
                      <span className="font-medium">₦{sale.total.toLocaleString()}</span>
                      <span>{new Date(sale.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Product</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Party</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Type</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Amount</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {recentSales.map((sale) => (
                      <tr key={sale._id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-900 font-medium">{sale.productName}</td>
                        <td className="py-3 px-4 text-gray-600">{sale.party}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={typeBadgeVariant(sale.type)}>{sale.type}</Badge>
                        </td>
                        <td className="py-3 px-4 text-right font-medium">₦{sale.total.toLocaleString()}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={sale.paid ? "success" : "warning"}>{sale.paid ? "Paid" : "Pending"}</Badge>
                        </td>
                        <td className="py-3 px-4 text-center text-gray-500">
                          {new Date(sale.date).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Card>

        {/* Expiry Alerts */}
        {(alerts.expired.length > 0 || alerts.expiring.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {alerts.expired.length > 0 && (
              <Card className="border-l-4 border-l-red-500">
                <h2 className="text-base font-semibold text-red-700 mb-3 flex items-center gap-2">
                  <GoAlertFill/>
                  Expired Products ({alerts.expired.length})
                </h2>
                <div className="space-y-2">
                  {alerts.expired.map((p) => (
                    <div key={p._id} className="flex justify-between items-center text-sm">
                      <div>
                        <p className="font-medium text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-500">{p.category} • {p.stock} in stock</p>
                      </div>
                      <span className="text-red-600 text-xs font-medium">
                        {p.expiryDate ? new Date(p.expiryDate).toLocaleDateString() : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {alerts.expiring.length > 0 && (
              <Card className="border-l-4 border-l-orange-400">
                <h2 className="text-base font-semibold text-orange-700 mb-3 flex items-center gap-2">
                  <FcClock />
                  Expiring Within 30 Days ({alerts.expiring.length})
                </h2>
                <div className="space-y-2">
                  {alerts.expiring.map((p) => {
                    const daysLeft = p.expiryDate
                      ? Math.ceil((new Date(p.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                      : null;
                    return (
                      <div key={p._id} className="flex justify-between items-center text-sm">
                        <div>
                          <p className="font-medium text-gray-900">{p.name}</p>
                          <p className="text-xs text-gray-500">{p.category} • {p.stock} in stock</p>
                        </div>
                        <span className="text-orange-600 text-xs font-medium">
                          {daysLeft !== null ? `${daysLeft}d left` : "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Low Stock & Overdue */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alerts.lowStock.length > 0 && (
            <Card className="border-l-4 border-l-yellow-400">
              <h2 className="text-base font-semibold text-yellow-700 mb-3 flex items-center gap-2">
                <LucidePackageCheck />
                Low Stock ({alerts.lowStock.length})
              </h2>
              <div className="space-y-2">
                {alerts.lowStock.map((p) => (
                  <div key={p._id} className="flex justify-between items-center text-sm">
                    <div>
                      <p className="font-medium text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.category}</p>
                    </div>
                    <span className="text-yellow-700 text-xs font-medium bg-yellow-50 px-2 py-0.5 rounded">
                      {p.stock} / {p.reorderLevel || 5} min
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {alerts.overdue.length > 0 && (
            <Card className="border-l-4 border-l-red-500">
              <h2 className="text-base font-semibold text-red-700 mb-3 flex items-center gap-2">
                <FaReceipt />
                Overdue Institutional Payments ({alerts.overdue.length})
              </h2>
              <div className="space-y-2">
                {alerts.overdue.map((s) => (
                  <div key={s._id} className="flex justify-between items-center text-sm">
                    <div>
                      <p className="font-medium text-gray-900">{s.institution}</p>
                      <p className="text-xs text-gray-500">{s.productName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-600">₦{s.total.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">{new Date(s.dueDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

      </div>
    </div>
  );
}