export const ADMIN_USER = "admin";
export const ADMIN_PASS = "admin123";

export function login(username: string, password: string) {
  return username === ADMIN_USER && password === ADMIN_PASS;
}