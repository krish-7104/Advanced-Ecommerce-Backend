export interface RegisterAdminPayload {
  email: string;
  password: string;
  name: string;
  roleId: string;
}

export interface LoginAdminPayload {
  email: string;
  password: string;
}
