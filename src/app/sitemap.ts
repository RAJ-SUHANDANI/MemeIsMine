import type { MetadataRoute } from 'next';
export default function sitemap():MetadataRoute.Sitemap{return ['','/explore','/templates','/video-templates','/about','/how-it-works','/faq','/contact','/privacy'].map(path=>({url:'https://memeismine.vercel.app'+path}));}
