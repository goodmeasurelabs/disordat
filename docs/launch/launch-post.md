# Launch package (draft; Sean posts it himself)

Post only after the verdict loop is live (share card, votes, cite block,
llms.txt), so a traffic spike turns into shares and votes. Link the homepage,
not a deep page. Check each community's current rules on the day.

## 1. r/InternetIsBeautiful

**Title** (under 80 characters):

> A site that settles 'X vs Y' arguments with a verdict you can send to the group chat

**Link:** https://disordat.org

**First comment (from Sean):**

> I built this. It's free, no ads, no sign-up. Type the two sides of any
> argument and it picks a winner, gives the reasons, and dates the verdict.
> Every verdict gets its own page and a card that shows the winner when you
> paste it in iMessage/WhatsApp/Discord. You can agree or disagree with it.
> There are also ~150 pre-settled debates (Batman vs Superman, Messi vs Pelé,
> Popeyes vs KFC, Thailand vs Vietnam...). Tell me which verdicts are wrong.

## 2. Show HN

**Title:**

> Show HN: Disordat – dated, citable verdicts on "X vs Y" debates, built for agents

**Text:**

> disordat gives an opinionated, dated verdict on any "X vs Y" question: a
> winner, a head-to-head table, pros for each side and an FAQ.
>
> The part HN might find interesting is that every verdict is meant to be
> read by agents as well as people:
>
> - /llms.txt lists every verdict with its winner, one-line reason and
>   updated date.
> - Every page has a markdown twin: append .md to any /vs/ URL
>   (e.g. https://disordat.org/vs/batman-vs-superman.md), also linked with
>   rel="alternate" type="text/markdown".
> - Article + FAQPage JSON-LD with datePublished/dateModified, a visible
>   "verdict as of" date, and a "Cite this verdict" block (APA/MLA).
> - robots.txt explicitly allows GPTBot, ClaudeBot, PerplexityBot and
>   Google-Extended. The big comparison sites block them; we have no ads to
>   protect, so being quoted is the point.
>
> The ~150 hub debates were chosen from real US search volume and are
> refreshed every 90 days; user-made verdicts are generated on demand.
> No ads, no accounts. Feedback on the format (and on verdicts you think
> are wrong) is very welcome.

## 3. Five verdicts to drop in the comments if asked

Picked for strong share cards and arguments people want to have:

1. Batman vs Superman — Batman wins: https://disordat.org/vs/batman-vs-superman
2. Messi vs Pelé — Messi: https://disordat.org/vs/lionel-messi-vs-pele
3. KFC vs Popeyes — Popeyes: https://disordat.org/vs/kfc-vs-popeyes
4. Breaking Bad vs The Sopranos — The Sopranos, by a whisker: https://disordat.org/vs/breaking-bad-vs-the-sopranos
5. Gandalf vs Dumbledore — Gandalf: https://disordat.org/vs/dumbledore-vs-gandalf

## 4. Where self-promotion is allowed

Reddit returns empty rule lists to automated fetches, so this was **not
verified live**. It is from general knowledge; read the sidebar and pinned
posts before posting.

| Community | Creator posting own site? | Notes |
| --- | --- | --- |
| r/InternetIsBeautiful | Generally yes for free, no-sign-up sites | Has rules against spam, paywalls and sign-up walls; post once, disclose you built it. Diffen has been posted there at least three times. |
| r/SideProject | Yes, it's what the sub is for | Expect product feedback rather than traffic. |
| Show HN | Yes, by definition | Must be something people can try now; no sign-up wall. |
| r/webdev | Only in the weekly "Showoff Saturday" thread | Not on other days. |
| Sports/fandom subs (r/baseball, r/nfl, r/StarWars...) | Usually no | Treat as no. Only reply in threads already arguing the exact question, with the verdict as an answer, never a top-level post. |

## Measure it

Data Dive, 7 days after posting: referral sessions, `share_click`,
`verdict_vote` and `remix_start` events.
