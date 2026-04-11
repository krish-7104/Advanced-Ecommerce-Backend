import type { OrderStatus } from "../../generated/prisma/enums.js";
import { prisma } from "./prisma.js";
import { sendHtmlEmail, isMailConfigured } from "./mailer.js";

const DEDUPE_MS = 3 * 60 * 1000;
const recentSends = new Map<string, number>();

function canSend(orderId: string, status: string): boolean {
  const key = `${orderId}:${status}`;
  const now = Date.now();
  const prev = recentSends.get(key);
  if (prev !== undefined && now - prev < DEDUPE_MS) {
    return false;
  }
  recentSends.set(key, now);
  if (recentSends.size > 400) {
    for (const [k, t] of Array.from(recentSends.entries())) {
      if (now - t > DEDUPE_MS) recentSends.delete(k);
    }
  }
  return true;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatInr(amount: unknown): string {
  const n = Number(amount);
  if (Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);
}

function formatAttributes(raw: unknown): string {
  if (raw == null) return "";
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return Object.entries(raw as Record<string, string>)
      .map(([k, v]) => `${k}: ${String(v)}`)
      .join(" · ");
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return formatAttributes(parsed);
    } catch {
      return raw;
    }
  }
  return "";
}

type ItemRow = {
  name: string;
  sku: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  detail: string;
};

