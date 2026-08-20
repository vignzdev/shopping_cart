import { Product } from "@product/domain/product";
import type { ProductRepository } from "@product/domain/productRepository";
import { getSupabase } from "@shared/infrastructure/supabase/client";

type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  price: number | string;
  stock: number;
  image_url: string | null;
  image_key: string | null;
};

export class SupabaseProductRepository implements ProductRepository {
  async add(product: Product): Promise<Product> {
    const { data, error } = await getSupabase()
      .from("products")
      .insert(toRow(product))
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to add product");
    }

    return toProduct(data);
  }

  async update(product: Product): Promise<Product> {
    const { data, error } = await getSupabase()
      .from("products")
      .update({
        name: product.name,
        description: product.description ?? null,
        price: product.price.amount,
        stock: product.stock,
        image_url: product.imageUrl ?? null,
        image_key: product.imageKey ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", product.id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to update product");
    }

    return toProduct(data);
  }

  async delete(id: string): Promise<boolean> {
    const { data, error } = await getSupabase()
      .from("products")
      .delete()
      .eq("id", id)
      .select("id");

    if (error) {
      throw new Error(error.message);
    }

    return (data?.length ?? 0) > 0;
  }

  async getById(id: string): Promise<Product | null> {
    const { data, error } = await getSupabase()
      .from("products")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? toProduct(data) : null;
  }

  async list(): Promise<Product[]> {
    const { data, error } = await getSupabase()
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map(toProduct);
  }
}

function toRow(product: Product) {
  return {
    id: product.id,
    name: product.name,
    description: product.description ?? null,
    price: product.price.amount,
    stock: product.stock,
    image_url: product.imageUrl ?? null,
    image_key: product.imageKey ?? null,
  };
}

function toProduct(row: ProductRow): Product {
  return Product.create({
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    price: Number(row.price),
    stock: row.stock,
    imageUrl: row.image_url ?? undefined,
    imageKey: row.image_key ?? undefined,
  });
}
