// Official sandbox / test-mode card numbers, copied from each provider's own docs on 31 October 2026
// (links in `docs`). These only work in that provider's test environment; random Luhn-valid numbers
// are declined there, because test mode recognizes only its own listed numbers.

export type Scenario = "success" | "decline" | "3ds" | "fraud" | "other";

export const SCENARIOS: { id: Scenario; label: string }[] = [
  { id: "success", label: "Successful payment" },
  { id: "decline", label: "Declines" },
  { id: "3ds", label: "3-D Secure / SCA" },
  { id: "fraud", label: "Fraud, risk & disputes" },
  { id: "other", label: "Other" },
];

export interface TestCard {
  number: string;
  brand: string;
  scenario: Scenario;
  /** What happens, in the provider's words where possible */
  result: string;
  cvc?: string;
  expiry?: string;
  /** Some providers list numbers that deliberately fail the Luhn check */
  luhnInvalid?: boolean;
}

export interface Gateway {
  id: string;
  name: string;
  docs: string;
  /** Expiry, CVC and environment rules */
  rules: string;
  /** How declines are simulated when it isn't by card number */
  declineHow?: string;
  /** Extra table, e.g. PayPal's rejection triggers */
  extra?: { title: string; columns: string[]; rows: string[][] };
  cards: TestCard[];
}

const c = (number: string, brand: string, scenario: Scenario, result: string, extra: Partial<TestCard> = {}): TestCard => ({ number: number.replace(/\s/g, ""), brand, scenario, result, ...extra });

