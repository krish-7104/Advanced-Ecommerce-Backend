import { OrderStatus } from "../../../../generated/prisma/enums";

export interface CreateOrderPayload {
  addressId: string;
}

export interface UpdateOrderStatusPayload {
  status: OrderStatus;
}

export interface OrderQueryParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
}
