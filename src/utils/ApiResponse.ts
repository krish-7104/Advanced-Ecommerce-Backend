class ApiResponse {
  statusCode: number;
  data: any;
  message: string;
  success: boolean;
  pagination: any;
  constructor(
    statusCode: number,
    data: any,
    message = "Success",
    pagination?: any
  ) {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
    this.pagination = pagination;
  }
}

export default ApiResponse;
