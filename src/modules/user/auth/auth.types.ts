export interface RegisterUserPayload {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginUserPayload {
  email: string;
  password: string;
}

export type UserUpdatePayload = {
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  email?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  emailVerifiedAt?: Date | null;
  phoneVerifiedAt?: Date | null;
};

export type AboutUserQueryParams = {
  address?: boolean | string;
  addressCount?: boolean | string;
  cart?: boolean | string;
  cartCount?: boolean | string;
  order?: boolean | string;
  orderCount?: boolean | string;
};
