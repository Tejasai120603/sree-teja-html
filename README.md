# Sree Teja Media Technology: website

A plain **HTML + Tailwind CSS** website with one small server file that sends quote requests to your email using **Resend**.

No React. No Next.js. Nothing to compile to see the site.

---

## 0. Read this first: your Resend key

- Your API key is a password. Never paste it into the website files, into GitHub, or into a chat.
- It lives in **one place only**: a file called `.env.local` on your computer (for testing) and an **Environment Variable** on Vercel (for the live site).
- If you ever shared a key anywhere public or in a chat, go to resend.com, open **API Keys**, delete it, and create a new one.

---

## 1. What is in this folder

```
sree-teja-html/
├── index.html        The whole website (Home, Services, Hardware, AMC, Get a quote)
├── legal.html        Privacy policy, Terms of use, Rental and refund terms
├── site.js           Form checks, WhatsApp button, email button, theme toggle, filters
├── styles.css        Ready-made Tailwind styles (already built, do not edit by hand)
├── input.css         Tailwind source, only needed if you rebuild styles.css
├── logo.png          Your logo
├── api/
│   └── quote.js      THE ONLY SERVER FILE: receives the form and emails it via Resend
├── dev-server.mjs    Small program that runs the site on your computer for testing
├── package.json      Project settings and the commands you can run
├── .env.example      Template for your secret settings
└── README.md         This file
```

You will create one more file yourself: `.env.local` (your secrets). It is hidden from GitHub automatically.

---

## 2. One-time setup on your computer

### 2.1 Install the tools
1. **Node.js 20.6 or newer (LTS)**: download from https://nodejs.org and install with the default options.
2. **VS Code** (recommended): https://code.visualstudio.com

Close and reopen VS Code after installing Node.

### 2.2 Open the project folder in VS Code (this is the important step)
1. Unzip `sree-teja-html.zip`. You get a folder named `sree-teja-html`.
2. In VS Code choose **File, Open Folder**, then select the **`sree-teja-html` folder itself**.
   Open the folder, not a single file. The left sidebar should now list `index.html`, `package.json`, `api`, and so on directly at the top level.
3. Open the integrated terminal: **Terminal, New Terminal** (shortcut: Ctrl + backtick).
   The terminal opens **already inside the project folder**. Every command in this README is typed there.

Check you are in the right place. Type:

```bash
node -v
```
It should print `v20.6.0` or higher. Then:

```bash
ls
```
On Windows Command Prompt use `dir` instead. You must see `package.json` and `index.html` in the list. If you do not, the terminal is in the wrong folder. Close it and repeat step 2, making sure you opened the `sree-teja-html` folder itself.

> **Windows tip:** If the terminal is PowerShell and a command is blocked, click the dropdown next to the + in the terminal panel and choose **Command Prompt** or **Git Bash**.

### 2.3 Install the one dependency
```bash
npm install
```
This downloads Resend and the Tailwind tools into a `node_modules` folder. It takes about a minute. Run it once.

### 2.4 Create your secret settings file
Mac, Linux, or Git Bash:
```bash
cp .env.example .env.local
```
Windows Command Prompt:
```bash
copy .env.example .env.local
```

Now open `.env.local` in VS Code and fill it in:

```
RESEND_API_KEY=paste_your_new_key_here
QUOTE_TO_EMAIL=sreetejamediatechnology@gmail.com
QUOTE_FROM_EMAIL=Sree Teja Quotes <onboarding@resend.dev>
```

- Replace `paste_your_new_key_here` with your key. No quotes, no spaces.
- Save the file (Ctrl + S).

**Important about the sender address:** until you verify your own domain in Resend, `onboarding@resend.dev` can only deliver to the email address you used to **sign up to Resend**. So either sign up to Resend with `sreetejamediatechnology@gmail.com`, or verify a domain (Resend dashboard, Domains) and change `QUOTE_FROM_EMAIL` to an address on that domain, for example `Sree Teja Quotes <quotes@yourdomain.com>`.

---

## 3. Run and test the website on your computer

```bash
npm run dev
```
You should see: `Site running at http://localhost:3000`. Open that address in your browser.

Leave this terminal running while you test. To stop the site, click in the terminal and press **Ctrl + C**.

If you change `.env.local`, stop the site (Ctrl + C) and run `npm run dev` again.

If port 3000 is busy:
```bash
PORT=3001 npm run dev
```
(On Windows Command Prompt: `set PORT=3001 && npm run dev`.)

### 3.1 Manual test checklist (in the browser)
| # | Do this | Expect |
|---|---|---|
| 1 | Click Services, Hardware, AMC, Contact in the top bar | The page scrolls to each section |
| 2 | Click the half-circle button in the header | Whole site switches light and dark, and remembers it after refresh |
| 3 | On Hardware, click Rent, Buy, Upgrade | The list filters |
| 4 | In the quote form type `Ramesh2` as the name, then click the next field | Red message: letters and spaces only |
| 5 | Type `5876543210` as the mobile number | Rejected (Indian numbers must start with 6, 7, 8 or 9) |
| 6 | Type `9876543210` | Accepted |
| 7 | Type `name@company` as the email | Rejected. `name@company.com` is accepted |
| 8 | Fill everything correctly and click **Send via WhatsApp (Fastest)** | WhatsApp opens with your message ready to send |
| 9 | Click **Submit Request to Team** | Spinner, then a green "Thank you" box |
| 10 | Check `sreetejamediatechnology@gmail.com` (and Spam) | A neat "New quote request" email, reply-to set to the customer |
| 11 | Footer links Privacy, Terms, Rental and refund | `legal.html` opens on the right section |

### 3.2 Test the email function from the terminal (optional)
Keep `npm run dev` running. Open a **second terminal** (click the + in the terminal panel).

