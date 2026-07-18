import { z } from 'zod';

export const addCashierSchema = z.object({
  allowedCategoryIds: z.array(z.number()).min(1, 'Choose at least one category this cashier can sell.'),
  name: z.string().trim().min(1, 'Cashier name is required.'),
  password: z
    .string()
    .trim()
    .min(1, 'Password is required.')
    .min(6, 'Password must be at least 6 characters.'),
  username: z.string().trim().min(1, 'Username is required.'),
});

export type AddCashierFormValues = z.infer<typeof addCashierSchema>;

export const categoryFormSchema = z.object({
  categoryDescription: z.string().trim().max(180, 'Description is too long.'),
  categoryName: z.string().trim().min(1, 'Category name is required.'),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
