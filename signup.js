const GENERIC_ERROR =
  "Something went wrong. Please try again, or email us at hello@with-helm.com.";

const form = document.getElementById("signup-form");

if (form) {
  const status = form.querySelector(".signup-status");
  const submit = form.querySelector('button[type="submit"]');
  const thanks = document.getElementById("signup-thanks");
  const name = document.getElementById("signup-name");
  const email = document.getElementById("signup-email");
  const more = document.getElementById("signup-more");

  const updateMore = () => {
    const ready = name.value.trim() !== "" && email.value.trim() !== "";
    more.hidden = !ready;
    more.disabled = !ready;
  };
  form.addEventListener("input", updateMore);
  updateMore();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const endpoint = form.dataset.endpoint;
    if (!endpoint) {
      console.error("Signup form has no data-endpoint set.");
      status.textContent = GENERIC_ERROR;
      return;
    }

    submit.disabled = true;
    submit.textContent = "Sending…";
    status.textContent = "";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        status.textContent =
          response.status === 400 && result.error ? result.error : GENERIC_ERROR;
        return;
      }

      form.hidden = true;
      thanks.hidden = false;
      thanks.focus();
    } catch {
      status.textContent = GENERIC_ERROR;
    } finally {
      submit.disabled = false;
      submit.textContent = "Send";
    }
  });
}
