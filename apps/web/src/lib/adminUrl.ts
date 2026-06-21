/** Admin login — later kan /login ook klantlogin worden; nu altijd backoffice. */
export function adminLoginUrl() {
  if (import.meta.env.DEV) {
    const port = import.meta.env.VITE_ADMIN_PORT || "5181";
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:${port}/admin/`;
  }
  return "/admin/";
}
