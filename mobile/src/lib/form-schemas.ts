import { z } from 'zod';

const cashierBaseSchema = z.object({
  allowedCategoryIds: z.array(z.number()).min(1, 'Choose at least one category this cashier can sell.'),
  name: z.string().trim().min(1, 'Cashier name is required.'),
  username: z.string().trim().min(1, 'Username is required.'),
});

export const addCashierSchema = cashierBaseSchema.extend({
  password: z
    .string()
    .trim()
    .min(1, 'Password is required.')
    .min(6, 'Password must be at least 6 characters.'),
});

export const editCashierSchema = cashierBaseSchema.extend({
  password: z.string().trim().optional().default(''),
}).superRefine((values, context) => {
  if (values.password && values.password.length < 6) {
    context.addIssue({
      code: z.ZodIssueCode.too_small,
      minimum: 6,
      inclusive: true,
      message: 'Password must be at least 6 characters.',
      type: 'string',
    });
  }
});

export type AddCashierFormValues = z.infer<typeof addCashierSchema>;
export type EditCashierFormValues = z.infer<typeof editCashierSchema>;

export const categoryFormSchema = z.object({
  categoryDescription: z.string().trim().max(180, 'Description is too long.'),
  categoryName: z.string().trim().min(1, 'Category name is required.'),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
