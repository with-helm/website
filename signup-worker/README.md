# Signup worker

The homepage "Stay in touch" form (`#signup` in `index.html`) posts to this Cloudflare Worker, which adds the person to a SendGrid Marketing contact list. The SendGrid API key has to live server-side, and GitHub Pages can't run server code, so the Worker sits between the two.

What gets stored on the SendGrid contact:

| Form field             | SendGrid field              |
| ---------------------- | --------------------------- |
| Name                   | `first_name` + `last_name` (split on the first space) |
| Email                  | `email`                     |
| Current student?       | `is_current_student` (Number: 1 = yes, 0 = no) |
| Educator / education professional? | `is_education_professional` (Number: 1 = yes, 0 = no) |
| Note (optional)        | `signup_note` (Text)        |

Submitting again with the same email updates the existing contact.

## 1. Set up SendGrid

1. **List:** Marketing → Contacts → Create → New list. Open the list; its ID is the last part of the page URL.
2. **Custom fields:** Marketing → Custom Fields → New custom field. Create `is_current_student` and `is_education_professional` as **Number** fields, and `signup_note` as a **Text** field.
3. **API key:** Settings → API Keys → Create API Key → Restricted Access, with access to Marketing only.
4. **Custom field IDs:** the API refers to custom fields by ID (like `e1_N` for a Number field or `e3_T` for Text), not by name. The SendGrid site doesn't show these IDs, so you ask the API for them from a terminal.

   First, make the API key available to your terminal. Keys in `.dev.vars` or Cloudflare aren't visible to it, which is the usual reason the command fails. From the `signup-worker` folder, either load it from `.dev.vars`:

   ```sh
   set -a; source .dev.vars; set +a
   ```

   or paste it in directly:

   ```sh
   export SENDGRID_API_KEY='SG.your-key-here'
   ```

   Check it worked: `echo ${SENDGRID_API_KEY:0:3}` should print `SG.`. This only lasts for that terminal window.

   Then list your custom fields:

   ```sh
   curl -s https://api.sendgrid.com/v3/marketing/field_definitions \
     -H "Authorization: Bearer $SENDGRID_API_KEY" \
     | python3 -c 'import json, sys; d = json.load(sys.stdin); [print(f["id"], f["name"]) for f in d["custom_fields"]] if "custom_fields" in d else print(d)'
   ```

   It prints one line per field, e.g. `e1_N is_current_student`. If you get an error instead:

   | Error                    | Cause                                                                 |
   | ------------------------ | --------------------------------------------------------------------- |
   | `authorization required` | The key isn't set in this terminal, or it's wrong. Redo the step above. |
   | `access forbidden`       | The key doesn't have Marketing access. Edit it in Settings → API Keys. |

   Copy each `id` into `wrangler.toml`:

   | SendGrid field              | `wrangler.toml` setting                    |
   | --------------------------- | ------------------------------------------ |
   | `is_current_student`        | `SENDGRID_FIELD_IS_CURRENT_STUDENT`        |
   | `is_education_professional` | `SENDGRID_FIELD_IS_EDUCATION_PROFESSIONAL` |
   | `signup_note`               | `SENDGRID_FIELD_SIGNUP_NOTE`               |

## 2. Deploy the Worker

Fill in the list and field IDs in `wrangler.toml`, then:

```sh
cd signup-worker
npm install
npx wrangler login
npx wrangler secret put SENDGRID_API_KEY
npm run deploy
```

Deploying prints the Worker's URL (`https://helm-signup.<account>.workers.dev`). Put it in the form's `data-endpoint` attribute in `index.html`. Until that's set, the form shows an error on submit.

`ALLOWED_ORIGINS` lists the sites allowed to post to the Worker. Add any new domains there.

## Local development

```sh
cp .dev.vars.example .dev.vars   # add a real or test API key
npm run dev                      # Worker on http://localhost:8787
```

In another terminal, serve the site from the `website` folder with `python3 -m http.server 8000`, and point `data-endpoint` at `http://localhost:8787` while testing. `.dev.vars` overrides `wrangler.toml`, so local runs accept requests from `http://localhost:8000`.

## Tests

```sh
npm test
```

The tests mock SendGrid, so they don't need an API key or network access.
