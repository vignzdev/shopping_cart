import { Money } from "@shared/domain/money";

export class CartItem {
  constructor(
    public readonly productId: string,
    public name: string,
    public unitPrice: Money,
    public quantity: number,
  ) {}

  lineTotal(): Money {
    return this.unitPrice.multiply(this.quantity);
  }

  clone(): CartItem {
    return new CartItem(this.productId, this.name, this.unitPrice, this.quantity);
  }
}
