export const CART_UPDATED_EVENT = "cart:updated";

export function totalCartQuantity(items: Array<{ quantity: number }>): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function notifyCartUpdated(itemCount: number): void {
  window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT, { detail: { itemCount } }));
}
