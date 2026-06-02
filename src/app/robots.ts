import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/auth/", "/api/", "/og/"],
      },
    ],
    sitemap: "https://claude2master.com/sitemap.xml",
    host: "https://claude2master.com",
  };
}
