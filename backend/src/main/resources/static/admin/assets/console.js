function closeModal(modal) {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
}

function openModal(id, trigger) {
  const modal = document.getElementById(id);
  if (!modal) return;

  const form = modal.querySelector("[data-console-modal-form]");
  if (form instanceof HTMLFormElement && trigger.dataset.action) {
    form.action = trigger.dataset.action;
  }

  const title = modal.querySelector("[data-console-modal-title]");
  if (title) title.textContent = trigger.dataset.title || title.textContent || "";

  const subtitle = modal.querySelector("[data-console-modal-subtitle]");
  if (subtitle) subtitle.textContent = trigger.dataset.subtitle || "";

  const reason = modal.querySelector("[data-console-modal-reason]");
  if (reason) reason.textContent = trigger.dataset.reason || "";

  const details = modal.querySelector("[data-console-modal-details]");
  if (details) details.textContent = trigger.dataset.details || "";

  const snapshot = modal.querySelector("[data-console-modal-snapshot]");
  if (snapshot) snapshot.textContent = trigger.dataset.snapshot || "";

  const body = modal.querySelector("[data-console-modal-body]");
  if (body) body.textContent = trigger.dataset.body || "";

  const textarea = modal.querySelector("textarea");
  if (textarea instanceof HTMLTextAreaElement) {
    textarea.value = trigger.dataset.defaultReason || "";
  }

  const submit = modal.querySelector("[data-console-modal-submit]");
  if (submit instanceof HTMLButtonElement) {
    submit.textContent = trigger.dataset.submit || submit.textContent || "Save";
    submit.classList.toggle("console-button--danger", trigger.dataset.tone === "danger");
    submit.classList.toggle("console-button--primary", trigger.dataset.tone !== "danger");
  }

  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  requestAnimationFrame(() => textarea instanceof HTMLTextAreaElement && textarea.focus());
}

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const close = target.closest("[data-console-close]");
  if (close) {
    close.closest("details")?.removeAttribute("open");
  }

  const modalClose = target.closest("[data-console-modal-close]");
  if (modalClose) {
    modalClose.closest("[data-console-modal]")?.classList.remove("is-open");
    modalClose.closest("[data-console-modal]")?.setAttribute("aria-hidden", "true");
  }

  const opener = target.closest("[data-console-modal-open]");
  if (opener instanceof HTMLElement) {
    openModal(opener.dataset.consoleModalOpen || "", opener);
  }

  if (!target.closest("[data-console-notifications]")) {
    document.querySelectorAll("[data-console-notifications][open]").forEach((panel) => {
      panel.removeAttribute("open");
    });
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  document.querySelectorAll("[data-console-modal].is-open").forEach(closeModal);
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

const highlighted = document.querySelector(".is-highlighted");
if (highlighted) {
  highlighted.scrollIntoView({ block: "center" });
}
