import type { MetadataRoute } from "next";
import { siteAbsolute } from "@/lib/site-seo";
export default function robots():MetadataRoute.Robots{
  return {
    rules:[{
      userAgent:"*",
      allow:"/",
      disallow:[
        "/api/","/studio","/account","/auth/","/create/","/video-editor/",
        "/add-review",
      ],
    }],
    sitemap:siteAbsolute("/sitemap.xml"),
  };
}
