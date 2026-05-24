---
title: "How to Convert cURL Commands to Python, JavaScript, PHP and More"
description: "Learn how to convert cURL commands to Python requests, JavaScript fetch, axios, PHP, Go and Java. Real examples, curl flags explained, and a free online converter."
date: "2026-05-24"
author: "ToolNinja"
coverEmoji: "🔄"
tags: ["curl", "python", "javascript", "api", "devops"]
relatedTools: ["curl-to-code"]
faqs:
  - q: "What does the -X flag do in curl?"
    a: "The -X flag (or --request) sets the HTTP method. Without it, curl defaults to GET. -X POST sends a POST request, -X DELETE sends DELETE, and so on."
  - q: "How do I convert a Postman request to Python code?"
    a: "In Postman, click the Code button (</> icon) in the right sidebar, select cURL from the dropdown, copy the command, then paste it into a cURL to code converter and select Python."
  - q: "What is the difference between -d and -F in curl?"
    a: "-d sends a plain request body (used for JSON or URL-encoded form data). -F sends a multipart/form-data request used for file uploads. In Python, -d maps to data= or json=, while -F maps to files=."
---

## What is cURL?

cURL is a command-line tool for transferring data with URLs — effectively the universal language of HTTP APIs. Nearly every API documentation page shows examples as curl commands, and tools like Postman include "Copy as cURL" buttons for exactly this reason.

A typical curl command looks like this:

```bash
curl -X POST https://api.example.com/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{"name": "John", "email": "john@example.com"}'
```

Let's break this down before converting it.

---

## cURL Flags — What They Mean

Understanding curl flags makes conversion to code straightforward:

| Flag | Meaning | Code Equivalent |
|------|---------|-----------------|
| `-X POST` | HTTP method | `method: 'POST'` |
| `-H "Key: Value"` | Request header | `headers: {'Key': 'Value'}` |
| `-d '{"data"}'` | Request body | `body: JSON.stringify(...)` |
| `-u user:pass` | Basic auth | `auth=(user, pass)` |
| `-b "key=val"` | Send cookies | `cookies: {'key': 'val'}` |
| `-F "field=val"` | Multipart form | `files={'field': val}` |
| `-L` | Follow redirects | `allow_redirects=True` |
| `-k` | Skip SSL verify | `verify=False` |
| `--max-time 30` | Request timeout | `timeout=30` |
| `-I` | HEAD request | `requests.head(url)` |

---

## Convert cURL to Python (requests)

Python's `requests` library is the most popular HTTP client in the ecosystem. Install it with `pip install requests`.

```python
import requests

headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGc...',
}

json_data = {
    'name': 'John',
    'email': 'john@example.com',
}

response = requests.post(
    'https://api.example.com/users',
    headers=headers,
    json=json_data,
)

print(response.status_code)
print(response.json())
```

**Key points:**
- `-X POST` → `requests.post()`
- `-H "Content-Type: application/json"` → in the `headers` dict
- `-d '{"json"}'` → `json=` parameter (requests handles serialization automatically)
- For basic auth: `requests.get(url, auth=('user', 'pass'))`
- For form data: use `data=` instead of `json=`

---

## Convert cURL to JavaScript (fetch)

The browser-native `fetch` API works in both browsers and Node.js 18+:

```javascript
const response = await fetch('https://api.example.com/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGc...',
  },
  body: JSON.stringify({
    name: 'John',
    email: 'john@example.com',
  }),
});

const data = await response.json();
console.log(data);
```

**Key differences from Python:**
- The body must be manually `JSON.stringify()`-ed
- `fetch` doesn't throw on 4xx/5xx responses — check `response.ok`
- Use `await response.json()` to parse the response

---

## Convert cURL to JavaScript (axios)

Axios is the most popular HTTP library for Node.js and browser apps:

```javascript
import axios from 'axios';

const response = await axios.post(
  'https://api.example.com/users',
  {
    name: 'John',
    email: 'john@example.com',
  },
  {
    headers: {
      'Authorization': 'Bearer eyJhbGc...',
    },
  }
);

console.log(response.data);
```

**Why axios over fetch:**
- Automatic JSON serialization — no `JSON.stringify()` needed
- Throws errors on 4xx/5xx status codes
- Request and response interceptors
- Works in older Node.js without polyfills

---

## Convert cURL to PHP

PHP has built-in cURL support through the `curl_*` functions:

```php
<?php

$ch = curl_init();

curl_setopt($ch, CURLOPT_URL, 'https://api.example.com/users');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer eyJhbGc...',
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, '{"name":"John","email":"john@example.com"}');

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$data = json_decode($response, true);
echo $data['name'];
?>
```

---

## Convert cURL to Go

Go's standard library includes a powerful HTTP client with no extra dependencies:

```go
package main

import (
    "fmt"
    "io"
    "net/http"
    "strings"
)

func main() {
    body := strings.NewReader(`{"name":"John","email":"john@example.com"}`)

    req, err := http.NewRequest("POST", "https://api.example.com/users", body)
    if err != nil {
        panic(err)
    }

    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("Authorization", "Bearer eyJhbGc...")

    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        panic(err)
    }
    defer resp.Body.Close()

    bodyBytes, _ := io.ReadAll(resp.Body)
    fmt.Println(string(bodyBytes))
}
```

---

## Convert cURL to Java

Java 11+ includes a built-in HttpClient — no external libraries needed:

```java
import java.net.http.*;
import java.net.URI;

public class Main {
    public static void main(String[] args) throws Exception {
        var client = HttpClient.newHttpClient();

        var body = "{\"name\":\"John\",\"email\":\"john@example.com\"}";

        var request = HttpRequest.newBuilder()
            .uri(URI.create("https://api.example.com/users"))
            .header("Content-Type", "application/json")
            .header("Authorization", "Bearer eyJhbGc...")
            .POST(HttpRequest.BodyPublishers.ofString(body))
            .build();

        var response = client.send(request, HttpResponse.BodyHandlers.ofString());
        System.out.println(response.statusCode());
        System.out.println(response.body());
    }
}
```

---

## How Postman Exports cURL Commands

If you're working in Postman, getting the curl command is simple:

1. Open any request in Postman
2. Click the **Code** button — the `</>` icon in the right sidebar
3. Select **cURL** from the language dropdown
4. Copy the generated command

This makes it easy to share requests with teammates, run them in CI/CD pipelines, or — most importantly — convert them to application code using a converter tool.

---

## The Fastest Way — ToolNinja cURL Converter

Converting curl commands manually works for simple requests, but complex commands with multiple headers, authentication, cookies, nested JSON bodies and query parameters can take 10–15 minutes to translate correctly.

ToolNinja's free cURL to Code Converter handles it instantly:

1. Paste any curl command (multi-line format fully supported)
2. Select Python, JavaScript, PHP, Go, Java, C#, Ruby or Node.js
3. Get clean, ready-to-run code with copy and download buttons

🔧 **[cURL to Code Converter — toolninja.io/tools/curl-to-code](https://toolninja.io/tools/curl-to-code)**

No login. No server. Your API keys and tokens never leave your browser.
