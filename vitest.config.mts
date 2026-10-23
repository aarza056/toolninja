import { defineConfig } from "vitest/config";
import { fileURLToPath } from "url";

// Unit tests for the pure logic in lib/. Node environment: the modules under test use Web Crypto
// and TextEncoder, which Node provides natively.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
