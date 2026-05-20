import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ToolNinja",
    short_name: "ToolNinja",
    description: "Fast, free browser-only developer tools",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#a855f7",
    icons: [
      { src: "/favicon-48.png", sizes: "48x48", type: "image/png" },
      { src: "/favicon-192.png", sizes: "192x192", type: "image/png" },
    ],
  };
}
