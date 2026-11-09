import type { MetadataRoute } from 'next';
export default function robots():MetadataRoute.Robots{return {rules:{userAgent:'*',allow:'/',disallow:['/api/','/studio','/account','/auth/','/create/','/video-editor/','/add-review']},sitemap:'https://memeismine.vercel.app/sitemap.xml'};}
