---
title: "QR Code Generator Guide: WiFi, vCard, and Custom QR Codes"
description: "How QR codes actually encode data, the exact WiFi and vCard string formats, calendar event QR codes, and how to choose an error correction level — with a free browser-based generator for each type."
date: "2026-07-15"
author: "ToolNinja"
coverEmoji: "📱"
tags: ["qr code generator guide", "wifi qr code generator", "vcard qr code", "how to make wifi qr code", "qr code for contact card", "custom qr code generator free", "qr code error correction explained", "qr code for calendar event", "free qr code generator no login", "qr code types explained", "qr-code", "tools", "mobile", "networking"]
relatedTools: ["qr-code-generator"]
faqs:
  - q: "How do I make a WiFi QR code?"
    a: "Open the ToolNinja QR Code Generator, switch to the WiFi tab, enter your network name (SSID), password, and encryption type (WPA/WEP/None), and the QR code updates live. Scanning it with a phone camera prompts the user to join the network — no need to say the password out loud or type it on a screen."
  - q: "How do I make a QR code for my contact info?"
    a: "Use the Contact tab in the QR Code Generator. Fill in name, phone, email, and optionally company, title, and website — it generates a vCard-format QR code. Scanning it on most phones offers to save the details directly to Contacts, which is why they show up on business cards and conference badges."
  - q: "What does a QR code actually store?"
    a: "Just text. A QR code is a visual encoding of a string — a URL, a WiFi credential string, a vCard, whatever you give it. The scanning app decides what to do with that string based on its format: open a browser for a URL, offer to join a network for a WIFI: string, offer to save a contact for a VCARD: block."
  - q: "What's the difference between QR code error correction levels?"
    a: "L, M, Q, and H trade code density for damage tolerance — L recovers from about 7% data loss, M about 15%, Q about 25%, and H about 30%. Use L for clean digital displays where nothing will obscure the code, and Q or H for printed codes, small print runs, or anywhere a logo overlays part of the code."
---

## QR Codes Are Just Text

It's worth demystifying this up front: a QR code doesn't "do" anything by itself. It's a visual, scannable encoding of a plain text string — nothing more. The magic isn't in the QR code; it's in the scanning app on your phone, which looks at the *format* of that string and decides what action to offer.

- A string starting with `http://` or `https://` → the camera app offers to open it as a link
- A string starting with `WIFI:` → the phone offers to join that network
- A string starting with `BEGIN:VCARD` → the phone offers to save a contact
- A string starting with `BEGIN:VEVENT` → the phone offers to add a calendar event
- Anything else → it's just displayed as plain text

Once you know this, "how do I make a WiFi QR code" stops being a mystery — you just need to know the exact string format phones expect.

---

## WiFi QR Codes — the Exact Format

The format standardized across Android and iOS camera apps is:

```
WIFI:T:WPA;S:mynetwork;P:mypassword;;
```

Broken down:

- `T:` — encryption type (`WPA` covers WPA/WPA2/WPA3, `WEP` for legacy networks, `nopass` for open networks)
- `S:` — the SSID (network name)
- `P:` — the password (omitted or empty for `nopass`)
- `;;` — closes the string

Special characters in the SSID or password (`;`, `,`, `:`, `\`, `"`) need to be escaped with a backslash, or the string parses incorrectly.

**Why this matters for guests:** instead of reading your WiFi password out loud character-by-character, or writing it on a sticky note, you generate one QR code and stick it near the router or hand it to a guest. They scan, tap "Join," and they're connected — the password never has to be spoken or typed.

Use the **[WiFi tab in the QR Code Generator](/tools/qr-code-generator)** — enter SSID, password, and encryption type, and it builds this string for you automatically.

---

## vCard QR Codes — Digital Business Cards

A vCard is a plain-text contact card format (RFC 6350). The minimal structure looks like:

```
BEGIN:VCARD
VERSION:3.0
N:Doe;Jane;;;
FN:Jane Doe
ORG:Acme Inc
TITLE:Senior Engineer
TEL;TYPE=CELL:+1-555-0100
EMAIL:jane@example.com
URL:https://example.com
END:VCARD
```

Scan it, and most phones offer to save the contact directly — no typing, no misspelled emails from squinting at a business card in bad lighting.

**Common use cases:**
- Printed business cards with a QR code alongside (or instead of) the text
- Conference badges — attendees scan to exchange contact info instantly
- Email signatures — a small QR code that saves your full contact details

Use the **Contact tab** in the QR Code Generator to fill in the fields — first name, last name, phone, email, and optional organization, title, and URL — and get a live-updating vCard QR code.

---

## Calendar Event QR Codes

Calendar QR codes use the iCal `VEVENT` format:

```
BEGIN:VEVENT
SUMMARY:Product Launch Call
DTSTART:20260901T140000Z
DTEND:20260901T150000Z
LOCATION:Zoom
DESCRIPTION:Quarterly product launch review
END:VEVENT
```

`DTSTART` and `DTEND` use the `YYYYMMDDTHHmmssZ` format — a `Z` suffix means UTC. Scanning the code offers to add the event directly to the phone's calendar, which is useful on printed event flyers, meeting room signage, or workshop handouts where you want attendees to save the time slot without typing anything.

Use the **Event tab** in the QR Code Generator — enter a title, start/end time, and optional location and description.

---

## Error Correction Levels Explained

QR codes have built-in redundancy so they still scan even if part of the code is dirty, torn, or has a logo stamped over it. Four levels are available:

| Level | Damage recovery | Best for |
|---|---|---|
| **L** (Low) | ~7% | Clean digital displays — screens, slide decks |
| **M** (Medium) | ~15% | General-purpose printing |
| **Q** (Quartile) | ~25% | Printed materials that may get scuffed or partially covered |
| **H** (High) | ~30% | Codes with a logo overlaid, or small/low-quality print runs |

Higher error correction adds more redundant data to the code, which makes the pattern visually denser — that's the trade-off. Use the lowest level that reliably scans for your use case; unnecessarily high error correction just makes the code harder to scan from a distance for no benefit.

---

## Plain URL and Text QR Codes

The simplest case, and still the most common: paste any URL or plain text into the **Text/URL tab**, and it encodes directly with no special formatting. Useful for linking print materials to a landing page, a menu, a portfolio, or anything else that's just "go to this URL."

---

## Try It Now

**[Open the QR Code Generator →](/tools/qr-code-generator)** — switch between Text/URL, WiFi, Contact, and Event modes, adjust error correction and colors, and download as PNG. Runs entirely in your browser — no data sent anywhere.
