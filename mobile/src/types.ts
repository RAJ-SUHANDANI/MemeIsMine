export type MemeTemplate = {
  id: string;
  name: string;
  url: string;
  width: number;
  height: number;
  box_count?: number;
  category?: string;
  description?: string;
  popularity?: number;
  trending?: boolean;
  publishedAt?: string | null;
  source?: string;
};
export type VideoTemplate = {
  id: string;
  name: string;
  url: string;
  posterUrl?: string;
  width?: number;
  height?: number;
  category?: string;
  mediaType: "gif" | "video";
  publishedAt?: string | null;
  trending?: boolean;
  popularity?: number;
  sourcePage?: string;
};
export type Draft = {
  id: string;
  name: string;
  templateId: string;
  imageUrl: string;
  topText: string;
  bottomText: string;
  updatedAt: string;
};
