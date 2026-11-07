---
title: "Test Credit Card Numbers Explained: Luhn, Sandbox Cards, and Why Generated Numbers Can't Buy Anything"
description: "How card numbers are built, what the Luhn check does and doesn't prove, which numbers to use at each stage of testing a checkout, and why a generated number never buys anything."
date: "2026-11-07"
author: "ToolNinja"
coverEmoji: "💳"
tags: ["test credit card numbers", "luhn algorithm", "stripe test cards", "payment testing", "sandbox test cards", "card number validation", "checkout testing", "payments"]
relatedTools: ["payment-test-cards", "credit-card-test-generator"]
faqs:
  - q: "Can a generated card number be used to buy something?"
    a: "No. A merchant's payment provider asks the bank that issued the card to approve the charge, and no bank has an account for a generated number, so it's declined. Using made-up card details to get a paid service is at best a breach of that service's terms, and it can be fraud."
  - q: "Why was my Luhn-valid number rejected in Stripe's test mode?"
    a: "Test mode recognizes only the numbers Stripe lists in its documentation. A number with a correct checksum that isn't on that list is still declined. Use the listed numbers, such as 4242 4242 4242 4242."
  - q: "Does passing the Luhn check mean a card is real?"
    a: "No. Luhn only catches typing mistakes. About one in every ten random numbers passes it. It says nothing about whether the card exists, is active or has funds."
  - q: "Can I test with my own real card?"
    a: "Don't. Payment providers tell you not to, real card numbers end up in logs and fixtures, and storing them brings those systems into PCI DSS scope. Sandbox cards can simulate approvals, declines and 3-D Secure without any of that."
  - q: "Do all card numbers pass the Luhn check?"
    a: "Nearly all, but not every one. Some UnionPay cards don't use the check, so a form that hard-rejects Luhn failures can turn away a genuine card. Check your provider's guidance if you accept UnionPay."
---

"Test credit card number" can mean three quite different things, and mixing them up causes most of the confusion. Some numbers only have the right shape. Some work inside one payment provider's sandbox. And real cards are the only ones that can move money.

Here's how they differ and which one to use when.

## What a card number is made of

A card number isn't random. It has three parts:

| Part | Example in `4242 4242 4242 4242` | What it does |
|---|---|---|
| Issuer identification number (IIN, also called BIN) | The first 6 to 8 digits | Identifies the network and the issuing bank. A leading 4 means Visa |
| Account number | The middle digits | Identifies the account at that bank |
| Check digit | The last digit | Catches typing mistakes |

Length varies by network: Visa and Mastercard numbers are usually 16 digits, and American Express numbers are 15, with a 4-digit security code.

## What the Luhn check does

The last digit is chosen so the whole number passes the Luhn algorithm, a simple checksum from the 1950s. To check a number:

1. Starting from the second digit from the right, double every second digit.
2. If doubling gives more than 9, subtract 9.
3. Add everything up. The number passes if the total ends in 0.

For `4242 4242 4242 4242`, each 4 gets doubled to 8 and each 2 stays as it is. That's eight pairs of 8 + 2, which total 80, so it passes.

```js
function passesLuhn(number) {
  const digits = number.replace(/\D/g, "");
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let digit = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return digits.length > 0 && sum % 10 === 0;
}
```

Luhn exists to catch mistakes: it detects any single wrong digit and most swaps of two neighboring digits. That's all it does. **Passing Luhn doesn't mean a card exists.** About one random number in ten passes.

## The three kinds of test number

| | Generated numbers | Sandbox test cards | Real cards |
|---|---|---|---|
| Passes a form's format check | Yes | Almost always | Yes |
| Works in a provider's test mode | No | Yes, in that provider's | No |
| Simulates declines or 3-D Secure | No | Yes | No |
| Can charge real money | **No** | **No** | Yes |

**Generated numbers** have the right prefix, length and check digit, and nothing else. Our [Credit Card Test Number Generator](/tools/credit-card-test-generator) makes them. They're for testing your own form before any payment provider is involved.

**Sandbox test cards** are specific numbers a provider has wired into its test environment, and each one triggers a set result. On Stripe, for example, `4242 4242 4242 4242` succeeds, `4000 0000 0000 0002` gives a generic decline, and `4000 0000 0000 9995` declines for insufficient funds. Our [Payment Test Cards](/tools/payment-test-cards) page lists them for Stripe, Adyen, Braintree, PayPal, Checkout.com and Square, with links to each provider's documentation.

These numbers only mean something in test mode. Enter one on a live checkout and it's declined like any other invalid card.

## Why a generated number can't buy anything

Passing a checkout form's validation is the first and smallest step in a payment. When a merchant submits a charge, it goes through their payment provider and the card network to the bank that issued the card. That bank looks up the account and decides.

A generated number fails at that lookup, because the account doesn't exist. Even a number that happened to match a real account would still need the correct expiry date and security code, and banks generate those codes using secret keys, so they can't be worked out from the number. Checks on the billing address and fraud systems come after that.

The same goes for free trials. Services that ask for a card generally verify it with the bank, often with a small or zero-value authorization, so a generated number gets rejected there too. And entering made-up card details to get a paid service isn't a harmless shortcut: at best it breaks that service's terms, and it can be fraud. If you're looking for a way to try something without sharing your card, some banks offer virtual cards, which are real cards with limits you control.

## What to use at each stage

| What you're testing | Use |
|---|---|
| Field formatting, length, card brand detection, Luhn errors | Generated numbers |
| A successful charge through your integration | Your provider's success card |
| Your error messages for declined payments | Your provider's decline cards |
| 3-D Secure and authentication flows | Your provider's 3-D Secure cards |
| Webhooks, refunds and disputes | Your provider's sandbox, with its dispute cards |
| The live setup, once before launch | A small real charge on your own card in live mode, then refund it |

Test the failures as carefully as the success. Most checkout bugs are in what happens after a decline: a spinner that never stops, a form that clears itself, or a double charge after a retry.

## Mistakes to avoid

**Using real cards for testing.** Stripe's documentation says not to, and real numbers tend to leak into logs, screenshots and fixtures. Storing them brings those systems into scope for PCI DSS, the payment card security standard.

**Treating a Luhn failure as final without thinking about who you accept.** Some UnionPay cards don't use the check. If you accept them, follow your provider's guidance, since a hard rule in your form could reject a genuine card.

**Checking only the format and assuming payment will work.** Your form can't know whether a card will be approved. Handle the provider's response as the real answer.

**Hard-coding one provider's test cards across environments.** Each provider's numbers work only in its own sandbox. If you switch providers, your test data needs to change too.

**Forgetting that scanners can't tell the difference.** Data loss prevention tools flag anything that looks like a card number. Test numbers in logs or support tickets can set them off, so keep them out of production systems.

## Next steps

For a form you're building, start with the [generator](/tools/credit-card-test-generator) to check your validation. Once your payment provider is connected, move on to [its official test cards](/tools/payment-test-cards) and work through the declines as well as the approvals.
