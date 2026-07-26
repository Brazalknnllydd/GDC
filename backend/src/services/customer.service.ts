import { prisma } from "../lib/prisma.js";
import type { Prisma } from "@prisma/client";

export const CustomerService = {
  async getCustomersPaginated(search: string | undefined, skip: number, take: number) {
    const where: Prisma.CustomerWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { phoneNumber: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const [total, data] = await prisma.$transaction([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
    ]);

    return { total, data };
  },

  async createCustomer(data: Prisma.CustomerUncheckedCreateInput) {
    return await prisma.customer.create({
      data,
    });
  },

  async updateCustomer(id: number, data: Prisma.CustomerUncheckedUpdateInput) {
    return await prisma.customer.update({
      where: { id },
      data,
    });
  },

  async deleteCustomer(id: number) {
    return await prisma.customer.delete({
      where: { id },
    });
  },
};
