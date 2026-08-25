export type CustomerRef = {
  name: string;
} | null;

export type SaleItem = {
  id?: number;
  productId?: number;
  price?: number | string;
  quantity: number;
  subtotal: number | string;
  product?: {
    id?: number;
    costPrice?: number | string;
    name: string;
  };
};

export type SaleRecord = {
  id: number;
  receiptNumber: string;
  totalAmount: number | string;
  subtotal?: number | string;
  discountAmount?: number | string;
  taxAmount?: number | string;
  amountPaid: number | string;
  changeAmount: number | string;
  paymentMethod: string;
  paymentReference?: string | null;
  status?: string;
  notes?: string | null;
  isPrinted?: boolean;
  user?: {
    id?: number;
    name: string;
    username?: string;
  } | null;
  customer?: CustomerRef;
  createdAt: string;
  updatedAt?: string;
  items: SaleItem[];
};
