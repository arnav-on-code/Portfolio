# Editable Portfolio CMS

A browser-editable personal portfolio built by preserving the existing HTML/CSS visual design and moving portfolio content into a real Supabase-backed CMS.

## What changed

The original portfolio stored content in `index.html`, `script.js`, and local asset folders. This version changes the architecture:

- **Public portfolio:** `index.html` + existing `style.css`
- **Admin dashboard:** `admin.html / admin/index.html`
- **Database:** Supabase Postgres JSON document with draft + published versions
- **Storage:** Supabase Storage buckets for profile images, projects, certificates, and resume
- **Authentication:** Supabase Auth email/password
- **Access control:** Postgres Row Level Security (RLS)
- **Backend abstraction:** `js/portfolioService.js`
- **Public renderer:** `js/app.js`
- **Admin logic:** `js/admin.js`
- **No service-role key in the frontend**
- **No portfolio data is kept in `localStorage`**

The document model intentionally keeps the free-tier setup small and makes JSON export/import straightforward. The UI still provides CRUD, ordering, uploads, draft saving, publishing, and editing for every portfolio area.

## Features

### Public site

The existing aesthetic is retained: typography, spacing, cards, animations, navigation, dark/light theme, project layout, certificate modal, and responsive behavior.

Content is loaded from the **published** Supabase document.

### Admin dashboard

Open:

```text
https://YOUR-DOMAIN/admin/
```

It contains:

- Dashboard
- Profile
- About
- Education
- Skills
- Projects
- Certificates
- Achievements
- Goals
- Learning
- Social Profiles
- Resume
- Contact
- Site Settings
- Save Draft
- Preview
- Publish
- Logout
- JSON export/import

### Browser uploads

You can upload directly from the browser:

- Profile photo
- Project images
- Certificate JPG/JPEG/PNG/WEBP/PDF
- Resume PDF
- Optional achievement images

Files are stored in Supabase Storage. The database stores their public URLs.

## Architecture

```text
                         ┌──────────────────────────┐
                         │       Public visitor     │
                         └────────────┬─────────────┘
                                      │
                                      ▼
                              index.html + app.js
                                      │
                                      ▼
                           portfolio_public table
                             (published only)
                                      │
                                      ▼
                              Supabase Storage
                           (public portfolio files)


                         ┌──────────────────────────┐
                         │      Portfolio owner     │
                         └────────────┬─────────────┘
                                      │
                                      ▼
                                admin.html / admin/index.html
                                      │
                               Supabase Auth
                                      │
                                      ▼
                         portfolio_documents table
                           (draft + published)
                                      │
                       ┌──────────────┴──────────────┐
                       ▼                             ▼
                Save Draft                       Publish
                                                     │
                                                     ▼
                                          portfolio_public table
```

## Folder structure

```text
portfolio/
├── index.html
├── admin.html / admin/index.html
├── style.css
├── admin.css
├── config.js
├── README.md
├── js/
│   ├── app.js
│   ├── admin.js
│   ├── portfolioService.js
│   └── auth.js
└── supabase/
    ├── schema.sql
    └── seed.sql
```

`style.css` is the original public visual stylesheet. `admin.css` is isolated to the CMS.

## 1. Create the Supabase project

Create a free Supabase project from the Supabase dashboard.

You need:

- Project URL
- Anon/publishable key
- Authentication
- Database
- Storage

## 2. Configure Authentication

In Supabase:

1. Open **Authentication → Providers**.
2. Enable **Email**.
3. Create your admin user in **Authentication → Users**.
4. Copy that user's UUID.

For a personal portfolio, this should be the only user you add.

If email confirmation is enabled, complete the confirmation before trying to log in.

## 3. Create the database and RLS

Open **SQL Editor** and run:

```text
supabase/schema.sql
```

This creates:

- `admin_users`
- `portfolio_documents`
- `portfolio_public`
- RLS policies
- four Storage buckets
- Storage security policies

The public table is separate from the private draft table so anonymous visitors never receive your unpublished draft.

## 4. Seed the initial portfolio

Open:

```text
supabase/seed.sql
```

Replace:

```text
YOUR-AUTH-USER-UUID
```

with your real Supabase Auth user's UUID.

Run the file in Supabase SQL Editor.

This inserts useful **placeholder/demo content**. Replace it from the Admin dashboard; the placeholders are intentionally not presented as your real achievements.

## 5. Configure the frontend

Edit only:

```text
config.js
```

Set:

