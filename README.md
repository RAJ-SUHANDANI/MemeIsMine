# Meme Is Mine.

### The internet gave you the template. Make the punchline yours.

**POV:** You had the perfect reaction, but the group chat already moved on.

Not anymore.

**Meme Is Mine** is a free, browser-based creative studio for turning familiar images, iconic reactions, GIFs, and video clips into something unmistakably yours. Discover the format. Rewrite the moment. Send the meme that makes everyone forget what the conversation was originally about.

**Your humor. Your edit. Your meme.**

[**Enter Meme Is Mine**](https://memeismine.vercel.app) · [Explore image templates](https://memeismine.vercel.app/explore) · [Find a video reaction](https://memeismine.vercel.app/video-templates)

---

## The group chat isn't going to carry itself.

Some ideas deserve more than a screenshot with text slapped on it.

Meme Is Mine brings the whole process into one place: a curated-feeling archive of recognizable formats, an expressive editor, and a personal workspace for the jokes worth keeping.

| THE FEATURE | THE PLOT |
| :--- | :--- |
| **Image templates** | From classic reaction formats to the face that says exactly what you're thinking. |
| **Video memes & GIFs** | Find a moving moment, preview it on repeat, and make it say something new. |
| **Image editor** | Add captions, adjust your composition, and export your finished image. |
| **Video editor** | Put your words over the clip, preview the result, and export in supported formats. |
| **Flow galleries** | Browse continuous, horizontally moving collections instead of digging through endless folders. |
| **Your Studio** | Return to saved drafts, bookmarks, and the formats you liked. |

Thoughtful interactions, responsive layouts, and enough personality to feel like a place to make things—not another form you have to fill in.

## No complicated lore. Just three moves.

**01 / FIND YOUR MOMENT.** Browse the image or video archive. Search for a reaction, explore the gallery, and discover the format that fits your exact situation.

**02 / MAKE IT PERSONAL.** Open a template in its editor, write the caption you *actually* wanted to send, and adjust the result until it lands.

**03 / DROP THE MEME.** Export the finished creation. Share it wherever your audience—or your most chaotic group chat—happens to be.

> The format is familiar. The punchline is the flex.

## Free to use. Seriously.

**Meme Is Mine is free.** Browse and preview templates without paying or creating an account.

When you're ready to create, sign up for a free account, verify your email with a six-digit code, and unlock the editors and Studio. No subscription is required to get started.

### Your drafts are yours to keep.

Drafts, bookmarks, collections, and personal uploads stay in **your browser on your device**. They don't automatically sync across devices, and clearing your browser's site data can erase them—so use Studio's manual backup option for anything you want to preserve.

Account authentication and template likes use managed backend services. Your meme captions are your creative choices: **the current studio doesn't write jokes for you with AI.**

## Built with care. And a little internet brain rot.

Behind the jokes is a modern web experience built with **Next.js, React, TypeScript, and Motion**. The image and video editors run in the browser; hosted authentication handles account verification and sign-in.

The details matter here: responsive controls, respectful motion preferences, keyboard-friendly browsing, and a workflow that gets out of the way when inspiration strikes.

### Development

This project uses Node.js 24.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

The local development server runs at `http://localhost:3000`.

For full account functionality, configure the server-side Appwrite environment settings described in `MEMBERSHIP-SETUP.md`. Keep API keys private; never use a `NEXT_PUBLIC_` prefix for server credentials.

```bash
npm run lint
npm run typecheck
npm run test:auth
npm run test:video
npm run build
```

Some video formats and exports depend on the browser and availability of the original media host. Please respect the rights attached to any image or clip you edit or share.

---

### The reaction was already iconic. Now it's personal.

**[MAKE IT YOURS →](https://memeismine.vercel.app)**

*Created with intent. Delivered with immaculate timing.*
