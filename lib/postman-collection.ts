interface PostmanCollectionV21 {
  info: { name: string; schema: string };
  item: PostmanItem[];
}

interface PostmanItem {
  name: string;
  request: {
    method: string;
    header: { key: string; value: string }[];
    body?: { mode: string; raw?: string };
    url: { raw: string } | string;
  };
}

export interface ImportedRequest {
  name: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string;
}

export function importFromPostman(json: string): {
  requests: ImportedRequest[];
  error: string | null;
} {
  try {
    const collection: PostmanCollectionV21 = JSON.parse(json);
    if (!Array.isArray(collection.item)) {
      return { requests: [], error: "Not a valid Postman collection — missing 'item' array" };
    }
    const requests = collection.item.map((item) => ({
      name: item.name || "Request",
      method: item.request.method || "GET",
      url: typeof item.request.url === "string" ? item.request.url : item.request.url?.raw || "",
      headers: Object.fromEntries(
        (item.request.header || []).map((h) => [h.key, h.value])
      ),
      body: item.request.body?.raw || "",
    }));
    if (requests.length === 0) {
      return { requests: [], error: "Collection has no requests" };
    }
    return { requests, error: null };
  } catch {
    return { requests: [], error: "Invalid Postman collection JSON" };
  }
}

export function exportToPostman(
  name: string,
  method: string,
  url: string,
  headers: Record<string, string>,
  body: string
): string {
  const collection: PostmanCollectionV21 = {
    info: {
      name: name || "ToolNinja Export",
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    item: [
      {
        name: name || "Request",
        request: {
          method,
          header: Object.entries(headers).map(([key, value]) => ({ key, value })),
          body: body ? { mode: "raw", raw: body } : undefined,
          url: { raw: url },
        },
      },
    ],
  };
  return JSON.stringify(collection, null, 2);
}