```js
window.PORTFOLIO_CONFIG = {
  SUPABASE_URL: "https://YOUR-PROJECT.supabase.co",
  SUPABASE_ANON_KEY: "YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY"
};
```

### Which key is safe?

The **anon/publishable key** is designed to be used by browser clients. It can be included in the deployed frontend **when RLS is correctly configured**.

### Which key is private?

Never put this in `config.js`:

```text
service_role
```

Never commit a service-role key to GitHub.

For this static architecture, `config.js` contains only the public client configuration. Database/storage security is enforced by RLS and Storage policies.

## 6. Run locally

A local HTTP server is recommended:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

Admin:

```text
http://localhost:8000/admin.html / admin/index.html
```

Opening the HTML directly with `file://` can cause browser/CORS/module behavior that differs from deployment, so use a local server.

## 7. Deploy for free

### Option A — GitHub Pages

1. Create a GitHub repository.
2. Push the project files.
3. Go to **Settings → Pages**.
4. Select your deployment branch/folder.
5. Wait for the Pages URL.
6. Open `/admin/`.

Example:

```text
https://your-username.github.io/your-repository/admin.html / admin/index.html
```

GitHub Pages only hosts the frontend. **Supabase is the database, authentication, and file-storage backend.**

### Option B — Cloudflare Pages / Netlify

Upload or connect the same static project.

No build command is required.

The important point is that the frontend host and Supabase are separate services:

```text
Static host → HTML/CSS/JS
Supabase → Auth + Database + Storage
```

## 8. First login

Go to:

```text
/admin.html / admin/index.html
```

Sign in with the Supabase Auth email/password.

If login succeeds, the dashboard loads your draft document.

Visitors who open `index.html` never see the dashboard.

## 9. Editing workflow

The normal workflow is:

```text
Admin → edit
       ↓
Save Draft
       ↓
Preview
       ↓
Publish
       ↓
Public portfolio updates
```

### Save Draft

Writes the current content to the private draft document.

### Preview

Saves the draft and opens:

```text
index.html?preview=1
```

The preview uses the draft only for an authenticated session.

### Publish

Copies the current draft to the public table.

The public portfolio then reads the newly published version.

## 10. Add a project

1. Open **Projects**.
2. Click **+ Add Project**.
3. Fill in:
   - Title
   - Description
   - Problem solved
   - Detailed description
   - Image
   - Technologies
   - Features
   - GitHub URL
   - Live demo URL
   - Category
   - Start/end dates
   - Featured
   - Status
4. Upload the image from the browser.
5. Click **Apply changes**.
6. Click **Save Draft**.
7. Preview.
8. Click **Publish**.

No HTML, JavaScript, GitHub asset folder, or redeployment is required.

## 11. Certificates

Open **Certificates → + Add Certificate**.

Supported uploads:

- JPG
- JPEG
- PNG
- WEBP
- PDF

For images, the public site displays a thumbnail and certificate modal. PDFs are stored and can be opened as files.

The certificate metadata and storage URL are saved with the portfolio document.

## 12. Profile photo

Open **Profile**.

Choose a new profile image. It is uploaded to the `portfolio-images` bucket and the returned URL is saved in the profile data.

No:

```text
assets/profile/profile.jpg
```

replacement is required.

## 13. Resume

Open **Resume**.

Upload a PDF. The URL is stored in the profile data.

The public:

- Resume button
- View resume button
- Download resume button

automatically use the currently stored resume URL.

## 14. Skills

Open **Skills**.

You can:

- Add category
- Rename category
- Delete category
- Add skill
- Edit skill
- Delete skill
- Reorder categories

Skills are no longer hardcoded in `script.js`.

## 15. Achievements

Open **Achievements**.

Each item supports:

- Category
- Title
- Description
- Organization
- Date
- Link
- Optional image

Items can be edited, deleted, duplicated conceptually by creating another item, and reordered.

## 16. Education

Each education entry supports:

- Degree
- Institution
- Start year
- End year
- Current/expected
- CGPA/grade
- Coursework
- Highlights
- Description

## 17. Goals / Roadmap

Each goal supports:

- Period
- Title
- Description
- Planned
- In Progress
- Completed

## 18. Learning

Each learning item supports:

- Topic
- Status
- Description
- Link

Statuses:

- Learning
- Practicing
- Building
- Exploring
- Completed

## 19. Social / coding profiles

Each profile supports:

- Platform name
- Username
- URL
- Font Awesome icon class
- Display order
- Enabled/disabled

