import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "KukuDhamini",
    short_name: "KukuDhamini",
    description: "Poultry management and chicken farming application",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    theme_color: "#176b3b",
    background_color: "#ffffff",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: "/screenshots/desktop-dashboard.png",
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide",
      },
      {
        src: "/screenshots/mobile-dashboard.png",
        sizes: "390x844",
        type: "image/png",
      },
    ],
  };
}
