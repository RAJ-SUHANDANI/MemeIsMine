export type MemeTemplate = {
  id: string; name: string; url: string; width: number; height: number; box_count: number; category: string; description: string; source?: string; originalUrl?: string; publishedAt?: string | null; trending?: boolean; popularity?: number;
};
export const starterMemes: MemeTemplate[] = [
  { id: "181913649", name: "Drake Hotline Bling", url: "https://i.imgflip.com/30b1gx.jpg", width: 1200, height: 1200, box_count: 2, category: "Classics", description: "Two choices. One obvious winner." },
  { id: "87743020", name: "Two Buttons", url: "https://i.imgflip.com/1g8my4.jpg", width: 600, height: 908, box_count: 3, category: "Relatable", description: "When both options are terrible." },
  { id: "93895088", name: "Expanding Brain", url: "https://i.imgflip.com/1jwhww.jpg", width: 857, height: 1202, box_count: 4, category: "Absurd", description: "The evolution of a thought." },
  { id: "112126428", name: "Distracted Boyfriend", url: "https://i.imgflip.com/1ur9b0.jpg", width: 1200, height: 800, box_count: 3, category: "Classics", description: "A classic case of bad priorities." },
  { id: "188390779", name: "Woman Yelling at Cat", url: "https://i.imgflip.com/345v97.jpg", width: 680, height: 384, box_count: 2, category: "Reaction", description: "An argument that writes itself." },
  { id: "102156234", name: "Mocking SpongeBob", url: "https://i.imgflip.com/1otk96.jpg", width: 1200, height: 675, box_count: 2, category: "Reaction", description: "For repeating a take with extra seasoning." },
  { id: "129242436", name: "Change My Mind", url: "https://i.imgflip.com/24y43o.jpg", width: 482, height: 361, box_count: 2, category: "Classics", description: "A hot take. A folding table. Your move." },
  { id: "217743513", name: "UNO Draw 25", url: "https://i.imgflip.com/3lmzyx.jpg", width: 500, height: 494, box_count: 2, category: "Relatable", description: "The consequences are worth it." },
  { id: "101470", name: "Ancient Aliens", url: "https://i.imgflip.com/26am.jpg", width: 500, height: 437, box_count: 2, category: "Absurd", description: "When the explanation gets out of hand." },
  { id: "61544", name: "Success Kid", url: "https://i.imgflip.com/1bhk.jpg", width: 500, height: 500, box_count: 2, category: "Reaction", description: "A tiny win deserves a big celebration." },
  { id: "8072285", name: "Doge", url: "https://i.imgflip.com/4t0m5.jpg", width: 620, height: 620, box_count: 2, category: "Animals", description: "Such wow. Much internet." },
  { id: "100777631", name: "Hide the Pain Harold", url: "https://i.imgflip.com/2wifvo.jpg", width: 480, height: 601, box_count: 2, category: "Reaction", description: "Smiling through the loading screen." },
  { id: "131087935", name: "Gru's Plan", url: "https://i.imgflip.com/26jxvz.jpg", width: 700, height: 700, box_count: 4, category: "Relatable", description: "A plan with one small flaw." },
  { id: "124822590", name: "Left Exit 12 Off Ramp", url: "https://i.imgflip.com/22bdq6.jpg", width: 804, height: 767, box_count: 3, category: "Relatable", description: "Choosing chaos at the last second." },
  { id: "97984", name: "Disaster Girl", url: "https://i.imgflip.com/23ls.jpg", width: 500, height: 375, box_count: 2, category: "Classics", description: "Suspiciously calm in the middle of it all." },
  { id: "135256802", name: "Epic Handshake", url: "https://i.imgflip.com/2zo1ki.jpg", width: 900, height: 600, box_count: 3, category: "Classics", description: "Two worlds. One shared struggle." },
  { id: "188783785", name: "Trade Offer", url: "https://i.imgflip.com/3lmzyx.jpg", width: 600, height: 600, box_count: 3, category: "Relatable", description: "You receive a questionable deal." },
  { id: "161865971", name: "Running Away Balloon", url: "https://i.imgflip.com/2kbn1e.jpg", width: 761, height: 1024, box_count: 2, category: "Absurd", description: "Avoiding the one thing you need to do." }
];
export function categoryFor(name: string): string {
  const lower = name.toLowerCase();
  if (/cat|doge|dog|bird|animal|pigeon/.test(lower)) return "Animals";
  if (/brain|aliens|surprised|stonks|gru|plan|button|chaos/.test(lower)) return "Absurd";
  if (/woman|harold|spongebob|success|reaction|cry|confused/.test(lower)) return "Reaction";
  if (/drake|boyfriend|change my mind|handshake|disaster/.test(lower)) return "Classics";
  if (/work|office|meeting|computer|coding/.test(lower)) return "Work";
  return "Relatable";
}