Custom platforms can be added.

## 20. Contact

Edit:

- Email
- Phone
- Location
- GitHub
- LinkedIn
- Other links

The public contact cards update from the latest published values.

## 21. Site settings

Edit:

- Portfolio title
- Browser title
- Meta description
- Accent color
- Light/dark preference
- Footer text

The existing public visual system remains in `style.css`.

## 22. Backup

In Admin → Dashboard:

**Export Portfolio Data**

downloads a JSON backup containing:

- draft
- published version
- export timestamp
- document version

Keep backups outside GitHub if they contain private/unpublished portfolio information.

### Restore

Use **Import JSON**.

Import replaces the current **draft**. It does not automatically publish the imported content.

After checking it:

```text
Import → Save Draft → Preview → Publish
```

## 23. Storage buckets

The SQL creates:

```text
portfolio-images
projects
certificates
resume
```

Public read access is intentional because the public portfolio must display these files.

Upload/update/delete operations require a signed-in user that exists in `admin_users`.

## 24. Security model

### Anonymous visitor

Can:

- read published portfolio data
- read public portfolio files

Cannot:

- read the private draft
- modify portfolio data
- upload files
- delete files
- access the admin dashboard functionality without authentication

### Admin user

Can:

- read own draft
- update portfolio
- publish
- upload files
- update files
- delete files

The database policies verify the authenticated user's UUID.

### Never do this

Do not use:

```js
if (username === "admin" && password === "1234")
```

Do not put:

```text
SUPABASE_SERVICE_ROLE_KEY
```

in frontend JavaScript.

Do not treat `localStorage` as your database.

## 25. Changing the backend later

The UI is intentionally separated from Supabase calls.

The main abstraction is:

```text
js/portfolioService.js
```

The UI calls functions such as:

```text
getPublic()
getDocument()
saveDraft()
publish()
uploadFile()
removeFile()
exportBackup()
importBackup()
```

This keeps database-specific code concentrated in one place and makes a future backend migration easier.

## 26. Common problems

### "Unable to load portfolio"

Check:

1. `config.js`
2. Supabase project URL
3. anon/publishable key
4. `schema.sql` was executed
5. `seed.sql` was executed
6. `portfolio_public` contains the document

### Admin login works but dashboard cannot load

Check:

1. Your Auth user's UUID.
2. `admin_users` contains that UUID.
3. `portfolio_documents.admin_user_id` matches that UUID.
4. RLS policies were created successfully.

### Upload fails

Check:

1. The correct Storage bucket exists.
2. The user exists in `admin_users`.
3. Storage policies from `schema.sql` exist.
4. The file type is allowed by the browser form.
5. The file is not larger than your Supabase plan/project limits.

### Public site does not update after editing

Remember:

```text
Apply changes
→ Save Draft
→ Publish
```

Saving a draft alone intentionally does not change the public portfolio.

### Preview shows public content

Preview requires an authenticated Supabase session in the same browser. If the session is missing, the page falls back to the published version.

## 27. What you no longer need to edit

After setup, you should not need to edit:

- `index.html`
- `style.css`
- `js/app.js`
- `js/admin.js`
- portfolio JSON
- project image folders
- certificate folders
- resume folders

For normal portfolio maintenance, use:

```text
/admin.html / admin/index.html
```

The only normal source-level configuration is the initial Supabase connection in `config.js`.

## 28. Important deployment reality

GitHub Pages is **not** the database.

The final system is:

```text
GitHub Pages / Cloudflare Pages / Netlify
                 +
              Supabase
```

The static host serves the application. Supabase persists the data, authenticates the owner, and stores uploaded files.

Therefore, after deployment, changing a project or uploading a certificate does **not** require a GitHub commit or redeployment.

## 29. Final acceptance test

After setup, verify this exact flow:

1. Deploy the site.
2. Open the public portfolio.
3. Open `/admin/`.
4. Log in.
5. Open Projects.
6. Add a project.
7. Upload a project image.
8. Enter a GitHub URL.
9. Apply changes.
10. Save Draft.
11. Preview.
12. Publish.
13. Open the public portfolio.
14. Confirm the project is visible.

Then repeat for:

- Profile photo
- Certificate
- Resume
- Achievement
- Education
- Skill
- Goal
- Learning item
- Social profile
- Contact details
- About content

No code or GitHub asset replacement should be necessary for any of those changes.

## License

Use and modify this portfolio freely for your personal portfolio.
