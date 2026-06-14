(function () {
  const form = document.querySelector("#application-form");
  if (!form) return;

  const steps = Array.from(form.querySelectorAll("[data-application-step]"));
  const progress = document.querySelector("[data-application-progress]");
  const stepLabel = document.querySelector("[data-application-step-label]");
  const roleLabel = document.querySelector("[data-application-role-label]");
  const prevButton = document.querySelector("[data-application-prev]");
  const nextButton = document.querySelector("[data-application-next]");
  const submitButton = document.querySelector("[data-application-submit]");
  const message = document.querySelector("[data-application-message]");
  const summary = document.querySelector("[data-application-summary]");
  const pdfInput = form.querySelector('input[name="pdf"]');
  const pdfLabel = document.querySelector("[data-pdf-label]");
  let currentStep = 0;
  let role = "Crew member - Kitchen";

  function showMessage(text, type) {
    message.textContent = text || "";
    message.className = `form-message ${type || ""}`.trim();
  }

  function selectedDays() {
    return Array.from(form.querySelectorAll('input[name="days"]:checked')).map((input) => input.value);
  }

  function updateSummary() {
    if (!summary) return;
    const data = new FormData(form);
    const name = data.get("name") || "-";
    const email = data.get("email") || "-";
    const days = selectedDays();
    const file = pdfInput?.files?.[0];
    summary.innerHTML = `
      <div><span>Rol</span><strong>${escapeHtml(role)}</strong></div>
      <div><span>Contact</span><strong>${escapeHtml(name)} · ${escapeHtml(email)}</strong></div>
      <div><span>Dagen</span><strong>${escapeHtml(days.length ? days.join(", ") : "Nog niet gekozen")}</strong></div>
      <div><span>PDF</span><strong>${escapeHtml(file ? file.name : "Geen PDF toegevoegd")}</strong></div>
    `;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function render() {
    steps.forEach((step, index) => step.classList.toggle("active", index === currentStep));
    const percentage = Math.round(((currentStep + 1) / steps.length) * 100);
    if (progress) progress.style.width = `${percentage}%`;
    if (stepLabel) stepLabel.textContent = `Stap ${currentStep + 1} van ${steps.length}`;
    if (roleLabel) roleLabel.textContent = role;
    prevButton.hidden = currentStep === 0;
    nextButton.hidden = currentStep === steps.length - 1;
    submitButton.hidden = currentStep !== steps.length - 1;
    updateSummary();
  }

  function validateStep() {
    showMessage("");
    if (currentStep === 1) {
      const fields = ["name", "email"].map((name) => form.querySelector(`[name="${name}"]`));
      const invalid = fields.find((field) => !field.value.trim() || !field.checkValidity());
      if (invalid) {
        invalid.focus();
        showMessage("Vul naam en een geldig e-mailadres in.", "error");
        return false;
      }
    }
    if (currentStep === 2 && !selectedDays().length) {
      showMessage("Selecteer minimaal een beschikbare dag.", "error");
      return false;
    }
    if (currentStep === 4) {
      const file = pdfInput?.files?.[0];
      if (file && (file.type !== "application/pdf" || file.size > 4_000_000)) {
        showMessage("Upload een PDF van maximaal 4 MB.", "error");
        return false;
      }
    }
    return true;
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = () => resolve({ name: file.name, size: file.size, data: reader.result });
      reader.onerror = () => reject(new Error("PDF kon niet gelezen worden."));
      reader.readAsDataURL(file);
    });
  }

  document.querySelectorAll("[data-apply-role]").forEach((link) => {
    link.addEventListener("click", () => {
      role = link.getAttribute("data-apply-role") || role;
      document.querySelectorAll("[data-role-option]").forEach((button) => {
        button.classList.toggle("selected", button.getAttribute("data-role-option") === role);
      });
      render();
    });
  });

  document.querySelectorAll("[data-role-option]").forEach((button) => {
    button.addEventListener("click", () => {
      role = button.getAttribute("data-role-option") || role;
      document.querySelectorAll("[data-role-option]").forEach((item) => item.classList.toggle("selected", item === button));
      render();
    });
  });

  prevButton.addEventListener("click", () => {
    currentStep = Math.max(0, currentStep - 1);
    render();
  });

  nextButton.addEventListener("click", () => {
    if (!validateStep()) return;
    currentStep = Math.min(steps.length - 1, currentStep + 1);
    render();
  });

  pdfInput?.addEventListener("change", () => {
    const file = pdfInput.files?.[0];
    if (pdfLabel) pdfLabel.textContent = file ? file.name : "Geen bestand gekozen";
    updateSummary();
  });

  form.addEventListener("input", updateSummary);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!validateStep()) return;
    submitButton.disabled = true;
    submitButton.textContent = "Versturen...";
    showMessage("");

    try {
      const data = new FormData(form);
      const pdfFile = pdfInput?.files?.[0] || null;
      const payload = {
        role,
        name: data.get("name"),
        email: data.get("email"),
        phone: data.get("phone"),
        days: selectedDays(),
        availabilityNote: data.get("availabilityNote"),
        experience: data.get("experience"),
        motivation: data.get("motivation"),
        pdf: await fileToDataUrl(pdfFile)
      };
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Versturen mislukt.");
      form.reset();
      role = "Crew member - Kitchen";
      currentStep = 0;
      if (pdfLabel) pdfLabel.textContent = "Geen bestand gekozen";
      document.querySelectorAll("[data-role-option]").forEach((button) => {
        button.classList.toggle("selected", button.getAttribute("data-role-option") === role);
      });
      render();
      showMessage("Je sollicitatie is ontvangen en staat nu in de admin.", "success");
    } catch (error) {
      showMessage(error.message, "error");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Aanvraag verzenden";
    }
  });

  render();
})();
