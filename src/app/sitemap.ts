import type { MetadataRoute } from "next";
import { publicData } from "@/lib/data";
import { siteUrl } from "@/lib/site";

export const revalidate = 3600;

const sections = [
  "",
  "/dashboard",
  "/temples",
  "/campaigns",
  "/stories",
  "/resources",
  "/events",
  "/reports",
  "/about",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const data = await publicData().catch(() => null);
  return [
    ...sections.map((path) => ({ url: `${base}${path}` })),
    ...(data?.temples || []).map((t) => ({ url: `${base}/temples/${t.id}` })),
    ...(data?.campaigns || [])
      .filter((c) => !c.fallback_year)
      .map((c) => ({ url: `${base}/campaigns/${c.id}` })),
  ];
}
