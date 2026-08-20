import { PRODUCT_DESCRIPTION, PRODUCT_TITLE } from "@/constants/validation";
import { ValidationError } from "@shared/domain/errors";
import { Money } from "@shared/domain/money";

export type ProductProps = {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  imageUrl?: string;
  imageKey?: string;
};

export class Product {
  readonly id: string;
  name: string;
  description: string | undefined;
  price: Money;
  stock: number;
  imageUrl: string | undefined;
  imageKey: string | undefined;

  private constructor(props: ProductProps) {
    this.id = props.id;
    this.name = props.name;
    this.description = props.description;
    this.price = new Money(props.price);
    this.stock = props.stock;
    this.imageUrl = props.imageUrl;
    this.imageKey = props.imageKey;
  }

  static create(props: ProductProps): Product {
    Product.assertValid(props);
    return new Product({
      ...props,
      name: props.name.trim(),
      description: props.description?.trim() || undefined,
      imageUrl: props.imageUrl?.trim() || undefined,
      imageKey: props.imageKey?.trim() || undefined,
    });
  }

  updateDetails(updates: {
    name?: string;
    description?: string;
    price?: number;
    stock?: number;
    imageUrl?: string;
    imageKey?: string;
  }): void {
    const next: ProductProps = {
      id: this.id,
      name: updates.name ?? this.name,
      description:
        updates.description !== undefined
          ? updates.description
          : this.description,
      price: updates.price ?? this.price.amount,
      stock: updates.stock ?? this.stock,
      imageUrl: updates.imageUrl ?? this.imageUrl,
      imageKey: updates.imageKey ?? this.imageKey,
    };

    Product.assertValid(next);
    this.name = next.name.trim();
    this.description = next.description?.trim() || undefined;
    this.price = new Money(next.price);
    this.stock = next.stock;
    this.imageUrl = next.imageUrl?.trim() || undefined;
    this.imageKey = next.imageKey?.trim() || undefined;
  }

  hasStock(quantity: number): boolean {
    return this.stock >= quantity;
  }

  clone(): Product {
    return Product.create({
      id: this.id,
      name: this.name,
      description: this.description,
      price: this.price.amount,
      stock: this.stock,
      imageUrl: this.imageUrl,
      imageKey: this.imageKey,
    });
  }

  private static assertValid(props: ProductProps): void {
    if (!props.id.trim()) {
      throw new ValidationError("Product id is required");
    }

    const name = props.name.trim();
    if (
      name.length < PRODUCT_TITLE.MIN_LENGTH ||
      name.length > PRODUCT_TITLE.MAX_LENGTH
    ) {
      throw new ValidationError(
        `Name must be between ${PRODUCT_TITLE.MIN_LENGTH} and ${PRODUCT_TITLE.MAX_LENGTH} characters`,
      );
    }

    const description = props.description?.trim() ?? "";
    if (description.length > PRODUCT_DESCRIPTION.MAX_LENGTH) {
      throw new ValidationError(
        `Description must be ${PRODUCT_DESCRIPTION.MAX_LENGTH} characters or fewer`,
      );
    }

    if (!Number.isFinite(props.price) || props.price <= 0) {
      throw new ValidationError("Price must be positive");
    }

    if (!Number.isInteger(props.stock) || props.stock < 0) {
      throw new ValidationError("Stock cannot be negative");
    }

    const hasUrl = Boolean(props.imageUrl?.trim());
    const hasKey = Boolean(props.imageKey?.trim());
    if (hasUrl !== hasKey) {
      throw new ValidationError("Image URL and storage key must be set together");
    }
  }
}
