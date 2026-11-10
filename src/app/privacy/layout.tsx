import type { Metadata } from "next";
export const metadata:Metadata={
  title:"Privacy — Account Data and Browser-Local Drafts",
  description:"How Meme Is Mine handles account email verification, password hashes, template likes, local image uploads and browser-saved drafts.",
  alternates:{canonical:"/privacy"},
  openGraph:{title:"Privacy — Account Data and Browser-Local Drafts",description:"How Meme Is Mine handles account email verification, password hashes, template likes, local image uploads and browser-saved drafts.",url:"/privacy"},
};
export default function PageLayout({children}:{children:React.ReactNode}){return children;}
