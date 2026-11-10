import type { Metadata } from "next";
export const metadata:Metadata={
  title:"About Meme Is Mine — A Creative Meme Studio",
  description:"Learn what Meme Is Mine does, how the browser-based meme maker works, and the principles behind its playful design.",
  alternates:{canonical:"/about"},
  openGraph:{title:"About Meme Is Mine — A Creative Meme Studio",description:"Learn what Meme Is Mine does, how the browser-based meme maker works, and the principles behind its playful design.",url:"/about"},
};
export default function PageLayout({children}:{children:React.ReactNode}){return children;}
