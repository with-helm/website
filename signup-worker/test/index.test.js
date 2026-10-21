import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import worker from "../src/index.js";

const ORIGIN = "https://with-helm.com";
const env = {
  ALLOWED_ORIGINS: "https://with-helm.com,https://www.with-helm.com",
  SENDGRID_API_KEY: "SG.test",
  SENDGRID_LIST_ID: "list-123",
  SENDGRID_FIELD_IS_CURRENT_STUDENT: "e1_N",
  SENDGRID_FIELD_IS_EDUCATION_PROFESSIONAL: "e2_N",
  SENDGRID_FIELD_SIGNUP_NOTE: "e3_T",
};
const validBody = {
  name: "Ada Lovelace King",
  email: "Ada@Example.com",
  student: "yes",
  educator: "no",
  note: "Hello there",
  company: "",
};

let sendGridCalls;
let sendGridStatus;
const realFetch = globalThis.fetch;

beforeEach(() => {
  sendGridCalls = [];
  sendGridStatus = 202;
  globalThis.fetch = async (url, init) => {
    sendGridCalls.push({ url, init });
    return new Response(JSON.stringify({ job_id: "job-1" }), { status: sendGridStatus });
  };
});

afterEach(() => {
  globalThis.fetch = realFetch;
});

function post(body, { origin = ORIGIN, rawBody } = {}) {
  return worker.fetch(
    new Request("https://signup.example.workers.dev", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: origin },
      body: rawBody ?? JSON.stringify(body),
    }),
    env,
  );
}

test("upserts the contact into the SendGrid list", async () => {
  const response = await post(validBody);

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), ORIGIN);
  assert.equal(sendGridCalls.length, 1);

  const { url, init } = sendGridCalls[0];
  assert.equal(url, "https://api.sendgrid.com/v3/marketing/contacts");
  assert.equal(init.method, "PUT");
  assert.equal(init.headers.Authorization, "Bearer SG.test");
  assert.deepEqual(JSON.parse(init.body), {
    list_ids: ["list-123"],
    contacts: [
      {
        email: "ada@example.com",
        first_name: "Ada",
        last_name: "Lovelace King",
        custom_fields: { e1_N: 1, e2_N: 0, e3_T: "Hello there" },
      },
    ],
  });
});

test("leaves the note field out when no note is given", async () => {
  await post({ ...validBody, note: "  " });

  const contact = JSON.parse(sendGridCalls[0].init.body).contacts[0];
  assert.deepEqual(contact.custom_fields, { e1_N: 1, e2_N: 0 });
});

test("sends 0 for a non-student and 1 for an education professional", async () => {
  await post({ ...validBody, student: "no", educator: "yes" });

  const contact = JSON.parse(sendGridCalls[0].init.body).contacts[0];
  assert.deepEqual(contact.custom_fields, { e1_N: 0, e2_N: 1, e3_T: "Hello there" });
});

test("answers CORS preflight from allowed origins", async () => {
  const response = await worker.fetch(
    new Request("https://signup.example.workers.dev", {
      method: "OPTIONS",
      headers: { Origin: "https://www.with-helm.com" },
    }),
    env,
  );

  assert.equal(response.status, 204);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), "https://www.with-helm.com");
});

test("rejects other origins", async () => {
  const response = await post(validBody, { origin: "https://evil.example" });

  assert.equal(response.status, 403);
  assert.equal(sendGridCalls.length, 0);
});

test("silently accepts honeypot submissions without calling SendGrid", async () => {
  const response = await post({ ...validBody, company: "Spam Inc" });

  assert.equal(response.status, 200);
  assert.equal(sendGridCalls.length, 0);
});

test("rejects invalid input with a readable message", async () => {
  const cases = [
    [{ ...validBody, name: "" }, /name/],
    [{ ...validBody, email: "not-an-email" }, /email/],
    [{ ...validBody, student: "maybe" }, /student/],
    [{ ...validBody, educator: undefined }, /educator/],
    [{ ...validBody, note: "x".repeat(1001) }, /note/],
  ];

  for (const [body, message] of cases) {
    const response = await post(body);
    assert.equal(response.status, 400);
    assert.match((await response.json()).error, message);
  }
  assert.equal(sendGridCalls.length, 0);
});

test("rejects malformed JSON", async () => {
  const response = await post(null, { rawBody: "{nope" });

  assert.equal(response.status, 400);
});

test("reports SendGrid failures as 502", async () => {
  sendGridStatus = 400;
  const response = await post(validBody);

  assert.equal(response.status, 502);
});

test("refuses to run with missing configuration", async () => {
  const response = await worker.fetch(
    new Request("https://signup.example.workers.dev", {
      method: "POST",
      headers: { Origin: ORIGIN },
      body: JSON.stringify(validBody),
    }),
    { ...env, SENDGRID_LIST_ID: "" },
  );

  assert.equal(response.status, 500);
  assert.equal(sendGridCalls.length, 0);
});
