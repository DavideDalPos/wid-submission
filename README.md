# WID Submissions

Public submission forms for the **World Ichneumonidae Database (WID)**. Lets anyone
report a newly published paper or a taxonomic correction without needing a GitHub
account. Each submission is turned into a GitHub issue for the WID team to review.

## What this does

This repo hosts two small web forms, deployed on Netlify:

- **`index.html`** — submit a newly published paper (authors, year, journal, title, optional DOI)
- **`correction.html`** — report an error or correction (taxon, type of problem, details, optional reference)

When someone submits a form, a Netlify Function receives the data and creates a
**GitHub issue** in the WID submissions repository. Submitters never touch GitHub.

## How it works

```
Visitor fills a form (index.html / correction.html)
        │
        ▼
Netlify Function (netlify/functions/*.js)
        │  authenticates with a GitHub token
        ▼
GitHub issue created  →  reviewed in the Issues tab
```

The forms post to their matching functions:

| Form              | Function                                  | Issue label  |
|-------------------|-------------------------------------------|--------------|
| `index.html`      | `netlify/functions/submit-paper.js`       | `new-paper`  |
| `correction.html` | `netlify/functions/submit-correction.js`  | `correction` |

Submissions arrive as issues here: **https://github.com/DavideDalPos/wid-submission/issues**
Filter by the `new-paper` or `correction` label to see one type at a time.

## Project structure

```
├── index.html                        # paper submission form
├── correction.html                   # correction/error report form
├── netlify/
│   └── functions/
│       ├── submit-paper.js           # creates a "new-paper" issue
│       └── submit-correction.js      # creates a "correction" issue
├── netlify.toml                      # tells Netlify where the functions live
└── README.md
```

## Configuration

The functions rely on two environment variables, set in the Netlify dashboard
(**Site configuration → Environment variables**), never committed to the repo:

| Variable       | Purpose                                                               | Example                       |
|----------------|-----------------------------------------------------------------------|-------------------------------|
| `GITHUB_TOKEN` | Fine-grained token with **Issues: Read and write** on the target repo | `github_pat_…`                |
| `GITHUB_REPO`  | Where issues are created, as `owner/name`                             | `DavideDalPos/wid-submission` |

After changing either variable, trigger a redeploy (**Deploys → Trigger deploy →
Deploy site**) for the change to take effect.

## Deployment

Deployment is automatic. Netlify is connected to this repository, so **every push to
the default branch triggers a new deploy**. There is no build step — the forms are
static HTML and the functions are picked up from `netlify/functions/`.

Live site: **https://benevolent-cuchufli-47bd77.netlify.app**

## Anti-spam

Each form includes a hidden "honeypot" field (`hp_field`). Real users never see or
fill it; automated bots usually do. If it comes back filled, the function silently
accepts the request but creates no issue.

## Linking from the WID website

The public "How can you help?" page links to these forms with simple buttons:

- Paper submissions → `https://benevolent-cuchufli-47bd77.netlify.app`
- Corrections → `https://benevolent-cuchufli-47bd77.netlify.app/correction.html`

## Reproducing / extending

To add another submission type (e.g. specimen records or images):

1. Add a new form page (copy `correction.html` as a starting point).
2. Add a matching function under `netlify/functions/`, giving its issues a new label.
3. Point the new form's `fetch` at the new function's path.
4. Add a button to the WID "How can you help?" page.
5. Commit and push — Netlify deploys automatically.

## Maintainer

Davide Dal Pos — World Ichneumonidae Database
