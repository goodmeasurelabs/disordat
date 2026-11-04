# Timed matchups: the weekly routine (~1 hour)

A timed matchup is a dated verdict published before a moment people argue
about: an awards night, a rivalry game, a launch, a holiday. Diffen earns
traffic from event searches ("clippers vs lakers", 246k/mo) even from
position 11; disordat can take a side the day before.

## How it works

- `src/data/matchups.json` is the calendar. Each row has `slug` (a curated
  verdict in `src/data/debates/`), `event`, `event_date` (YYYY-MM-DD),
  `date_confidence` (`fixed`, `scheduled`, `approximate`, `seasonal`), an
  optional `note`, and an optional `fan_site` link (UTM-tagged).
- The homepage **This week** slot shows matchups whose date is 0-7 days away
  (or was yesterday); with none, it shows the next one. It also appears at the
  top of `/llms.txt` and on `/matchups`.
- The verdict page shows a "Timed matchup" banner with the event and date.
- The weekly **Content freshness** workflow opens an issue when the calendar
  has under 14 days of runway or a verdict is older than 90 days.

## Each week

1. Look 2-3 weeks ahead: games, awards, launches, finales, holidays.
2. Write the verdict into the right hub file in `src/data/debates/` (same
   shape as the others; `as_of` = today). Take a side; no claims about results
   that haven't happened. Check the slug with `buildComparisonSlug`.
3. Add the calendar row in `src/data/matchups.json`. Mark the date
   `approximate` until it is confirmed.
4. `npm test` (checks every matchup points at a verdict), open a PR.
5. Post the drafts below yourself (nothing here posts automatically).

## First batch (Nov-Dec 2026)

Dates marked approximate need confirming before posting.

| Date | Event | Verdict | Winner |
| --- | --- | --- | --- |
| ~Nov 11 | MLB Cy Young week | [Paul Skenes vs Tarik Skubal](https://disordat.org/vs/paul-skenes-vs-tarik-skubal) | Skubal |
| ~Nov 12 | MLB MVP week | [Aaron Judge vs Juan Soto](https://disordat.org/vs/aaron-judge-vs-juan-soto) | Judge |
| Nov 19 | GTA 6 launch (scheduled) | [GTA 6 vs Red Dead Redemption 2](https://disordat.org/vs/gta-6-vs-red-dead-redemption-2) | RDR2, re-judge after launch |
| Nov 26 | Thanksgiving | [Ham vs Turkey](https://disordat.org/vs/ham-vs-turkey) | Turkey |
| Nov 26 | Thanksgiving | [Apple pie vs Pumpkin pie](https://disordat.org/vs/apple-pie-vs-pumpkin-pie) | Pumpkin pie |
| Nov 27 | Black Friday console deals | [PlayStation vs Xbox](https://disordat.org/vs/playstation-vs-xbox) | PlayStation |
| ~Nov 28 | The Game | [Michigan vs Ohio State](https://disordat.org/vs/michigan-vs-ohio-state) | Michigan (all-time) |
| ~Dec 12 | Army-Navy Game | [Army vs Navy](https://disordat.org/vs/army-vs-navy) | Navy (all-time) |
| Dec 19 | Christmas movie night | [Elf vs Home Alone](https://disordat.org/vs/elf-vs-home-alone) | Home Alone |

## Social drafts (Sean posts; nothing is posted automatically)

Each has one X post and one Reddit-style comment. Reddit comments only where
the thread is already arguing the question; never drop links unprompted.

**Skenes vs Skubal**
- X: Settled it: Tarik Skubal is the better pitcher, for now. Two Cy Youngs beat one, but Skenes is closing fast. Disagree? https://disordat.org/vs/paul-skenes-vs-tarik-skubal
- Reddit: Hot take for awards week: Skubal over Skenes, but only on track record. Skenes's peak might already be higher. Wrote up the head-to-head here if you want to argue with it: https://disordat.org/vs/paul-skenes-vs-tarik-skubal

**Judge vs Soto**
- X: Settled it: Aaron Judge over Juan Soto. Soto has the best eye in baseball; Judge's MVP seasons hit a ceiling nobody else reaches. Disagree? https://disordat.org/vs/aaron-judge-vs-juan-soto
- Reddit: Soto's plate discipline is absurd, but I still take Judge's peak. Full breakdown (power, OBP, defense, durability): https://disordat.org/vs/aaron-judge-vs-juan-soto

**GTA 6 vs RDR2**
- X: Settled it (for now): Red Dead Redemption 2 beats GTA 6 until GTA 6 actually ships. Re-judging after launch. Disagree? https://disordat.org/vs/gta-6-vs-red-dead-redemption-2
- Reddit: Until reviews are in, RDR2 is the proven one. Dated verdict here; it gets re-done after launch week: https://disordat.org/vs/gta-6-vs-red-dead-redemption-2

**Ham vs Turkey / Apple pie vs Pumpkin pie**
- X: Thanksgiving, settled: turkey over ham, pumpkin over apple. Fight about it at dinner. https://disordat.org/vs/ham-vs-turkey · https://disordat.org/vs/apple-pie-vs-pumpkin-pie
- Reddit: Ham is easier, but turkey is the whole point of the day (and the leftovers). Reasons here: https://disordat.org/vs/ham-vs-turkey

**PlayStation vs Xbox**
- X: Black Friday, settled: PlayStation. The exclusives are still the reason to own a console, and Xbox ships many of its big games there now. Disagree? https://disordat.org/vs/playstation-vs-xbox
- Reddit: If you're buying one console this week: PlayStation, unless Game Pass is the whole point for you. Breakdown: https://disordat.org/vs/playstation-vs-xbox

**Michigan vs Ohio State**
- X: Settled it: Michigan is the better program all-time. Winningest in college football, leads the series. Saturday is a different question. https://disordat.org/vs/michigan-vs-ohio-state
- Reddit: All-time, not this weekend: Michigan. Winningest program and the series lead. Head-to-head: https://disordat.org/vs/michigan-vs-ohio-state

**Army vs Navy**
- X: Settled it: Navy, narrowly, on the all-time series. Army has the bigger national-title history. https://disordat.org/vs/army-vs-navy
- Reddit: Navy by a nose all-time, Army if you weight the 1940s titles. Both sides here: https://disordat.org/vs/army-vs-navy

**Elf vs Home Alone**
- X: Christmas movie night, settled: Home Alone over Elf. Booby traps, the John Williams score, and heart. Disagree? https://disordat.org/vs/elf-vs-home-alone
- Reddit: Elf is a joy, but Home Alone is the classic. Full verdict: https://disordat.org/vs/elf-vs-home-alone

## Cross-links from the fan sites (suggestion, not done here)

The Paul Skenes (paulskenes.com) and Aaron Judge (aaronjudge.net) sites
already reach the fans who will argue with these verdicts. Suggested, in those
repos, not this one:

- On the matching player page, a small "Who's better: Skenes or Skubal? See
  the verdict →" link to
  `https://disordat.org/vs/paul-skenes-vs-tarik-skubal?utm_source=paulskenes&utm_medium=referral&utm_campaign=matchup`
  (and the same for Judge vs Soto with `utm_source=aaronjudge`).
- disordat already links back from those verdict pages to the fan site,
  tagged `utm_source=disordat`.
