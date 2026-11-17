import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ji.africa - Nigeria's Fast Classifieds",
    short_name: "ji.africa",
    description: "Buy & Sell Clean Items Safely in Nigeria with JI Trust Escrow",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#C2410C",
    icons: [
      {
        src: "/icon?v=3",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon?v=3",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
