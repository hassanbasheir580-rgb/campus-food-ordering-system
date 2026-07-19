const tokenKey = 'campus_food_token';
const cartKey = 'campus_food_cart';

export const storage = {
  getToken() {
    return localStorage.getItem(tokenKey);
  },
  setToken(token: string) {
    localStorage.setItem(tokenKey, token);
  },
  clearToken() {
    localStorage.removeItem(tokenKey);
  },
  getCart() {
    return localStorage.getItem(cartKey);
  },
  setCart(value: string) {
    localStorage.setItem(cartKey, value);
  },
  clearCart() {
    localStorage.removeItem(cartKey);
  }
};
