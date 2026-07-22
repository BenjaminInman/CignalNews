import { SITE } from "../lib/site";
export default function sitemap() {
  return [{ url: SITE.url, lastModified: new Date(), changeFrequency: "hourly", priority: 1 }];
}
