/**
 * Single source of truth for all admin permissions.
 *
 * This config is used:
 *   1. By the seeder (`prisma/seeds/permission.seed.ts`) to populate the Permission table.
 *   2. By the `/permissions/config` API endpoint so the frontend can render
 *      a grouped, human-readable permission picker when creating/editing admins.
 *
 * Format of each permission code: `resource.action`  (e.g. "orders.create")
 */

export interface PermissionEntry {
  code: string;
  action: string;
  description: string;
}

export interface PermissionGroup {
  section: string; // Display section heading (mirrors navigationConfig sections)
  resource: string; // Resource key used in permission codes
  label: string; // Human-readable resource label
  permissions: PermissionEntry[];
}

export const PERMISSIONS_CONFIG: PermissionGroup[] = [
  // ─── General ────────────────────────────────────────────────────────────
  {
    section: "General",
    resource: "dashboard",
    label: "Dashboard",
    permissions: [
      {
        code: "dashboard.view",
        action: "view",
        description: "View dashboard overview and stats",
      },
      {
        code: "dashboard.download",
        action: "download",
        description: "Download dashboard reports",
      },
    ],
  },

  // ─── Catalog ────────────────────────────────────────────────────────────
  {
    section: "Catalog",
    resource: "categories",
    label: "Categories",
    permissions: [
      {
        code: "categories.view",
        action: "view",
        description: "View categories",
      },
      {
        code: "categories.create",
        action: "create",
        description: "Create new categories",
      },
      {
        code: "categories.update",
        action: "update",
        description: "Update existing categories",
      },
      {
        code: "categories.delete",
        action: "delete",
        description: "Delete categories",
      },
    ],
  },
  {
    section: "Catalog",
    resource: "sub-categories",
    label: "Subcategories",
    permissions: [
      {
        code: "sub-categories.view",
        action: "view",
        description: "View subcategories",
      },
      {
        code: "sub-categories.create",
        action: "create",
        description: "Create new subcategories",
      },
      {
        code: "sub-categories.update",
        action: "update",
        description: "Update existing subcategories",
      },
      {
        code: "sub-categories.delete",
        action: "delete",
        description: "Delete subcategories",
      },
    ],
  },
  {
    section: "Catalog",
    resource: "products",
    label: "Products",
    permissions: [
      {
        code: "products.view",
        action: "view",
        description: "View products",
      },
      {
        code: "products.create",
        action: "create",
        description: "Create new products",
      },
      {
        code: "products.update",
        action: "update",
        description: "Update existing products",
      },
      {
        code: "products.delete",
        action: "delete",
        description: "Delete products",
      },
    ],
  },
  {
    section: "Catalog",
    resource: "product-variants",
    label: "Product Variants",
    permissions: [
      {
        code: "product-variants.view",
        action: "view",
        description: "View product variants",
      },
      {
        code: "product-variants.create",
        action: "create",
        description: "Create new product variants",
      },
      {
        code: "product-variants.update",
        action: "update",
        description: "Update existing product variants",
      },
      {
        code: "product-variants.delete",
        action: "delete",
        description: "Delete product variants",
      },
    ],
  },

  // ─── Operations ─────────────────────────────────────────────────────────
  {
    section: "Operations",
    resource: "orders",
    label: "Orders",
    permissions: [
      {
        code: "orders.view",
        action: "view",
        description: "View orders",
      },
      {
        code: "orders.update",
        action: "update",
        description: "Update order status",
      },
    ],
  },
  {
    section: "Operations",
    resource: "users",
    label: "Users",
    permissions: [
      {
        code: "users.view",
        action: "view",
        description: "View customer users",
      },
      {
        code: "users.create",
        action: "create",
        description: "Create customer users",
      },
      {
        code: "users.update",
        action: "update",
        description: "Update customer users",
      },
      {
        code: "users.delete",
        action: "delete",
        description: "Delete customer users",
      },
    ],
  },

  // ─── Access Control ──────────────────────────────────────────────────────
  {
    section: "Access Control",
    resource: "admins",
    label: "Admins",
    permissions: [
      {
        code: "admins.view",
        action: "view",
        description: "View admin users",
      },
      {
        code: "admins.create",
        action: "create",
        description: "Create new admin users",
      },
      {
        code: "admins.update",
        action: "update",
        description: "Update admin users",
      },
      {
        code: "admins.delete",
        action: "delete",
        description: "Delete admin users",
      },
    ],
  },

  // ─── System ──────────────────────────────────────────────────────────────
  {
    section: "System",
    resource: "logs",
    label: "Logs",
    permissions: [
      {
        code: "logs.view",
        action: "view",
        description: "View audit logs",
      },
      {
        code: "logs.create",
        action: "create",
        description: "Create log entries",
      },
      {
        code: "logs.update",
        action: "update",
        description: "Update log entries",
      },
      {
        code: "logs.delete",
        action: "delete",
        description: "Delete log entries",
      },
    ],
  },
];

/**
 * Flat list of all permissions – useful for seeding the database.
 */
export const FLAT_PERMISSIONS = PERMISSIONS_CONFIG.flatMap((group) =>
  group.permissions.map((p) => ({
    resource: group.resource,
    action: p.action,
    code: p.code,
    description: p.description,
  })),
);
