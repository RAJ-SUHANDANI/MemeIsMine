import type { MetadataRoute } from "next";
import { siteAbsolute } from "@/lib/site-seo";
const publicRoutes=[
  {path:"/",priority:1},
  {path:"/explore",priority:.9},
  {path:"/video-templates",priority:.9},
  {path:"/how-it-works",priority:.8},
  {path:"/faq",priority:.8},
  {path:"/about",priority:.5},
  {path:"/contact",priority:.4},
  {path:"/privacy",priority:.3},
];
export default function sitemap():MetadataRoute.Sitemap{
  return publicRoutes.map(item=>({
    url:siteAbsolute(item.path),
    changeFrequency:item.priority>=.9?"daily" as const:"monthly" as const,
    priority:item.priority,
  }));
}
