# Search, answer and generative-engine visibility plan

The site is built to be indexable, helpful and technically well-formed. **No placement, ranking, citation or rich-result inclusion is guaranteed**.

## Implemented technical foundation

- Unique title/description/OpenGraph metadata and canonical URLs for Home, Image Templates, Video Templates, How It Works, FAQ and supporting pages.
- Metadata centralizes `NEXT_PUBLIC_SITE_URL` for consistent HTTPS canonical URLs, sitemap and robots directives. Set it to the **actual public production domain** before deploying; the default is the legacy hosting origin.
- Public Home and image/video catalog pages contain 24 actual templates in server-rendered HTML; the gallery remains a smooth client-enhanced Flow experience.
- Functional `sitemap.xml` contains canonical public routes. `robots.txt` permits public pages but excludes private editor, account, API and Studio paths.
- Private account/signup/login/recovery pages use noindex metadata.
- Safe JSON-LD describes the WebSite and actual WebApplication features. FAQ structured data matches questions and answers visibly provided on the page.
- The FAQ uses native details so all answers remain in the initial HTML; no hidden client-only answers.
- Simple internal links connect public browsing, instructions, FAQ and the two canonical template galleries.
- Public website surfaces contain no source-code or portfolio links. Rights and privacy notices remain accurate.

## Improve relevance without artificial content

1. Write distinctive, practical examples for image memes, caption layouts, video meme export formats, and errors users encounter. Show meaningful screenshots and actual outcomes.
2. Enrich each gallery with meaningful descriptive language and categories. Avoid mechanically generating thin pages for every template.
3. Measure Core Web Vitals on real desktop and mobile, particularly LCP (poster/image load), INP (interaction responsiveness), and CLS (stable layout).
4. Add original help/tutorial content based on actual user questions and editor capabilities. Answer each question in a concise opening paragraph before the detailed explanation.
5. Never invent aggregate ratings, fake reviews, user counts, author credentials, or external citations. Publish only verified evidence and attribution that is legally required.
6. Configure a verified search console property for the final domain, submit the sitemap and inspect crawl/indexing issues. Track query and page impressions and review monthly.
7. Check structured data with a rich-results validator and compare HTML with rendered DOM in a live deployed browser.
8. Verify that media rights and source licensing allow the intended previews and distribution. Absence of a visible source link is not a grant of rights.

## Launch prerequisites

- The final domain must respond with HTTPS, matching canonical and sitemap URLs.
- Verify indexable responses are HTTP 200 and do not redirect unexpectedly.
- Private routes should not appear in search results.
- Do not block responsible crawlers from public pages or use AI-specific spam techniques.
- Account email delivery and media proxies need real production testing after the move to a persistent Node host.

Search visibility increases through useful and discoverable pages, not through a trick schema or AI text file.
