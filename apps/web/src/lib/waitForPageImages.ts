/** Wait until images currently in `root` (and short-lived late mounts) have loaded or failed. */
export function waitForPageImages(
  root: ParentNode,
  options?: { timeoutMs?: number; settleMs?: number }
) {
  const timeoutMs = options?.timeoutMs ?? 12_000;
  const settleMs = options?.settleMs ?? 280;

  return new Promise<void>((resolve) => {
    let done = false;
    let settleTimer: number | undefined;
    const pending = new Set<HTMLImageElement>();

    const finish = () => {
      if (done) return;
      done = true;
      observer.disconnect();
      window.clearTimeout(timeoutId);
      if (settleTimer !== undefined) window.clearTimeout(settleTimer);
      resolve();
    };

    const timeoutId = window.setTimeout(finish, timeoutMs);

    const scheduleSettle = () => {
      if (settleTimer !== undefined) window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => {
        if (pending.size === 0) finish();
      }, settleMs);
    };

    const track = (img: HTMLImageElement) => {
      if (img.dataset.bootTracked === "1") return;
      img.dataset.bootTracked = "1";

      if (img.loading === "lazy") img.loading = "eager";

      if (img.complete) {
        scheduleSettle();
        return;
      }

      pending.add(img);
      const onDone = () => {
        pending.delete(img);
        img.removeEventListener("load", onDone);
        img.removeEventListener("error", onDone);
        scheduleSettle();
      };
      img.addEventListener("load", onDone);
      img.addEventListener("error", onDone);
    };

    const scan = () => {
      root.querySelectorAll("img").forEach((node) => track(node as HTMLImageElement));
      scheduleSettle();
    };

    const observer = new MutationObserver(scan);
    observer.observe(root instanceof Node ? root : document.documentElement, {
      childList: true,
      subtree: true
    });

    scan();
  });
}

export function dismissSiteBoot() {
  const boot = document.getElementById("site-boot");
  document.documentElement.classList.add("site-ready");
  boot?.classList.add("is-done");
  window.setTimeout(() => boot?.remove(), 420);
}
