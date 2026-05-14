// app/api/kpi/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import KpiRecordModel from '@/app/models/KpiRecordModel';
import InstitutionalSaleModel from '@/app/models/InstitutionalSaleModel';
import DistribDealModel from '@/app/models/DistribDealModel';
import DirectSaleModel from '@/app/models/DirectSaleModel';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function monthBounds(year: number, month: number) {
  return {
    start: new Date(year, month - 1, 1),
    end: new Date(year, month, 1), // exclusive
  };
}

async function getSalesForMonth(year: number, month: number) {
  const { start, end } = monthBounds(year, month);
  const dateFilter = { saleDate: { $gte: start, $lt: end } };

  const [instAgg, distribAgg, directAgg, distinctInstitutions] = await Promise.all([
    InstitutionalSaleModel.aggregate([
      { $match: dateFilter },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    DistribDealModel.aggregate([
      { $match: dateFilter },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    DirectSaleModel.aggregate([
      { $match: dateFilter },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    InstitutionalSaleModel.distinct('institutionId', dateFilter),
  ]);

  return {
    institutional: instAgg[0]?.total ?? 0,
    distributor:   distribAgg[0]?.total ?? 0,
    direct:        directAgg[0]?.total ?? 0,
    institutionalVisits: distinctInstitutions.length,
  };
}

// ─── GET /api/kpi?months=2025-1,2025-3 ───────────────────────────────────────

export async function GET(req: NextRequest) {
  await dbConnect();

  const { searchParams } = new URL(req.url);
  const monthsParam = searchParams.get('months');

  if (!monthsParam) {
    return NextResponse.json(
      { error: 'months query param required — e.g. ?months=2025-1,2025-3' },
      { status: 400 },
    );
  }

  const parsed = monthsParam
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const [year, month] = s.split('-').map(Number);
      return { year, month };
    })
    .filter(({ year, month }) => year > 2000 && month >= 1 && month <= 12);

  if (!parsed.length) {
    return NextResponse.json({ error: 'No valid month keys provided' }, { status: 400 });
  }

  const [records, ...salesDataArr] = await Promise.all([
    KpiRecordModel.find({ $or: parsed.map(({ year, month }) => ({ year, month })) })
      .populate('productEntries.productId', 'name points active')
      .lean(),
    ...parsed.map(({ year, month }) => getSalesForMonth(year, month)),
  ]);

  const result = parsed.map(({ year, month }, i) => {
    const rec   = records.find((r) => r.year === year && r.month === month);
    const sales = salesDataArr[i];
    const actualSales = sales.institutional + sales.distributor + sales.direct;

    return {
      _id:          rec?._id,
      month,
      year,
      salesTarget:        rec?.salesTarget        ?? 0,
      cmePr:              rec?.cmePr              ?? 0,
      cmePrTarget:        rec?.cmePrTarget        ?? 2,
      dailyReports:       rec?.dailyReports       ?? 0,
      dailyReportsTarget: rec?.dailyReportsTarget ?? 20,
      productEntries:     rec?.productEntries     ?? [],
      // ── computed live ──
      actualSales,
      salesBreakdown: {
        institutional: sales.institutional,
        distributor:   sales.distributor,
        direct:        sales.direct,
      },
      institutionalVisits: sales.institutionalVisits,
    };
  });

  return NextResponse.json(result);
}

// ─── POST /api/kpi ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  await dbConnect();

  const body = await req.json();
  const {
    month,
    year,
    salesTarget        = 0,
    cmePr              = 0,
    cmePrTarget        = 2,
    dailyReports       = 0,
    dailyReportsTarget = 20,
    productEntries     = [],
  } = body;

  if (!month || !year) {
    return NextResponse.json({ error: 'month and year are required' }, { status: 400 });
  }

  const sales       = await getSalesForMonth(year, month);
  const actualSales = sales.institutional + sales.distributor + sales.direct;

  const record = await KpiRecordModel.findOneAndUpdate(
    { month, year },
    {
      $set: {
        salesTarget,
        actualSales,
        institutionalVisits: sales.institutionalVisits,
        cmePr,
        cmePrTarget,
        dailyReports,
        dailyReportsTarget,
        productEntries,
        updatedAt: new Date(),
      },
    },
    { upsert: true, new: true },
  )
    .populate('productEntries.productId', 'name points active')
    .lean();

  return NextResponse.json({
    ...record,
    actualSales,
    institutionalVisits: sales.institutionalVisits,
    salesBreakdown: {
      institutional: sales.institutional,
      distributor:   sales.distributor,
      direct:        sales.direct,
    },
  });
}