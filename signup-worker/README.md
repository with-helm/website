# Signup worker

The homepage "Stay in touch" form (`#signup` in `index.html`) posts to this Cloudflare Worker, which adds the person to a SendGrid Marketing contact list. The SendGrid API key has to live server-side, and GitHub Pages can't run server code, so the Worker sits between the two.

What gets stored on the SendGrid contact:

| Form field             | SendGrid field              |
| ---------------------- | --------------------------- |
| Name                   | `first_name` + `last_name` (split on the first space) |
| Email                  | `email`                     |
| Current student?       | Custom field, `yes` / `no`  |
| Educator / education professional? | Custom field, `yes` / `no` |
| Note (optional)        | Custom field, free text     |

Submitting again with the same email updates the existing contact.

## 1. Set up SendGrid

1. **List:** Marketing → Contacts → Create → New list. Open the list; its ID is the last part of the page URL.
2. **Custom fields:** Marketing → Custom Fields → New custom field. Create three **Text** fields, e.g. `current_student`, `educator`, `signup_note`.
3. **API key:** Settings → API Keys → Create API Key → Restricted Access, with access to Marketing only.
4. **Custom field IDs:** the API refers to custom fields by ID (like `e1_T`), not by name. List them with:

   ```sh
   curl https://api.sendgrid.com/v3/marketing/field_definitions \
     -H "Authorization: Bearer $SENDGRID_API_KEY"
   ```

   Find your three fields under `custom_fields` and note each `id`.

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