export const GATEWAYS: Gateway[] = [
  {
    id: "stripe",
    name: "Stripe",
    docs: "https://docs.stripe.com/testing",
    rules: "Test mode only (test API keys). Any future expiry date and any 3-digit CVC — 4 digits for American Express.",
    cards: [
      c("4242424242424242", "Visa", "success", "Succeeds"),
      c("4000056655665556", "Visa (debit)", "success", "Succeeds"),
      c("5555555555554444", "Mastercard", "success", "Succeeds"),
      c("2223003122003222", "Mastercard (2-series)", "success", "Succeeds"),
      c("5200828282828210", "Mastercard (debit)", "success", "Succeeds"),
      c("5105105105105100", "Mastercard (prepaid)", "success", "Succeeds"),
      c("378282246310005", "American Express", "success", "Succeeds", { cvc: "Any 4 digits" }),
      c("6011111111111117", "Discover", "success", "Succeeds"),
      c("3056930009020004", "Diners Club", "success", "Succeeds"),
      c("36227206271667", "Diners Club (14-digit)", "success", "Succeeds"),
      c("3566002020360505", "JCB", "success", "Succeeds"),
      c("6200000000000005", "UnionPay", "success", "Succeeds"),
      c("4000000000000002", "Visa", "decline", "card_declined · generic_decline"),
      c("4000000000009995", "Visa", "decline", "card_declined · insufficient_funds"),
      c("4000000000009987", "Visa", "decline", "card_declined · lost_card"),
      c("4000000000009979", "Visa", "decline", "card_declined · stolen_card"),
      c("4000000000000069", "Visa", "decline", "expired_card"),
      c("4000000000000127", "Visa", "decline", "incorrect_cvc"),
      c("4000000000000119", "Visa", "decline", "processing_error"),
      c("4242424242424241", "Visa", "decline", "incorrect_number (fails the Luhn check on purpose)", { luhnInvalid: true }),
      c("4000000000006975", "Visa", "decline", "card_declined · card_velocity_exceeded"),
      c("4000002500003155", "Visa", "3ds", "Requires authentication unless the card was set up for future payments"),
      c("4000002760003184", "Visa", "3ds", "Always requires authentication"),
      c("4000000000003220", "Visa", "3ds", "3DS required; succeeds after authentication"),
      c("4000008400001629", "Visa", "3ds", "3DS required; declined (card_declined) after authentication"),
      c("4000000032200000", "Visa", "3ds", "3DS on every payment, frictionless flow; succeeds"),
      c("4100000000000019", "Visa", "fraud", "Always blocked by Radar (highest risk)"),
      c("4000000000000101", "Visa", "fraud", "CVC check fails when a CVC is provided"),
      c("4000000000000036", "Visa", "fraud", "Postal code check fails when a postal code is provided"),
      c("4000000000000259", "Visa", "fraud", "Succeeds, then a fraudulent dispute is created"),
      c("4000000000002685", "Visa", "fraud", "Succeeds, then disputed as product not received"),
      c("4000000000005423", "Visa", "fraud", "Succeeds, then gets an early fraud warning"),
      c("4000000000000077", "Visa", "other", "Succeeds; funds skip the pending balance"),
      c("4000000000007726", "Visa", "other", "Refunds start pending, then succeed asynchronously"),
    ],
  },
  {
    id: "adyen",
    name: "Adyen",
    docs: "https://docs.adyen.com/development-resources/test-cards-and-credentials/test-card-numbers",
    rules: "Test environment only. Use the expiry and security code Adyen lists — 03/2030 and 737 for most cards, 7373 for American Express.",
    cards: [
      c("4111 1111 1111 1111", "Visa", "success", "Authorised (consumer, NL)", { expiry: "03/2030", cvc: "737" }),
      c("4988 4388 4388 4305", "Visa", "success", "Authorised (classic, ES)", { expiry: "03/2030", cvc: "737" }),
      c("4400 0000 0000 0008", "Visa (debit)", "success", "Authorised (debit, US)", { expiry: "03/2030", cvc: "737" }),
      c("5555 3412 4444 1115", "Mastercard", "success", "Authorised (consumer, NL)", { expiry: "03/2030", cvc: "737" }),
      c("2222 4000 7000 0005", "Mastercard", "success", "Authorised (commercial debit, CA)", { expiry: "03/2030", cvc: "737" }),
      c("3700 0000 0000 002", "American Express", "success", "Authorised (NL)", { expiry: "03/2030", cvc: "7373" }),
      c("6011 6011 6011 6611", "Discover", "success", "Authorised (US)", { expiry: "03/2030", cvc: "737" }),
      c("3569 9900 1009 5841", "JCB", "success", "Authorised (US)", { expiry: "03/2030", cvc: "737" }),
      c("3600 6666 3333 44", "Diners", "success", "Authorised (US)", { expiry: "03/2030", cvc: "737" }),
      c("6243 0300 0000 0001", "China UnionPay", "success", "Authorised (CN)", { expiry: "12/2029", cvc: "737" }),
      c("4360 0000 0100 0005", "Cartes Bancaires", "success", "Authorised (FR)", { expiry: "03/2030", cvc: "737" }),
      c("6703 4444 4444 4449", "Bancontact / Maestro", "success", "Authorised (BE); no security code", { expiry: "03/2030", cvc: "None" }),
      c("3714 4963 5398 431", "American Express", "3ds", "Enrolled in 3D Secure 2", { expiry: "03/2030", cvc: "7373" }),
      c("5454 5454 5454 5454", "Mastercard", "3ds", "Enrolled in 3D Secure 2", { expiry: "03/2030", cvc: "737" }),
      c("4917 6100 0000 0000", "Visa", "3ds", "Enrolled in 3D Secure 2", { expiry: "03/2030", cvc: "737" }),
      c("6011 1111 1111 1117", "Discover", "3ds", "Enrolled in 3D Secure 2", { expiry: "03/2030", cvc: "737" }),
      c("3566 1111 1111 1113", "JCB / Mastercard", "3ds", "Enrolled in 3D Secure 2", { expiry: "03/2030", cvc: "737" }),
    ],
  },
  {
    id: "braintree",
    name: "Braintree",
    docs: "https://developer.paypal.com/braintree/docs/reference/general/testing/node",
    rules: "Sandbox only, with a future expiry date. Fraud and CVV results only trigger if the matching rules are enabled in your sandbox.",
    declineHow: "Any amount from 2000.00 to 2999.99 returns Processor Declined with that number as the response code (for example 2001.00 → 2001 Insufficient Funds); 3000.00–3000.99 fails with a 3000 processor response.",
    cards: [
      c("4111111111111111", "Visa", "success", "Valid"),
      c("4005519200000004", "Visa", "success", "Valid (Durbin regulated)"),
      c("4012888888881881", "Visa", "success", "Valid"),
      c("5555555555554444", "Mastercard", "success", "Valid"),
      c("2223000048400011", "Mastercard", "success", "Valid"),
      c("378282246310005", "American Express", "success", "Valid"),
      c("6011000991300009", "Discover", "success", "Valid"),
      c("3530111333300000", "JCB", "success", "Valid"),
      c("36259600000004", "Diners Club", "success", "Valid"),
      c("6304000000000000", "Maestro", "success", "Valid"),
      c("6243030000000001", "UnionPay", "success", "Valid"),
      c("4000111111111115", "Visa", "decline", "Verification: processor declined"),
      c("5105105105105100", "Mastercard", "decline", "Verification: processor declined"),
      c("378734493671000", "American Express", "decline", "Verification: processor declined"),
      c("6011000990139424", "Discover", "decline", "Verification: processor declined"),
      c("38520000009814", "Diners Club", "decline", "Verification: processor declined"),
      c("4000111111111511", "Visa", "fraud", "gateway_rejected · fraud"),
      c("4111130000000003", "Visa", "fraud", "gateway_rejected · risk_threshold"),
      c("4111140000000002", "Visa", "fraud", "Authorized with a Review risk decision"),
      c("4500600000000061", "Visa", "other", "Prepaid card"),
      c("4012000033330125", "Visa", "other", "Debit card"),
      c("4444333322221111", "Visa", "other", "Issued in the United Kingdom (GBR)"),
    ],
  },
  {
    id: "paypal",
    name: "PayPal",
    docs: "https://developer.paypal.com/tools/sandbox/card-testing/",
    rules: "Sandbox only (Expanded Checkout). Any future expiry date and any 3-digit CVV.",
    declineHow: "Declines come from a rejection trigger typed into the First Name or Name on Card field (case-sensitive), using a Visa test card such as 4012 8888 8888 1881.",
    extra: {
      title: "Rejection triggers (put in the name field)",
      columns: ["Trigger", "Response", "Meaning"],
      rows: [
        ["CCREJECT-REFUSED", "0500", "DO_NOT_HONOR"],
        ["CCREJECT-SF", "9500", "SUSPECTED_FRAUD"],
        ["CCREJECT-EC", "5400", "EXPIRED_CARD"],
        ["CCREJECT-IRC", "5180", "INVALID_OR_RESTRICTED_CARD"],
        ["CCREJECT-IF", "5120", "INSUFFICIENT_FUNDS"],
        ["CCREJECT-LS", "9520", "LOST_OR_STOLEN"],
        ["CCREJECT-IA", "1330", "INVALID_ACCOUNT"],
        ["CCREJECT-BANK_ERROR", "5100", "GENERIC_DECLINE"],
        ["CCREJECT-CVV_F", "00N7", "CVV2_FAILURE_POSSIBLE_RETRY_WITH_CVV"],
      ],
    },
    cards: [
      c("4012888888881881", "Visa", "success", "Approved (also the card to use with rejection triggers)"),
      c("4005519200000004", "Visa", "success", "Approved"),
      c("4012000077777777", "Visa", "success", "Approved"),
      c("2223000048400011", "Mastercard", "success", "Approved"),
      c("371449635398431", "American Express", "success", "Approved", { cvc: "Any 4 digits" }),
      c("36461510000039", "Diners Club", "success", "Approved"),
      c("6304000000000000", "Maestro", "success", "Approved"),
      c("3636500000000260", "JCB", "success", "Approved"),
      c("6200680000000004", "China UnionPay", "success", "Approved"),
    ],
  },
  {
    id: "checkout",
    name: "Checkout.com",
    docs: "https://www.checkout.com/docs/developer-resources/testing/test-cards",
    rules: "Sandbox only. Any future expiry date (MM/YY or MM/YYYY) and any 3-digit CVV — 4 digits for American Express.",
    cards: [
      c("4242424242424242", "Visa", "success", "10000 Approved (GB). With amount 101 → 20051 Insufficient funds"),
      c("4000020000000000", "Visa", "success", "10000 Approved (US)"),
      c("4659105569051157", "Visa (debit)", "success", "10000 Approved (GB)"),
      c("5436031030606378", "Mastercard", "success", "10000 Approved (MU)"),
      c("5305484748800098", "Mastercard (debit)", "success", "10000 Approved (DE)"),
      c("345678901234564", "American Express", "success", "10000 Approved (ES)", { cvc: "Any 4 digits" }),
      c("6011111111111117", "Discover", "success", "10000 Approved (US)"),
      c("4111111111111129", "Visa", "decline", "20001 Refer to card issuer"),
      c("4485381577182090", "Visa", "decline", "20014 Invalid card number"),
      c("4544249167673670", "Visa", "decline", "20051 Insufficient funds"),
      c("4818924250131070", "Visa", "decline", "20062 Restricted card"),
      c("4734868958733862", "Visa", "decline", "200N7 Decline for CVV2 failure"),
      c("4941202060999329", "Visa", "decline", "30041 Lost card – pick up"),
      c("4539253655711767", "Visa", "decline", "30043 Stolen card – pick up"),
      c("5437821135399682", "Mastercard", "decline", "20051 Insufficient funds"),
      c("4897453568485113", "Visa", "fraud", "20059 Suspected fraud"),
      c("4485040371536584", "Visa", "3ds", "3DS2 frictionless: authentication successful"),
      c("5137210000000018", "Cartes Bancaires / Mastercard", "3ds", "3DS2 frictionless: authentication successful"),
      c("5385308360135181", "Mastercard", "3ds", "3DS2 challenge: authentication successful"),
      c("372688581899681", "American Express", "3ds", "3DS2 challenge: authentication successful", { cvc: "Any 4 digits" }),
      c("4024007186645015", "Visa", "3ds", "3DS2 frictionless: authentication could not be performed"),
    ],
  },
  {
    id: "square",
    name: "Square",
    docs: "https://developer.squareup.com/docs/devtools/sandbox/payments",
    rules: "Sandbox only. Any future expiry month and year; use the CVV listed. Payments in USD, CAD or GBP also need a valid postal code.",
    cards: [
      c("4111 1111 1111 1111", "Visa", "success", "Succeeds", { cvc: "111" }),
      c("5105 1051 0510 5100", "Mastercard", "success", "Succeeds", { cvc: "111" }),
      c("6011 0000 0000 0004", "Discover", "success", "Succeeds", { cvc: "111" }),
      c("3000 000000 0004", "Diners Club", "success", "Succeeds", { cvc: "111" }),
      c("3569 9900 1009 5841", "JCB", "success", "Succeeds", { cvc: "111" }),
      c("3400 000000 00009", "American Express", "success", "Succeeds", { cvc: "1111" }),
      c("6222 9888 1234 0000", "China UnionPay", "success", "Succeeds (as listed by Square; not Luhn-valid — UnionPay doesn't always use the check)", { cvc: "123", luhnInvalid: true }),
      c("4000000000000002", "Visa", "decline", "Card declined"),
      c("4000000000000010", "Visa", "decline", "Card on file: authorization declined"),
      c("4800 0000 0000 0004", "Visa", "3ds", "SCA (Web Payments SDK): no challenge", { cvc: "111" }),
      c("4310 0000 0020 1019", "Visa", "3ds", "SCA challenge: enter verification code 123456", { cvc: "111" }),
      c("5248 4800 0021 0026", "Mastercard", "3ds", "SCA challenge: enter verification code 123456", { cvc: "111" }),
      c("4811 1100 0000 0008", "Visa", "3ds", "SCA: no challenge, verification fails", { cvc: "111" }),
    ],
  },
];

/** "4242424242424242" → "4242 4242 4242 4242"; American Express 4-6-5, 14-digit Diners 4-6-4 */
export function formatCardNumber(n: string): string {
  if (/^3[47]\d{13}$/.test(n)) return `${n.slice(0, 4)} ${n.slice(4, 10)} ${n.slice(10)}`;
  if (/^3\d{13}$/.test(n)) return `${n.slice(0, 4)} ${n.slice(4, 10)} ${n.slice(10)}`;
  return n.replace(/(\d{4})(?=\d)/g, "$1 ");
}
