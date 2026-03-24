import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const BRANDS = ["Apple", "Samsung", "Sony", "LG", "Dell", "HP", "Nike", "Adidas", "Puma", "IKEA", "Ashley", "Sephora", "Lorex", "Bose", "JBL"];
const ADJECTIVES = ["Premium", "Pro", "Ultra", "Smart", "Classic", "Modern", "Sleek", "Advanced", "Essential", "Elite", "Compact", "Wireless", "Signature", "Eco"];
const NOUNS = ["Headphones", "Laptop", "TV", "Speaker", "Phone", "Sneakers", "T-Shirt", "Jacket", "Desk", "Chair", "Monitor", "Watch", "Tablet", "Camera", "Microphone"];
const COLORS = ["Black", "White", "Silver", "Gray", "Blue", "Red", "Green", "Gold", "Navy"];
const SIZES = ["S", "M", "L", "XL", "7", "8", "9", "10", "11"];

function generateSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 100000);
}

export async function seedProducts() {
  console.log("🌱 Seeding large dataset of categories, products, and variants...");

  console.log("🧹 Cleaning up existing product and category data...");
  try {
    await prisma.cartItem.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.reviewVotes.deleteMany();
    await prisma.reviews.deleteMany();
    await prisma.productVariant.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany({ where: { NOT: { parentId: null } } });
    await prisma.category.deleteMany();
    console.log("  ✓ Cleanup complete");
  } catch (error) {
    console.warn("  ⚠️ Warning: Cleanup encountered an error (might be first run):", error);
  }

  // 1. Create Base Categories
  const baseCategories = [
    { name: "Electronics", slug: "electronics", children: ["Mobile Phones", "Laptops", "Audio", "Cameras", "Televisions"] },
    { name: "Fashion", slug: "fashion", children: ["Men's Wear", "Women's Wear", "Footwear", "Accessories"] },
    { name: "Home & Furniture", slug: "home", children: ["Living Room", "Bedroom", "Office", "Kitchen"] },
  ];

  const categoryMap = new Map<string, string>(); // category name -> id

  for (const cat of baseCategories) {
    const parent = await prisma.category.create({
      data: {
        name: cat.name,
        slug: cat.slug,
        description: `All things ${cat.name}`,
        level: 0,
      }
    });
    console.log(`  ✓ Category created: ${parent.name}`);

    for (const child of cat.children) {
      const childDoc = await prisma.category.create({
        data: {
          name: child,
          slug: generateSlug(child),
          description: `${child} category`,
          parentId: parent.id,
          level: 1,
        }
      });
      categoryMap.set(childDoc.name, childDoc.id);
      console.log(`    ✓ Subcategory created: ${childDoc.name}`);
    }
  }

  // 2. Generate 150 Products
  const numProducts = 150;
  console.log(`\n📦 Generating ${numProducts} products...`);

  const categoryKeys = Array.from(categoryMap.keys());

  for (let i = 0; i < numProducts; i++) {
    const brand = BRANDS[Math.floor(Math.random() * BRANDS.length)];
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];

    const productName = `${brand} ${adj} ${noun}`;
    const slug = generateSlug(productName);
    
    // Pick a random subcategory
    const randomCatName = categoryKeys[Math.floor(Math.random() * categoryKeys.length)];
    const categoryId = categoryMap.get(randomCatName)!;

    // Determine variant axes
    const useColor = Math.random() > 0.3; // 70% chance to have color variants
    const useSize = Math.random() > 0.5; // 50% chance to have size variants

    let availableColors = COLORS.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 1);
    let availableSizes = SIZES.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 1);

    if (!useColor) availableColors = ["Default"];
    if (!useSize) availableSizes = ["Standard"];

    const attributesSchema: any = {};
    if (useColor) attributesSchema.color = availableColors;
    if (useSize) attributesSchema.size = availableSizes;

    const product = await prisma.product.create({
      data: {
        name: productName,
        slug: slug,
        description: `Experience the amazing quality of the ${productName} by ${brand}. Designed for excellence and everyday use.`,
        categoryId: categoryId,
        attributesSchema: attributesSchema,
        isActive: true,
        isFeatured: Math.random() > 0.85, // 15% chance to be featured
      }
    });

    // Generate variants for the product
    let isDefaultAssigned = false;
    for (const color of availableColors) {
      for (const size of availableSizes) {
        const variantAttributes: any = {};
        if (useColor) variantAttributes.color = color;
        if (useSize) variantAttributes.size = size;

        const basePrice = Math.floor(Math.random() * 90000) + 999;
        
        // Randomly discount some products
        const isDiscounted = Math.random() > 0.7;
        const mrp = isDiscounted ? Math.floor(basePrice * 1.25) : basePrice;

        const variantSku = `SKU-${slug.toUpperCase().substring(0, 6)}-${Math.floor(Math.random() * 1000000)}`;

        await prisma.productVariant.create({
          data: {
            productId: product.id,
            sku: variantSku,
            price: basePrice,
            mrp: mrp,
            stockAvailable: Math.floor(Math.random() * 300),
            stockSold: Math.floor(Math.random() * 100),
            attributes: variantAttributes,
            isActive: true,
            isDefault: !isDefaultAssigned,
          }
        });
        isDefaultAssigned = true;
      }
    }
    
    // Log progress
    if (i > 0 && i % 25 === 0) {
      console.log(`    ... ${i} products generated`);
    }
  }

  console.log(`  ✓ Successfully generated ${numProducts} products with associated variants.`);
  console.log("✅ Database seeding completed entirely!\n");
}
