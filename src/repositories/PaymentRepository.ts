// src/repositories/PaymentRepository.ts
import type { Payment, PaymentStatus } from "../types/payment";
import type { ListOptions, Paginated, RepositoryResult } from "./shared";

export interface PaymentListFilters extends ListOptions {
  orderId?: string;
  status?: PaymentStatus;
}

export interface PaymentRepository {
  findById(id: string): Promise<RepositoryResult<Payment>>;
  list(filters?: PaymentListFilters): Promise<RepositoryResult<Paginated<Payment>>>;
  create(payment: Omit<Payment, "id" | "createdAt" | "updatedAt" | "amountRefunded">): Promise<RepositoryResult<Payment>>;
  updateStatus(id: string, status: PaymentStatus): Promise<RepositoryResult<Payment>>;
  refund(id: string, amount: number): Promise<RepositoryResult<Payment>>;
}
