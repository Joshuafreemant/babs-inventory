// app/api/dashboard/route.ts
import { dbConnect } from "@/lib/db";

import "@/app/models/CustomerModel";
import "@/app/models/ProductModel";
import "@/app/models/DistribDealModel";
import "@/app/models/InstitutionalSaleModel";

import DirectSaleModel from "@/app/models/DirectSaleModel";
import DistribDealModel from "@/app/models/DistribDealModel";
import InstitutionalSaleModel from "@/app/models/InstitutionalSaleModel";
import ProductModel from "@/app/models/ProductModel";

export async function GET() {
  try {
    await dbConnect();

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Run all queries in parallel
    const [
      // Revenue stats
      directSalesStats,
      distribDealsStats,
      institutionalStats,

      // Unpaid amounts
      unpaidDirect,
      unpaidDistrib,
      unpaidInstitutional,

      // Recent sales (5 each)
      recentDirect,
      recentDistrib,
      recentInstitutional,

      // Product stats
      totalProducts,
      totalStock,
      expiredProducts,
      expiringProducts,
      lowStockProducts,
    ] = await Promise.all([
      // Total revenue per type
      DirectSaleModel.aggregate([{ $group: { _id: null, total: { $sum: "$total" } } }]),
      DistribDealModel.aggregate([{ $group: { _id: null, total: { $sum: "$total" } } }]),
      InstitutionalSaleModel.aggregate([{ $group: { _id: null, total: { $sum: "$total" } } }]),

      // Unpaid
      DirectSaleModel.aggregate([{ $match: { paid: false } }, { $group: { _id: null, total: { $sum: "$total" } } }]),
      DistribDealModel.aggregate([{ $match: { balancePaid: false } }, { $group: { _id: null, total: { $sum: "$balancePayment" } } }]),
      InstitutionalSaleModel.aggregate([{ $match: { paid: false } }, { $group: { _id: null, total: { $sum: "$total" } } }]),

      // Recent direct sales
      DirectSaleModel.find()
        .sort({ saleDate: -1 })
        .limit(5)
        .populate("productId", "name")
        .populate("customerId", "name")
        .lean(),

      // Recent distrib deals
      DistribDealModel.find()
        .sort({ saleDate: -1 })
        .limit(5)
        .populate("productId", "name")
        .populate("distributorId", "name")
        .lean(),

      // Recent institutional sales
      InstitutionalSaleModel.find()
        .sort({ saleDate: -1 })
        .limit(5)
        .populate("productId", "name")
        .populate("institutionId", "name")
        .lean(),

      // Product counts
      ProductModel.countDocuments({ isActive: true }),
      ProductModel.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, total: { $sum: "$stock" } } },
      ]),

      // Expired: expiryDate < now
      ProductModel.find({
        isActive: true,
        expiryDate: { $lt: now, $ne: null },
      })
        .select("name expiryDate stock category")
        .sort({ expiryDate: 1 })
        .limit(10)
        .lean(),

      // Expiring soon: expiryDate between now and 30 days
      ProductModel.find({
        isActive: true,
        expiryDate: { $gte: now, $lte: thirtyDaysFromNow },
      })
        .select("name expiryDate stock category")
        .sort({ expiryDate: 1 })
        .limit(10)
        .lean(),

      // Low stock
      ProductModel.find({
        isActive: true,
        $expr: { $lte: ["$stock", "$reorderLevel"] },
      })
        .select("name stock reorderLevel category")
        .sort({ stock: 1 })
        .limit(10)
        .lean(),
    ]);

    // Overdue institutional
    const overdueInstitutional = await InstitutionalSaleModel.find({
      paid: false,
      dueDate: { $lt: now },
    })
      .populate("productId", "name")
      .populate("institutionId", "name")
      .sort({ dueDate: 1 })
      .limit(10)
      .lean();

    // Combine revenue
    const totalRevenue =
      (directSalesStats[0]?.total || 0) +
      (distribDealsStats[0]?.total || 0) +
      (institutionalStats[0]?.total || 0);

    const totalUnpaid =
      (unpaidDirect[0]?.total || 0) +
      (unpaidDistrib[0]?.total || 0) +
      (unpaidInstitutional[0]?.total || 0);

    // Merge and sort recent sales across departments
    const recentSales = [
      ...recentDirect.map((s: any) => ({
        _id: s._id,
        type: "Direct",
        productName: s.productId?.name || "Unknown",
        party: s.customerId?.name || "Unknown",
        total: s.total,
        paid: s.paid,
        date: s.saleDate,
      })),
      ...recentDistrib.map((s: any) => ({
        _id: s._id,
        type: "Distributor",
        productName: s.productId?.name || "Unknown",
        party: s.distributorId?.name || "Unknown",
        total: s.total,
        paid: s.balancePaid,
        date: s.saleDate,
      })),
      ...recentInstitutional.map((s: any) => ({
        _id: s._id,
        type: "Institutional",
        productName: s.productId?.name || "Unknown",
        party: s.institutionId?.name || "Unknown",
        total: s.total,
        paid: s.paid,
        date: s.saleDate,
        dueDate: s.dueDate,
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    return Response.json({
      stats: {
        totalRevenue,
        totalUnpaid,
        totalProducts,
        totalStock: totalStock[0]?.total || 0,
        overdueCount: overdueInstitutional.length,
        expiredCount: expiredProducts.length,
        expiringCount: expiringProducts.length,
        lowStockCount: lowStockProducts.length,
        revenueBreakdown: {
          direct: directSalesStats[0]?.total || 0,
          distributor: distribDealsStats[0]?.total || 0,
          institutional: institutionalStats[0]?.total || 0,
        },
      },
      recentSales,
      alerts: {
        expired: expiredProducts,
        expiring: expiringProducts,
        lowStock: lowStockProducts,
        overdue: overdueInstitutional.map((s: any) => ({
          _id: s._id,
          institution: s.institutionId?.name || "Unknown",
          productName: s.productId?.name || "Unknown",
          total: s.total,
          dueDate: s.dueDate,
        })),
      },
    }, { status: 200 });

  } catch (error: any) {
    console.error("Dashboard error:", error);
    return Response.json({ error: error.message || "Failed to load dashboard" }, { status: 500 });
  }
}