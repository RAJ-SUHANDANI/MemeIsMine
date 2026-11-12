<p align="center">
  <a href="https://memeismine.vercel.app">
    <img src=".github/readme/cover.svg" width="100%" alt="Meme Is Mine — Make some noise. A free meme studio for images, video reactions and the perfectly timed punchline." />
  </a>
</p>

<p align="center">
  <strong>THE FORMAT IS FAMILIAR. THE JOKE IS YOURS.</strong>
  <br />
  <sub>A free little corner of the internet for making extremely important nonsense.</sub>
</p>

<p align="center">
  <a href="https://memeismine.vercel.app"><strong>Open Meme Is Mine ↗</strong></a>
  &nbsp;&nbsp; / &nbsp;&nbsp;
  <a href="https://memeismine.vercel.app/explore">Image templates</a>
  &nbsp;&nbsp; / &nbsp;&nbsp;
  <a href="https://memeismine.vercel.app/video-templates">Video templates</a>
</p>

<br />

<sub>001 &nbsp;/&nbsp; THE IDEA</sub>

## You know the exact reaction. You just need to find it.

Someone drops the most questionable take in the group chat. You know *exactly* which face belongs in the reply. Now you're fifteen tabs deep, the moment has passed, and someone else has already sent "💀".

I wanted a better way.

**Meme Is Mine** is a free, browser-based meme studio for the space between *"I have a joke"* and *"sent."* It brings image templates, moving reactions, captions, and your saved work into one place. No complicated setup. No trying to convince an AI to understand your sense of humor.

Just find the moment and make it yours.

---

<sub>002 &nbsp;/&nbsp; THE GOOD STUFF</sub>

## Your next inside joke lives here.

<table>
  <tr>
    <td width="50%" valign="top">
      <sub>01 &nbsp;—&nbsp; THE IMAGE ARCHIVE</sub>
      <h3>Find the face.</h3>
      <p>Classic formats, oddly specific reactions, and the image that says what your paragraph never could.</p>
      <a href="https://memeismine.vercel.app/explore">Browse image templates ↗</a>
    </td>
    <td width="50%" valign="top">
      <sub>02 &nbsp;—&nbsp; THE MOTION DEPARTMENT</sub>
      <h3>Make it move.</h3>
      <p>Browse video reactions and GIFs, watch silent looping previews, then put your own words over the moment.</p>
      <a href="https://memeismine.vercel.app/video-templates">Browse video templates ↗</a>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <sub>03 &nbsp;—&nbsp; THE WORKSHOP</sub>
      <h3>Rewrite the scene.</h3>
      <p>Position captions, make a few creative decisions, and export an image or video meme. The joke stays yours.</p>
      <a href="https://memeismine.vercel.app/create/upload">Use your own image ↗</a>
    </td>
    <td width="50%" valign="top">
      <sub>04 &nbsp;—&nbsp; YOUR STUDIO</sub>
      <h3>Keep the good ones.</h3>
      <p>Save drafts, bookmark formats, and revisit the memes you liked. For when the joke is too good to lose.</p>
      <a href="https://memeismine.vercel.app/studio">Go to Studio ↗</a>
    </td>
  </tr>
</table>

<br />

<sub>FIG. 01 &nbsp;/&nbsp; INSIDE THE WORKSHOP</sub>

<p align="center">
  <img src="public/editor-preview.jpg" width="100%" alt="A look inside the Meme Is Mine meme editing workspace" />
</p>

<sub>003 &nbsp;/&nbsp; THE PROCESS</sub>

## Find it. Caption it. Send it.

**01 — Pick your format.** A familiar image, a reaction clip, or something from your own camera roll.

**02 — Make the joke.** Change the caption, adjust the composition, and preview the result. No auto-generated punchline pretending to be funny.

**03 — Drop it in the chat.** Download your finished meme. Let the replies do the rest.

> **This is not a joke generator.** It's a good place to make your own.

---

<sub>004 &nbsp;/&nbsp; THE BORING QUESTION, ANSWERED</sub>

## Yes, it's free.

Browse images and preview videos without an account. Want to edit, save drafts, and like templates? Create a **free account**, verify your email, and you're in. No subscription required.

Your drafts, bookmarks, and uploads are kept in the browser on your device. They **don't automatically sync between devices**; clearing site data can remove them. Studio includes a manual backup option.

Some clips live on external sites, so availability and video exports can depend on the source file and your browser. Please use media you have the right to edit or share.

<details>
  <summary><strong>For the curious: what's under the hood?</strong></summary>

  <br />

  Meme Is Mine runs on **Next.js, React, TypeScript, and Motion**, with browser-based image/video editing and **Appwrite** handling accounts and template likes.

  The development environment expects **Node.js 24**.

  ~~~bash
  npm ci
  cp .env.example .env.local
  npm run dev
  ~~~

  Set up your own server-side Appwrite credentials in \` .env.local \` using the guidance in [MEMBERSHIP-SETUP.md](MEMBERSHIP-SETUP.md). Never put private API keys in client-side variables or commits.

  ~~~bash
  npm run lint
  npm run typecheck
  npm run test:auth
  npm run test:video
  npm run build
  ~~~

</details>

<br />

---

<p align="center">
  <sub>AN INDEPENDENT LITTLE EXPERIMENT IN INTERNET CULTURE</sub>
  <br /><br />
  <strong>Good memes travel. Great timing makes them land.</strong>
  <br />
  <sub>Made by Raj Suhandani.</sub>
  <br /><br />
  <a href="https://memeismine.vercel.app"><strong>MAKE SOME NOISE ↗</strong></a>
</p>
