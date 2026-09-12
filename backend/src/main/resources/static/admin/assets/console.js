document.addEventListener(
  "toggle",
  (event) => {
    const current = event.target;
    if (!(current instanceof HTMLDetailsElement) || !current.matches("[data-console-confirm]")) {
      return;
    }
    if (!current.open) return;

    document.querySelectorAll("[data-console-confirm][open]").forEach((panel) => {
      if (panel !== current) panel.removeAttribute("open");
    });
  },
  true,
);

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const close = target.closest("[data-console-close]");
  if (close) {
    close.closest("details")?.removeAttribute("open");
  }
});

document.addEventListener("submit", (event) => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement) || !form.matches("[data-console-action-form]")) {
    return;
  }
  form.querySelectorAll("button[type='submit']").forEach((button) => {
    button.disabled = true;
    button.dataset.originalText = button.textContent;
    button.textContent = button.dataset.busyText || "Working...";
  });
});
