export const ROUTES = {
  HOME: "/",
  PRODUCTS: "/product",
  CART: "/cart",
} as const;

export const API_ROUTES = {
  PRODUCTS: "/api/products",
  product: (id: string) => `/api/products/${id}`,
  CART: "/api/cart",
  CART_ITEMS: "/api/cart/items",
  cartItem: (productId: string) => `/api/cart/items/${productId}`,
} as const;
