class ApiResponse {
  statusCode: number;
  data: any;
  message: string;
  success: boolean;
  pagination: any;
  constructor(
    statusCode: number,
    data: any,
    pagination?: any,
    message = "Success"
  ) {
    this.statusCode = statusCode;
    this.data = data;
    this.pagination = pagination;
    this.message = message;
    this.success = statusCode < 400;
  }
}

export default ApiResponse;
