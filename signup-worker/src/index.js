const SENDGRID_CONTACTS_URL = "https://api.sendgrid.com/v3/marketing/contacts";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const YES_NO = ["yes", "no"];
const REQUIRED_ENV = [
  "SENDGRID_API_KEY",
  "SENDGRID_LIST_ID",
  "SENDGRID_FIELD_IS_CURRENT_STUDENT",
  "SENDGRID_FIELD_IS_EDUCATION_PROFESSIONAL",
  "SENDGRID_FIELD_SIGNUP_NOTE",
];

// SendGrid's own limits: email 254, first_name and last_name 50 each
const MAX_NAME = 100;
const MAX_EMAIL = 254;
const MAX_NOTE = 1000;
const MAX_NAME_PART = 50;

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin");
    const allowedOrigins = (env.ALLOWED_ORIGINS ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    if (!origin || !allowedOrigins.includes(origin)) {
      return json({ error: "Forbidden" }, 403);
    }

    const cors = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      Vary: "Origin",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }
    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405, cors);
    }

    const missing = REQUIRED_ENV.filter((key) => !env[key]);
    if (missing.length > 0) {
      console.error(`Missing configuration: ${missing.join(", ")}`);
      return json({ error: "Signup is not available right now." }, 500, cors);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid request." }, 400, cors);
    }

    // Honeypot: bots fill every field, people never see this one
    if (body.company) {
      return json({ ok: true }, 200, cors);
    }

    const { signup, error } = parseSignup(body);
    if (error) {
      return json({ error }, 400, cors);
    }

    const response = await fetch(SENDGRID_CONTACTS_URL, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${env.SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(toSendGridContact(signup, env)),
    });

    if (!response.ok) {
      console.error(`SendGrid ${response.status}: ${await response.text()}`);
      return json({ error: "Signup failed." }, 502, cors);
    }

    return json({ ok: true }, 200, cors);
  },
};

export function parseSignup(body) {
  const name = text(body.name);
  const email = text(body.email).toLowerCase();
  const student = text(body.student).toLowerCase();
  const educator = text(body.educator).toLowerCase();
  const note = text(body.note);

  if (!name || name.length > MAX_NAME) {
    return { error: "Please enter your name." };
  }
  if (email.length > MAX_EMAIL || !EMAIL_PATTERN.test(email)) {
    return { error: "Please enter a valid email address." };
  }
  if (!YES_NO.includes(student)) {
    return { error: "Please tell us whether you're a current student." };
  }
  if (!YES_NO.includes(educator)) {
    return { error: "Please tell us whether you're an educator or education professional." };
  }
  if (note.length > MAX_NOTE) {
    return { error: `Please keep your note under ${MAX_NOTE} characters.` };
  }

  return { signup: { name, email, student, educator, note } };
}

export function toSendGridContact(signup, env) {
  const [firstName, ...rest] = signup.name.split(/\s+/);
  // Both flags are SendGrid Number fields: 1 = true, 0 = false
  const customFields = {
    [env.SENDGRID_FIELD_IS_CURRENT_STUDENT]: signup.student === "yes" ? 1 : 0,
    [env.SENDGRID_FIELD_IS_EDUCATION_PROFESSIONAL]: signup.educator === "yes" ? 1 : 0,
  };
  // Omitted fields keep their stored value, so an empty note won't wipe an earlier one
  if (signup.note) {
    customFields[env.SENDGRID_FIELD_SIGNUP_NOTE] = signup.note;
  }

  return {
    list_ids: [env.SENDGRID_LIST_ID],
    contacts: [
      {
        email: signup.email,
        first_name: firstName.slice(0, MAX_NAME_PART),
        last_name: rest.join(" ").slice(0, MAX_NAME_PART),
        custom_fields: customFields,
      },
    ],
  };
}

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function json(data, status, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}
