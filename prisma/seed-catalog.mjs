/**
 * Seeds Categories and Products from the storefront catalog in lib/data.js
 * so the customer cart can reference real Product rows.
 *
 * Idempotent — keyed on slug. Run: node prisma/seed-catalog.mjs
 */
import { PrismaClient } from "@prisma/client";
import { categories, products } from "../lib/data.js";

const prisma = new PrismaClient();

async function main() {
  for (const [i, c] of categories.entries()) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, image: c.image, sortOrder: i },
      create: { slug: c.slug, name: c.name, image: c.image, sortOrder: i },
    });
  }
  console.log(`Categories: ${categories.length}`);

  for (const p of products) {
    const category = await prisma.category.findUnique({ where: { slug: p.category } });
    const data = {
      name: p.name,
      description: p.description,
      categoryId: category?.id ?? null,
      brand: p.brand,
      retailPrice: p.price,
      compareAt: p.compareAt ?? null,
      images: p.images,
      stock: p.stock,
      isActive: true,
    };
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: data,
      create: { slug: p.slug, ...data },
    });
  }
  console.log(`Products: ${products.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