function buildItemsTable(rows: ItemRow[]): string {
  if (rows.length === 0) return "";

  const head = `<tr>
    <th align="left" style="padding:10px 12px;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.04em;border-bottom:2px solid #e2e8f0;">Product</th>
    <th align="center" style="padding:10px 8px;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.04em;border-bottom:2px solid #e2e8f0;">Qty</th>
    <th align="right" style="padding:10px 12px;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.04em;border-bottom:2px solid #e2e8f0;">Price</th>
    <th align="right" style="padding:10px 12px;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.04em;border-bottom:2px solid #e2e8f0;">Subtotal</th>
  </tr>`;

  const body = rows
    .map(
      (r) => `<tr>
    <td style="padding:12px 12px;border-bottom:1px solid #e2e8f0;vertical-align:top;">
      <p style="margin:0;font-size:14px;font-weight:600;color:#0f172a;">${escapeHtml(r.name)}</p>
      ${
        r.detail
          ? `<p style="margin:6px 0 0;font-size:12px;color:#64748b;line-height:1.4;">${escapeHtml(r.detail)}</p>`
          : ""
      }
      <p style="margin:6px 0 0;font-size:11px;color:#94a3b8;">SKU ${escapeHtml(r.sku)}</p>
    </td>
    <td align="center" style="padding:12px 8px;border-bottom:1px solid #e2e8f0;vertical-align:top;font-size:14px;color:#334155;">${r.quantity}</td>
    <td align="right" style="padding:12px 12px;border-bottom:1px solid #e2e8f0;vertical-align:top;font-size:14px;color:#334155;">${escapeHtml(r.unitPrice)}</td>
    <td align="right" style="padding:12px 12px;border-bottom:1px solid #e2e8f0;vertical-align:top;font-size:14px;font-weight:600;color:#0f172a;">${escapeHtml(r.lineTotal)}</td>
  </tr>`
    )
    .join("");

  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0;">
  ${head}
  ${body}
</table>`;
}

const copy: Record<
  OrderStatus,
  { subject: string; headline: string; body: string }
> = {
  PENDING: {
    subject: "We received your order",
    headline: "Order placed",
    body: "Thanks for shopping with us. Complete payment when you are ready from your account or checkout link.",
  },
  PAID: {
    subject: "Payment confirmed",
    headline: "Payment received",
    body: "Your payment went through successfully. We will prepare your order for shipment soon.",
  },
  PACKED: {
    subject: "Your order is being packed",
    headline: "Packed & getting ready",
    body: "Your items have been packed and will ship shortly.",
  },
  SHIPPED: {
    subject: "Your order has shipped",
    headline: "On the way",
    body: "Your package is on its way. Track progress from your orders page.",
  },
  DELIVERED: {
    subject: "Your order was delivered",
    headline: "Delivered",
    body: "We hope you enjoy your purchase. Thank you for choosing us.",
  },
  CANCELLED: {
    subject: "Your order was cancelled",
    headline: "Order cancelled",
    body: "This order is now cancelled. If you were charged, a refund will follow your payment provider's timeline.",
  },
  REFUNDED: {
    subject: "Your refund is processed",
    headline: "Refund completed",
    body: "Your refund has been processed. It may take a few business days to appear on your statement.",
  },
};

function buildLayout(params: {
  firstName: string;
  headline: string;
  body: string;
  orderRef: string;
  total: string;
  itemCount: number;
  itemsTableHtml: string;
  ctaUrl: string;
}): string {
  const brand = escapeHtml(process.env.MAIL_FROM_NAME || "Ecommercely");
  const safeHeadline = escapeHtml(params.headline);
  const safeBody = escapeHtml(params.body).replace(/\n/g, "<br/>");
  const safeName = escapeHtml(params.firstName);
  const safeRef = escapeHtml(params.orderRef);
  const safeCta = params.ctaUrl.replace(/"/g, "%22");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeHeadline}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#1e3a5f 0%,#2563eb 100%);padding:28px 32px;">
              <p style="margin:0;font-size:13px;font-weight:600;letter-spacing:0.08em;color:rgba(255,255,255,0.85);text-transform:uppercase;">${brand}</p>
              <h1 style="margin:12px 0 0;font-size:24px;font-weight:700;color:#ffffff;line-height:1.25;">${safeHeadline}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 8px;">
              <p style="margin:0;font-size:16px;line-height:1.6;color:#334155;">Hi ${safeName},</p>
              <p style="margin:16px 0 0;font-size:15px;line-height:1.65;color:#475569;">${safeBody}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.04em;">Order</p>
                    <p style="margin:0;font-size:15px;font-weight:600;color:#0f172a;font-family:ui-monospace,monospace;">${safeRef}</p>
                    <p style="margin:14px 0 4px;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.04em;">Total</p>
                    <p style="margin:0;font-size:18px;font-weight:700;color:#0f172a;">${escapeHtml(params.total)}</p>
                    <p style="margin:12px 0 0;font-size:13px;color:#64748b;">${params.itemCount} line item${params.itemCount === 1 ? "" : "s"}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ${
            params.itemsTableHtml
              ? `<tr>
            <td style="padding:0 32px 24px;">
              <p style="margin:0 0 10px;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.04em;">Items in this order</p>
              <div style="background:#ffffff;border-radius:10px;border:1px solid #e2e8f0;overflow:hidden;">
                ${params.itemsTableHtml}
              </div>
            </td>
          </tr>`
              : ""
          }
          <tr>
            <td style="padding:0 32px 32px;text-align:center;">
              <a href="${safeCta}" style="display:inline-block;padding:14px 28px;background:#2563eb;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;border-radius:10px;">View order</a>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;line-height:1.5;color:#94a3b8;text-align:center;">This is an automated message. Please do not reply directly to this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function notifyOrderStatusEmail(
  orderId: string,
  status: OrderStatus
): void {
  if (!isMailConfigured()) return;
  if (!canSend(orderId, status)) return;

  void (async () => {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
          user: {
            select: { email: true, firstName: true, lastName: true },
          },
        },
      });
      if (!order?.user?.email) return;

      const text = copy[status];
      if (!text) return;

      const first =
        order.user.firstName?.trim() ||
        order.user.email.split("@")[0] ||
        "there";
      const base = (process.env.FRONTEND_URL || "").replace(/\/$/, "");
      const ctaUrl = `${base}/order/${order.id}`;
      const orderRef = `#${order.id.slice(-10).toUpperCase()}`;
      const itemRows: ItemRow[] = order.items.map((item) => {
        const unit = Number(item.price);
        const qty = item.quantity;
        return {
          name: item.name,
          sku: item.sku,
          quantity: qty,
          unitPrice: formatInr(item.price),
          lineTotal: formatInr(unit * qty),
          detail: formatAttributes(item.attributes),
        };
      });
      const itemsTableHtml = buildItemsTable(itemRows);
      const html = buildLayout({
        firstName: first,
        headline: text.headline,
        body: text.body,
        orderRef,
        total: formatInr(order.totalAmount),
        itemCount: order.items.length,
        itemsTableHtml,
        ctaUrl,
      });

      await sendHtmlEmail({
        to: order.user.email,
        subject: text.subject,
        html,
      });
    } catch (err) {
      console.error("[order-email]", orderId, status, err);
    }
  })();
}
