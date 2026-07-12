export function formatWifiQR(
  ssid: string,
  password: string,
  encryption: "WPA" | "WEP" | "nopass",
  hidden: boolean
): string {
  const esc = (s: string) => s.replace(/([\\;,:"])/g, "\\$1");
  return `WIFI:T:${encryption};S:${esc(ssid)};P:${encryption === "nopass" ? "" : esc(password)};H:${hidden ? "true" : "false"};;`;
}

export function formatVCardQR(fields: {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  org?: string;
  title?: string;
  url?: string;
}): string {
  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${fields.lastName};${fields.firstName};;;`,
    `FN:${fields.firstName} ${fields.lastName}`.trim(),
    fields.org ? `ORG:${fields.org}` : "",
    fields.title ? `TITLE:${fields.title}` : "",
    fields.phone ? `TEL;TYPE=CELL:${fields.phone}` : "",
    fields.email ? `EMAIL:${fields.email}` : "",
    fields.url ? `URL:${fields.url}` : "",
    "END:VCARD",
  ]
    .filter(Boolean)
    .join("\n");
}

export function formatEventQR(fields: {
  title: string;
  start: string;
  end: string;
  location?: string;
  description?: string;
}): string {
  return [
    "BEGIN:VEVENT",
    `SUMMARY:${fields.title}`,
    `DTSTART:${fields.start}`,
    `DTEND:${fields.end}`,
    fields.location ? `LOCATION:${fields.location}` : "",
    fields.description ? `DESCRIPTION:${fields.description}` : "",
    "END:VEVENT",
  ]
    .filter(Boolean)
    .join("\n");
}
