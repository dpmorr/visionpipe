import { Router } from "express";
import { db } from "@db";
import { products } from "@db/schema";
import { eq } from "drizzle-orm";

const router = Router();

/**
 * @openapi
 * /products:
 *   get:
 *     summary: Get all products
 *     tags:
 *       - Products
 *     responses:
 *       200:
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get("/products", async (req, res) => {
  try {
    const allProducts = await db.query.products.findMany({
      orderBy: (products, { asc }) => [asc(products.name)],
    });
    res.json(allProducts);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Create new product
router.post("/products", async (req, res) => {
  try {
    const [newProduct] = await db
      .insert(products)
      .values({
        name: req.body.name,
        description: req.body.description,
        price: req.body.price,
        category: req.body.category,
        imageUrl: req.body.imageUrl || '',
        inStock: req.body.inStock || true,
        tags: req.body.tags || [],
        status: req.body.status || 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    res.status(201).json(newProduct);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ error: "Failed to create product" });
  }
});

// Update product
router.put("/products/:id", async (req, res) => {
  try {
    const [updatedProduct] = await db
      .update(products)
      .set({
        name: req.body.name,
        description: req.body.description,
        price: req.body.price,
        category: req.body.category,
        imageUrl: req.body.imageUrl,
        inStock: req.body.inStock,
        tags: req.body.tags,
        status: req.body.status,
        updatedAt: new Date(),
      })
      .where(eq(products.id, parseInt(req.params.id)))
      .returning();

    if (!updatedProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ error: "Failed to update product" });
  }
});

// Delete product
router.delete("/products/:id", async (req, res) => {
  try {
    const [deletedProduct] = await db
      .delete(products)
      .where(eq(products.id, parseInt(req.params.id)))
      .returning();

    if (!deletedProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

export default router;