Invalid data should be refused (this does **not** send an email):
```bash
curl -s -X POST http://localhost:3000/api/quote -H "Content-Type: application/json" -d '{"name":"R2","countryCode":"IN","phone":"123","email":"x","service":"rental","contactMethod":"WhatsApp"}'
```
Expected: `{"error":"Please check the form fields", ...}`

Valid data **sends a real email** to you:
```bash
curl -s -X POST http://localhost:3000/api/quote -H "Content-Type: application/json" -d '{"name":"Test Client","countryCode":"IN","phone":"9876543210","email":"test@example.com","service":"rental","area":"Kukatpally","details":"Test request","contactMethod":"WhatsApp","website":""}'
```
Expected: `{"ok":true}`

(Windows PowerShell users: use `Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/quote -ContentType "application/json" -Body '<same JSON as above>'`.)

---

## 4. Put the website live (Vercel, free plan is enough)

The email function needs a host that can run it. Vercel runs `api/quote.js` automatically.

### 4.1 Upload the project to GitHub
1. Create a free account at github.com and click **New repository**. Name it, for example, `sree-teja-website`. Keep it **Private**.
2. In the VS Code terminal (still inside the project folder):
```bash
git init
git add .
git commit -m "Initial website"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/sree-teja-website.git
git push -u origin main
```
Replace `YOUR-USERNAME` with your GitHub name. Do not worry about secrets: `.env.local` is listed in `.gitignore`, so it is **not** uploaded. Before pushing you can confirm with `git status`, which must not show `.env.local`.

### 4.2 Import into Vercel
1. Go to vercel.com, sign in with GitHub, click **Add New, Project**, and pick your repository.
2. Framework Preset: **Other**. Leave Build Command and Output Directory empty. (`styles.css` is already built.)
3. Open **Environment Variables** and add these three, one at a time:

| Name | Value |
|---|---|
| `RESEND_API_KEY` | your key |
| `QUOTE_TO_EMAIL` | `sreetejamediatechnology@gmail.com` |
| `QUOTE_FROM_EMAIL` | `Sree Teja Quotes <onboarding@resend.dev>` (or your verified domain address) |

4. Click **Deploy**. In about a minute you get a live address like `https://sree-teja-website.vercel.app`.
5. Open it, send a test request from the form, and confirm the email arrives.

### 4.3 Use your own domain (optional)
In Vercel: Project, **Settings, Domains**, add your domain, then follow the DNS instructions at your domain registrar.

### 4.4 Updating the live site later
Edit files, then:
```bash
git add .
git commit -m "Describe your change"
git push
```
Vercel redeploys automatically in about a minute.

If you change an environment variable in Vercel, click **Redeploy** for it to take effect.

---

## 5. How to change things

| I want to change | Edit this | Note |
|---|---|---|
| Phone, email, address | `index.html` (search for `99486` and the address), `legal.html`, and `api/quote.js` for the WhatsApp number in the email | Use Ctrl + Shift + F to search all files |
| Hero text, services, AMC text | `index.html` | Plain text between the tags |
| Hardware items and rates | `index.html`, section `id="hardware"` | Copy an `<article>` block to add an item. `data-cat` must be `rent`, `buy` or `upg` |
| Service dropdown or country list | `site.js` (top) **and** `api/quote.js` (top) | Keep both lists identical |
| Privacy, Terms, Rental terms | `legal.html` | |
| Where quote emails go | `QUOTE_TO_EMAIL` setting | No code change needed |
| Logo | Replace `logo.png` | Keep the same file name |

### 5.1 If you add new Tailwind classes
Colours and spacing that already appear in the files work as is. If you introduce **new** Tailwind class names, rebuild the stylesheet:
```bash
npm run build:css
```
This regenerates `styles.css` from your HTML. Then commit and push it with your other changes.

---

## 6. Troubleshooting

| Problem | Cause and fix |
|---|---|
| `npm` or `node` is not recognised | Node.js is not installed, or VS Code needs restarting after installing it |
| `ls` does not show `package.json` | The terminal is in the wrong folder. Re-open VS Code on the `sree-teja-html` folder itself |
| `node: bad option: --env-file` | Node is too old. Install Node 20.6 or newer |
| Form says "could not send your request" | Look at the terminal running `npm run dev`. It prints the reason: `RESEND_API_KEY is not set` (fix `.env.local`, restart) or `Resend error` (see next rows) |
| Resend says the sender or recipient is not allowed | You are using `onboarding@resend.dev` but signed up to Resend with a different email. Use the same email as the recipient, or verify your domain |
| Email does not arrive but the form said success | Check Spam. Then open Resend dashboard, **Logs**, to see delivery status |
| `401` or "API key is invalid" | The key is wrong, deleted or has spaces or quotes around it. Create a new one |
| Changed `.env.local` but nothing changed | Stop (Ctrl + C) and run `npm run dev` again |
| Works locally but not on Vercel | The three environment variables are missing in Vercel, or you did not click Redeploy after adding them |
| Opening `index.html` by double-click works but the form fails | Correct. The email button needs the server file. Use `npm run dev` or the Vercel address. The page, theme and WhatsApp button work either way |
| Page looks unstyled | `styles.css` is missing from the folder or was deleted. Run `npm run build:css` |

---

## 7. Safety notes
- The form has a hidden spam trap and a limit of 5 requests per visitor per 10 minutes. The limit resets whenever Vercel restarts the function. For heavy traffic, add Cloudflare Turnstile.
- The site loads **no** third-party scripts, fonts or analytics and sets **no** cookies. If you add Google Analytics or similar later, you will need a cookie consent banner and an updated privacy policy.
- The privacy, terms and rental pages are sensible drafts. Have a lawyer review them before relying on them.
