import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export async function seedProducts() {
  console.log("🌱 Seeding categories and products...");

  console.log("🧹 Cleaning up existing product and category data...");
  try {
    // Delete in reverse order of dependencies
    await prisma.cartItem.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.productVariant.deleteMany();
    await prisma.product.deleteMany();

    await prisma.category.deleteMany({ where: { NOT: { parentId: null } } });
    await prisma.category.deleteMany();
    console.log("  ✓ Cleanup complete");
  } catch (error) {
    console.warn(
      "  ⚠️ Warning: Cleanup encountered an error (might be first run):",
      error,
    );
  }

  // 1. Create Categories
  const categories = [
    {
      name: "Electronics",
      slug: "electronics",
      description: "Gadgets and devices",
      children: [
        {
          name: "Mobile Phones",
          slug: "mobile-phones",
          description: "Smartphones and feature phones",
        },
        {
          name: "Laptops",
          slug: "laptops",
          description: "High performance laptops",
        },
        { name: "Tablets", slug: "tablets", description: "Portable tablets" },
      ],
    },
    {
      name: "Fashion",
      slug: "fashion",
      description: "Clothing and accessories",
      children: [
        {
          name: "Men's Wear",
          slug: "mens-wear",
          description: "Clothing for men",
        },
        {
          name: "Women's Wear",
          slug: "womens-wear",
          description: "Clothing for women",
        },
      ],
    },
    {
      name: "Home",
      slug: "home",
      description: "Home appliances and furniture",
      children: [
        {
          name: "Furniture",
          slug: "furniture",
          description: "Sofas, beds, and more",
        },
        { name: "Decor", slug: "decor", description: "Home decoration items" },
      ],
    },
  ];

  for (const cat of categories) {
    const parent = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        level: 0,
      },
    });
    console.log(`  ✓ Category created: ${parent.name}`);

    for (const child of cat.children) {
      await prisma.category.upsert({
        where: { slug: child.slug },
        update: {},
        create: {
          name: child.name,
          slug: child.slug,
          description: child.description,
          parentId: parent.id,
          level: 1,
        },
      });
      console.log(`    ✓ Subcategory created: ${child.name}`);
    }
  }

  // 2. Create Products
  const mobileCategory = await prisma.category.findUnique({
    where: { slug: "mobile-phones" },
  });

  if (mobileCategory) {
    // iPhone 16 Pro
    const iPhoneAttrs = {
      color: [
        "Black Titanium",
        "Blue Titanium",
        "Natural Titanium",
        "White Titanium",
      ],
      storage: ["128GB", "256GB", "512GB", "1TB"],
    };

    const iPhone = await prisma.product.upsert({
      where: { slug: "iphone-16-pro" },
      update: {
        categoryId: mobileCategory.id,
        attributesSchema: iPhoneAttrs,
      },
      create: {
        name: "iPhone 16 Pro",
        slug: "iphone-16-pro",
        description: "The ultimate iPhone.",
        categoryId: mobileCategory.id,
        attributesSchema: iPhoneAttrs,
        isActive: true,
        isFeatured: true,
      },
    });
    console.log(`  ✓ Product created: ${iPhone.name}`);

    // Create Variants for iPhone
    const iPhoneVariants = [
      {
        color: "Black Titanium",
        storage: "128GB",
        price: 99900,
        sku: "IP16PRO-BLK-128",
        isDefault: true,
      },
      {
        color: "Black Titanium",
        storage: "256GB",
        price: 109900,
        sku: "IP16PRO-BLK-256",
        isDefault: false,
      },
      {
        color: "Blue Titanium",
        storage: "128GB",
        price: 99900,
        sku: "IP16PRO-BLU-128",
        isDefault: false,
      },
      {
        color: "Natural Titanium",
        storage: "128GB",
        price: 99900,
        sku: "IP16PRO-NAT-128",
        isDefault: false,
      },
    ];

    for (const v of iPhoneVariants) {
      // Construct attributes json based on simple key-value
      const variantAttributes = {
        color: v.color,
        storage: v.storage,
      };

      await prisma.productVariant.upsert({
        where: { sku: v.sku },
        update: {
          productId: iPhone.id,
          attributes: variantAttributes,
        },
        create: {
          productId: iPhone.id,
          sku: v.sku,
          price: v.price,
          stockAvailable: 50,
          attributes: variantAttributes,
          isActive: true,
          isDefault: v.isDefault,
        },
      });
      console.log(`    ✓ Variant created: ${v.sku}`);
    }

    // Samsung S24 Ultra
    const s24Attrs = {
      color: ["Titanium Gray", "Titanium Black", "Titanium Violet"],
      storage: ["256GB", "512GB", "1TB"],
    };

    const samsungS24 = await prisma.product.upsert({
      where: { slug: "samsung-s24-ultra" },
      update: {
        categoryId: mobileCategory.id,
        attributesSchema: s24Attrs,
      },
      create: {
        name: "Samsung Galaxy S24 Ultra",
        slug: "samsung-s24-ultra",
        description: "Galaxy AI is here.",
        categoryId: mobileCategory.id,
        attributesSchema: s24Attrs,
        isActive: true,
        isFeatured: true,
      },
    });
    console.log(`  ✓ Product created: ${samsungS24.name}`);

    const s24Variants = [
      {
        color: "Titanium Gray",
        storage: "256GB",
        price: 129999,
        sku: "S24U-GRY-256",
        isDefault: true,
      },
      {
        color: "Titanium Black",
        storage: "512GB",
        price: 139999,
        sku: "S24U-BLK-512",
        isDefault: false,
      },
    ];

    for (const v of s24Variants) {
      const variantAttributes = {
        color: v.color,
        storage: v.storage,
      };
      await prisma.productVariant.upsert({
        where: { sku: v.sku },
        update: {
          productId: samsungS24.id,
          attributes: variantAttributes,
        },
        create: {
          productId: samsungS24.id,
          sku: v.sku,
          price: v.price,
          stockAvailable: 30,
          attributes: variantAttributes,
          isActive: true,
          isDefault: v.isDefault,
        },
      });
      console.log(`    ✓ Variant created: ${v.sku}`);
    }
  }

  // 3. Create Fashion Product
  const mensCategory = await prisma.category.findUnique({
    where: { slug: "mens-wear" },
  });
  if (mensCategory) {
    const tshirtAttrs = {
      size: ["S", "M", "L", "XL"],
      color: ["Black", "White", "Navy"],
    };

    const tshirt = await prisma.product.upsert({
      where: { slug: "classic-cotton-tshirt" },
      update: {
        categoryId: mensCategory.id,
        attributesSchema: tshirtAttrs,
      },
      create: {
        name: "Classic Cotton T-Shirt",
        slug: "classic-cotton-tshirt",
        description: "Premium cotton essential t-shirt.",
        categoryId: mensCategory.id,
        attributesSchema: tshirtAttrs,
        isActive: true,
        isFeatured: false,
      },
    });
    console.log(`  ✓ Product created: ${tshirt.name}`);

    const tshirtVariants = [
      {
        size: "M",
        color: "Black",
        sku: "TSHIRT-M-BLK",
        price: 1999,
        isDefault: true,
      },
      {
        size: "L",
        color: "Black",
        sku: "TSHIRT-L-BLK",
        price: 1999,
        isDefault: false,
      },
      {
        size: "M",
        color: "White",
        sku: "TSHIRT-M-WHT",
        price: 1999,
        isDefault: false,
      },
    ];

    for (const v of tshirtVariants) {
      const variantAttributes = {
        size: v.size,
        color: v.color,
      };
      await prisma.productVariant.upsert({
        where: { sku: v.sku },
        update: {
          productId: tshirt.id,
          attributes: variantAttributes,
        },
        create: {
          productId: tshirt.id,
          sku: v.sku,
          price: v.price,
          stockAvailable: 100,
          attributes: variantAttributes,
          isActive: true,
          isDefault: v.isDefault,
        },
      });
      console.log(`    ✓ Variant created: ${v.sku}`);
    }
  }

  console.log("✅ Category and Product seeding completed!\n");
}
