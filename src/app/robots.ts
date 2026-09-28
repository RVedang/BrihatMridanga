import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/portal", "/account", "/onboarding", "/auth", "/preview", "/api"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
