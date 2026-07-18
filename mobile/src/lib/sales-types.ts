export type CustomerRef = {
  name: string;
} | null;

export type SaleItem = {
  id?: number;
  price?: number | string;
  quantity: number;
  subtotal: number | string;
  product?: {
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
  amountPaid: number | string;
  changeAmount: number | string;
  paymentMethod: string;
  user?: {
    id?: number;
    name: string;
    username?: string;
  } | null;
  customer?: CustomerRef;
  createdAt: string;
  items: SaleItem[];
};
