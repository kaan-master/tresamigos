/** Wait until images/videos currently in `root` have loaded enough to show, or timed out. */
export function waitForPageImages(
  root: ParentNode,
  options?: { timeoutMs?: number; settleMs?: number }
) {
  const timeoutMs = options?.timeoutMs ?? 8_000;
  const settleMs = options?.settleMs ?? 160;

  return new Promise<void>((resolve) => {
    let done = false;
    let settleTimer: number | undefined;
    const pending = new Set<Element>();

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

    const trackImage = (img: HTMLImageElement) => {
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

    const trackVideo = (video: HTMLVideoElement) => {
      if (video.dataset.bootTracked === "1") return;
      // Below-the-fold / carousel clips: don't block first paint.
      if (video.dataset.bootDefer === "1") {
        video.dataset.bootTracked = "1";
        scheduleSettle();
        return;
      }
      video.dataset.bootTracked = "1";

      const critical = video.dataset.bootCritical === "1";
      if (!critical) {
        scheduleSettle();
        return;
      }

      // Only wait for metadata / first frame — do not force full download.
      if (video.preload === "none") video.preload = "metadata";
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        scheduleSettle();
        return;
      }

      pending.add(video);
      const onDone = () => {
        pending.delete(video);
        video.removeEventListener("loadeddata", onDone);
        video.removeEventListener("canplay", onDone);
        video.removeEventListener("error", onDone);
        scheduleSettle();
      };
      video.addEventListener("loadeddata", onDone);
      video.addEventListener("canplay", onDone);
      video.addEventListener("error", onDone);
      try {
        video.load();
      } catch {
        /* ignore */
      }
    };

    const scan = () => {
      root.querySelectorAll("img").forEach((node) => trackImage(node as HTMLImageElement));
      root.querySelectorAll("video").forEach((node) => trackVideo(node as HTMLVideoElement));
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
