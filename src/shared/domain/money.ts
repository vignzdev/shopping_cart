import { ValidationError } from "@shared/domain/errors";

function roundToCents(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export class Money {
  readonly amount: number;
  readonly currency: string;

  constructor(amount: number, currency = "USD") {
    if (!Number.isFinite(amount) || amount < 0) {
      throw new ValidationError("Money amount must be a non-negative number");
    }

    this.amount = roundToCents(amount);
    this.currency = currency;
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new ValidationError("Cannot add money with different currencies");
    }

    return new Money(this.amount + other.amount, this.currency);
  }

  multiply(quantity: number): Money {
    if (!Number.isFinite(quantity) || quantity < 0) {
      throw new ValidationError("Quantity must be a non-negative number");
    }

    return new Money(this.amount * quantity, this.currency);
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }
}
