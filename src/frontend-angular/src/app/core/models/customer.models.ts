export interface CreateCustomerRequest {
  taxNumber: string;
  title: string;
  address: string;
  eMail: string;
}

export interface UpdateCustomerRequest {
  taxNumber: string;
  title: string;
  address: string;
  eMail: string;
}

export interface CustomerResponse {
  customerId: number;
  taxNumber: string;
  title: string;
  address: string;
  eMail: string;
  userId: number;
  recordDate: string;
}