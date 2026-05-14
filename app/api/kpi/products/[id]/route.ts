// app/api/kpi/products/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import KpiProductModel from '@/app/models/KpiProductModel';

/**
 * PATCH /api/kpi/products/:id
 * Partially updates a KPI product (name, points, active).
 *
 * Body (all fields optional):
 * { name?: string; points?: number; active?: boolean }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  await dbConnect();

  const body = await req.json();
  const update: Record<string, unknown> = { updatedAt: new Date() };

  if (body.name !== undefined) update.name = String(body.name).trim();
  if (body.points !== undefined) update.points = Number(body.points);
  if (body.active !== undefined) update.active = Boolean(body.active);

  const product = await KpiProductModel.findByIdAndUpdate(
    params.id,
    { $set: update },
    { new: true },
  ).lean();

  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  return NextResponse.json(product);
}

/**
 * DELETE /api/kpi/products/:id
 * Permanently removes a KPI product.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  await dbConnect();

  const product = await KpiProductModel.findByIdAndDelete(params.id).lean();

  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  return NextResponse.json({ deleted: true });
}