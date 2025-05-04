export interface SellerRequest {
  name: string;
  lastName: string;
  idNumber: string;
  phoneNumber: string;
  birthDate: string;
  email: string;
  password?: string;
  role: string;
}
export interface CreateSellerResponse {
  message: string;
  time: string;
}
