// app/api/kpi/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import KpiProductModel from '@/app/models/KpiProductModel';

/**
 * GET /api/kpi/products
 * Returns all KPI products sorted by name.
 */
export async function GET() {
  await dbConnect();
  const products = await KpiProductModel.find({}).sort({ name: 1 }).lean();
  return NextResponse.json(products);
}

/**
 * POST /api/kpi/products
 * Creates a new KPI product.
 *
 * Body: { name: string; points: number }
 */
export async function POST(req: NextRequest) {
  await dbConnect();

  const body = await req.json();
  const { name, points } = body;

  if (!name?.trim() || points == null || isNaN(Number(points))) {
    return NextResponse.json(
      { error: 'name (string) and points (number) are required' },
      { status: 400 },
    );
  }

  const product = await KpiProductModel.create({
    name: name.trim(),
    points: Number(points),
    active: true,
  });

  return NextResponse.json(product, { status: 201 });
}