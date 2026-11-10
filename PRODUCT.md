# Meme Is Mine — Product Truth (redesign branch)

An independent, free browser meme studio created by Raj Suhandani. Visitors can browse still image templates and video/GIF templates, preview formats, like templates with an account, upload local images, customize memes in the existing editors, and export images/video as browser support permits.

Browsing and previews require no account. Editing, saved Studio and template reactions require a free Appwrite-hosted email/password account with email verification. The public UI never invents popularity totals, community ratings, endorsements or usage claims. Reaction counts come from the backend when available and degrade honestly if unavailable.

On the current browser, drafts, bookmarks, named collections and feedback notes use local storage. They do not sync across devices. The redesigned Studio allows JSON backup/restore under user control. Liked template keys are account-connected through a private Appwrite DocumentsDB collection created by `npm run setup:appwrite`. Browser video export, source-host availability and network reliability vary; surface actionable errors instead of inventing successes.

Marketing surfaces: home, about and how-it-works. Task surfaces: explore, templates, video-templates, image editor, video editor, studio. Forms/help: login, signup, account, account recovery/password, FAQ, privacy, contact and local feedback notes.

**Editor scope exclusion:** The existing image/video editing component source, export logic and persisted draft format must not be rewritten for the redesign. The redesigned shell keeps legacy header behavior on editor routes. `main` must remain unchanged.

Read `REDESIGN.md`, `MEMBERSHIP-SETUP.md`, `README.md` and `QA.md` for implementation, backend and verification details.
