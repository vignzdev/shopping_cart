import { Cart } from "@cart/domain/cart";
import { CartItem } from "@cart/domain/cartItem";
import type { CartRepository } from "@cart/domain/cartRepository";
import { Money } from "@shared/domain/money";
import { getSupabase } from "@shared/infrastructure/supabase/client";

type CartItemRow = {
  product_id: string;
  name: string;
  unit_price: number | string;
  quantity: number;
};

export class SupabaseCartRepository implements CartRepository {
  async create(): Promise<Cart> {
    const { data, error } = await getSupabase()
      .from("carts")
      .insert({})
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to create cart");
    }

    return new Cart(data.id);
  }

  async getById(id: string): Promise<Cart | null> {
    const supabase = getSupabase();
    const { data: cart, error: cartError } = await supabase
      .from("carts")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (cartError) {
      throw new Error(cartError.message);
    }

    if (!cart) {
      return null;
    }

    const { data: items, error: itemsError } = await supabase
      .from("cart_items")
      .select("product_id, name, unit_price, quantity")
      .eq("cart_id", id);

    if (itemsError) {
      throw new Error(itemsError.message);
    }

    return new Cart(
      cart.id,
      (items ?? []).map(
        (item: CartItemRow) =>
          new CartItem(
            item.product_id,
            item.name,
            new Money(Number(item.unit_price)),
            item.quantity,
          ),
      ),
    );
  }

  async save(cart: Cart): Promise<void> {
    const supabase = getSupabase();
    const { error: deleteError } = await supabase
      .from("cart_items")
      .delete()
      .eq("cart_id", cart.id);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    const items = cart.getItems();

    if (items.length === 0) {
      return;
    }

    const { error: insertError } = await supabase.from("cart_items").insert(
      items.map((item) => ({
        cart_id: cart.id,
        product_id: item.productId,
        name: item.name,
        unit_price: item.unitPrice.amount,
        quantity: item.quantity,
      })),
    );

    if (insertError) {
      throw new Error(insertError.message);
    }
  }
}
