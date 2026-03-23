import ApiError from "../../../utils/ApiError";
import { prisma } from "../../../utils/prisma";

const IGNORED_KEYS = ["updatedAt", "createdAt", "id"];

const formatValue = (value: any): string => {
  if (value === null || value === undefined) return "null";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

const generateRemarks = (item: {
  action: string;
  entity: string;
  beforeData: Record<string, any> | null;
  afterData: Record<string, any> | null;
}): string => {
  const { action, entity, beforeData, afterData } = item;

  switch (action) {
    case "CREATE": {
      const name = afterData?.name ? ` "${afterData.name}"` : "";
      return `Created new ${entity}${name}.`;
    }

    case "DELETE": {
      const name = beforeData?.name ? ` "${beforeData.name}"` : "";
      return `Deleted ${entity}${name}.`;
    }

    case "UPDATE": {
      if (!beforeData || !afterData) return `Updated ${entity}.`;

      const changes: string[] = [];

      const allKeys = new Set([
        ...Object.keys(beforeData),
        ...Object.keys(afterData),
      ]);

      for (const key of allKeys) {
        if (IGNORED_KEYS.includes(key)) continue;

        const before = formatValue(beforeData[key]);
        const after = formatValue(afterData[key]);

        if (before !== after) {
          changes.push(`${key}: "${before}" to "${after}"`);
        }
      }

      if (changes.length === 0) return `(no visible changes).`;

      return `${changes.join(", ")}.`;
    }

    default:
      return `${action} performed on ${entity}.`;
  }
};

export const getAuditLogService = async () => {
  try {
    const data = await prisma.adminAuditLog.findMany({
      include: {
        admin: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const updatedData = data.map((item) => ({
      ...item,
      remarks: generateRemarks({
        action: item.action,
        entity: item.entity,
        beforeData: item.beforeData as Record<string, any> | null,
        afterData: item.afterData as Record<string, any> | null,
      }),
    }));

    return updatedData;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};
