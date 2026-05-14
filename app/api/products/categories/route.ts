// app/api/products/categories/route.ts
import { dbConnect } from "@/lib/db";
import ProductModel from "@/app/models/ProductModel";

export async function GET(req: Request) {
  try {
    await dbConnect();
    
    const categories = await ProductModel.distinct('category', { isActive: true });
    
    // Get product count per category
    const categoryStats = await ProductModel.aggregate([
      { $match: { isActive: true } },
      { 
        $group: { 
          _id: '$category', 
          count: { $sum: 1 },
          totalStock: { $sum: '$stock' },
          totalValue: { $sum: { $multiply: ['$stock', '$unitPrice'] } }
        } 
      },
      { $sort: { _id: 1 } }
    ]);

    return Response.json({ 
      data: categories,
      stats: categoryStats.map(stat => ({
        category: stat._id,
        productCount: stat.count,
        totalStock: stat.totalStock,
        totalValue: stat.totalValue
      }))
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return Response.json({ 
      error: error.message || "Failed to fetch categories",
      message: "Categories not fetched" 
    }, { status: 500 });
  }
}