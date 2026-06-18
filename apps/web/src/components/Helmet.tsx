export function Helmet({ title, description }: { title: string; description: string }) {
  if (typeof document !== "undefined") {
    document.title = title;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);
  }
  return null;
}
