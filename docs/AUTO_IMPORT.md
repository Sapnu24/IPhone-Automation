# Turning bank / e‑wallet / payout messages into transactions

Hive can read a **bank, GCash/Maya, or Upwork message** and log the amount,
whether it's money in or out, and who it was with — **without your account
numbers, passwords, or inbox access**. Three ways, from simplest to most
automatic. (Reading SMS silently, or running while the app is closed, isn't
possible for any iPhone web app — so these are the privacy‑safe alternatives.)

## 1. Paste it to Buzz (works now, zero setup)

1. Copy a message like *"You have received PHP 1,000.00 from Maria via GCash."*
2. Open the **Buzz** chat (the floating button) and paste it → **Send**.
3. Buzz logs it (income/expense, amount, merchant). Tap **Undo** if it's wrong.

Buzz understands common phrasings: *received / credited / refund* → money in;
*sent / debited / paid / purchase* → money out. USD payouts (Upwork) are tagged
`(USD)` in the note.

## 2. One‑tap from any message — iOS Shortcut (near‑automatic)

This adds a **"Log to Hive"** button to the iOS share sheet, so a bank text or
email becomes a transaction in one tap — it only ever sees the message you
share.

Set it up once:

1. Open the **Shortcuts** app → **+** → name it **Log to Hive**.
2. Tap the **(i)** info button → turn on **Show in Share Sheet**. Under
   *Share Sheet Types* keep **Text** on.
3. Add action **URL Encode** — set its input to **Shortcut Input**.
4. Add action **Text** and paste:
   `https://sapnu24.github.io/IPhone-Automation/#/log?text=`
   then, right after the `=`, insert the **URL Encoded** variable from step 3.
5. Add action **Open URLs** — set it to the **Text** from step 4.
6. Done. Now: in Messages or Mail, **select the message → Share → Log to Hive**.
   Hive opens, shows **"Logged ✓"**, and it's saved.

*(The link also accepts explicit values, e.g.
`…/#/log?amount=500&type=expense&note=Grab` — handy if you'd rather have the
Shortcut extract the number itself.)*

## 3. Fully hands‑free from email — Gmail auto‑import (advanced, later)

The only way to capture money **without any tap, even while the app is closed**,
is a **Google Apps Script that runs inside your own Gmail** every ~15 minutes,
reads only messages matching a bank/payout filter, and writes them to your
Hive cloud.

Requirements & limits, to be clear:
- **Email only** — it cannot see SMS (so GCash push/SMS won't be caught; turn on
  email receipts where the service offers them; BPI and Upwork email by default).
- Needs the **cloud sync (Firebase) connected first** (see
  `CLOUD_SYNC_SETUP.md`), plus a small "inbox" collection for the script to
  drop parsed transactions into, which the app drains on open.
- It reads your inbox (scoped to a search query like
  `from:(bpi.com.ph OR upwork.com) newer_than:2d`), all inside your own Google
  account — nothing goes to a third party.

This one needs a bit of plumbing on the app side; say the word once your Firebase
sync is live and it can be wired up with a script you paste into
[script.google.com](https://script.google.com).
