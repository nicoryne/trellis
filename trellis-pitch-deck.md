# Trellis · Pitch Deck Scaffold

**Type:** Slide-by-slide outline + spoken script scaffold for the live pitch
**Companion to:** [`trellis-demo-super-narrative.md`](trellis-demo-super-narrative.md) (5-min live demo runs inside this pitch)
**Structure:** `pitch-deck (pre-demo) → live demo → pitch-deck (post-demo close)`
**Target total runtime:** 8–10 minutes (2:30–3:00 pre-demo + 4:30–5:00 demo + 1:30–2:00 close)
**Tone:** Match the demo narrative — professional, direct, peer-to-peer. No marketing fluff. No exclamation points. State facts.

---

## How to Use This Document

This is a **scaffold**, not a script. It defines:
- The slide list and order
- What each slide must accomplish
- The visual treatment (one suggestion per slide; the actual designer can iterate)
- Rehearsal-grade spoken-script slots — many are intentionally left as `[TODO: Sarah inserts the number she wants to lead with here]` so the presenter and copy author can fill in the final wording

**Notation:**
- **Bold text** = words spoken aloud, verbatim or near-verbatim
- *Italic text* = stage direction, what's on screen, what the presenter is doing
- `[brackets]` = timing marks, contingency triggers, or fill-in slots
- **[MVP]** vs **[V1]** tags mark which features ship at the hackathon versus which are part of the broader product vision

**MVP framing throughout:** the deck presents the **full product vision**. Wherever a feature is V1, the slide explicitly marks it — usually with "**For our hackathon MVP, we ship X today; Y is V1 architecture, already specified.**" This is what lets the deck land big ambitions without overclaiming what's running in the demo.

**Slide budgets are guidance, not rules.** A great slide held for 40 seconds beats a flat slide rushed in 20.

---

## Slide Map

| # | Title | Block | Budget |
|---|---|---|---|
| 1 | Title | Pre-demo | 0:15 |
| 2 | The Problem | Pre-demo | 0:35 |
| 3 | The Problem · By the Numbers | Pre-demo | 0:30 |
| 4 | The Solution · Trellis | Pre-demo | 0:30 |
| 5 | What Trellis Does | Pre-demo | 0:30 |
| 6 | Built on Gemini | Pre-demo | 0:20 |
| 7 | Transition Into Demo | Pre-demo | 0:15 |
| — | **LIVE DEMO** | Demo | 4:30–5:00 |
| 8 | Why Trellis Matters | Post-demo | 0:45 |
| 9 | The Team | Post-demo | 0:30 |
| 10 | Close | Post-demo | 0:15 |

Total: **~8:55–9:25**

---

# PRE-DEMO BLOCK

## Slide 1 · Title `[0:00–0:15]`

**Objective:** Set the visual register. Establish that this is a premium, considered product — not a hackathon toy.

**Visual:**
- Centered Trellis logo (the `/trellis-logo.png` asset)
- Wordmark: **Trellis**
- One-line subtitle: *"The Knowledge Fabric for Law Firms"*
- Dark background, accent orange (`#fb8500`) accent only on the logo glow — match the LoginView aesthetic
- Small footer: presenter name + AI & Big Data Expo · Track 4

**Spoken script:**

**"Good morning. I'm [name], and this is Trellis — the knowledge fabric for law firms."**

*Pause one beat. Advance.*

**Transition cue:** No fade — direct cut to Slide 2. The pause does the work.

---

## Slide 2 · The Problem `[0:15–0:50]`

**Objective:** Land the hook. By the end of this slide, every judge in the room understands that **legal is the one industry AI has not actually broken into yet** — and that there's a structural reason why.

**Visual:**
- Big text, left-aligned, generous whitespace
- Headline: **"AI is being leveraged by every other industry today."**
- Beat — second line fades in: **"Except law."**
- No charts on this slide. The two lines do the work.
- Optional: faded gray logos in a strip at the bottom — OpenAI / Anthropic / GitHub Copilot / Notion AI / Figma AI — communicating the "everywhere else" point without overclaiming

**Spoken script:**

*The headline is on screen. Pause two beats.*

**"AI is being leveraged by every other industry today. Engineering, finance, medicine, design, customer service — every knowledge-work field has had its AI moment."**

*Second line fades in.*

**"Except law."**

*One beat. Look at the audience.*

**"Not because lawyers don't want AI. They do. Not because the technology isn't ready — it is. The reason is structural: attorney-client privilege is a legal obligation, not a preference. Lawyers cannot paste case facts into ChatGPT. Most major firms have banned public AI tools for client work outright. And the legal AI tools that *are* allowed — Harvey, CoCounsel, Spellbook — only know generic legal knowledge, not what your particular firm has actually learned."**

*Pause.*

**"The smartest people in the building end up choosing between paralysis and shadow IT. And the firm keeps bleeding wisdom either way."**

**Transition cue:** *"Here's what that looks like in numbers."* → Slide 3.

---

## Slide 3 · The Problem · By the Numbers `[0:50–1:20]`

**Objective:** Make the cost concrete. The "AI everywhere except law" line is interesting; the dollar figure is what makes a judge lean forward. **`[TODO: Keith fills in actual research numbers]`**

**Visual:**
- Three-column layout, each column one big number with a one-line caption underneath
- All numbers in accent orange `#fb8500`, oversized typography
- Suggested slots (replace with researched values):
  - **Column 1:** `[TODO: $XX–$XXM]` — *Lost annually per mid-to-large firm to wisdom evaporation when senior people retire or leave*
  - **Column 2:** `[TODO: XX%]` — *Of major firms have banned public AI tools for client work*
  - **Column 3:** `[TODO: $XB]` — *Legal AI market size by 202X, but firm-specific knowledge remains unsolved*
- Bottom of slide, smaller: source citations — *(e.g., Thomson Reuters Legal AI Report 202X)*

**Spoken script:**

**"The cost is real, and it's measurable."**

*Gesture to first number.*

**"A typical mid-to-large firm loses an estimated `[TODO: $X to $Y million]` a year to that quiet evaporation — institutional intelligence walking out the door when senior people retire."**

*Gesture to second.*

**"`[TODO: X%]` of major firms have banned public AI tools for client work outright. So when a lawyer wants AI help, they have to go around the firm — which is shadow IT, and shadow IT in a privileged context is a malpractice risk."**

*Gesture to third.*

**"The legal AI market is projected at `[TODO: $X billion]` by `[TODO: year]`. But every dollar of that is being chased by tools that know everything *except* what the firm itself has learned. That's the gap."**

**Transition cue:** *"This is what Trellis exists to fix."* → Slide 4.

---

## Slide 4 · The Solution · Trellis `[1:20–1:50]`

**Objective:** Reveal Trellis as the missing layer. One sentence, one diagram. Don't over-explain — the demo will do the work.

**Visual:**
- Centered headline: **"The missing layer between every lawyer and every AI tool."**
- Below it, a simple two-layer diagram:
  - **Top layer:** "Personal Brain" — private, on-device, per-lawyer
  - **Bottom layer:** "Team Brain" — sanitized, firm-managed, queryable
  - Arrow between them labeled *"Publish (with AI-assisted redaction)"*
- Off to the right, faded: external AI tools (Harvey, CoCounsel, Copilot) plugged into the team brain via an MCP arrow — tagged **`[V1]`**
- Background dark; accent orange used sparingly on the layer borders

**Spoken script:**

**"Trellis is the missing layer between every lawyer and every AI tool — and it works two ways at once."**

*Gesture to top layer.*

**"For the individual lawyer, it's a private second brain that captures their thinking as fluidly as they have it. Nothing leaves their device unsanitized."**

*Gesture to bottom layer.*

**"For the firm, it's a team-managed, queryable knowledge graph of every insight the team has chosen to share — with the privileged content stripped out before anything reaches a cloud model."**

*Brief gesture to the V1 strip on the right.*

**"And eventually, every other AI tool the firm uses plugs into this. The firm's accumulated knowledge becomes infrastructure."**

**Transition cue:** *"Here's how that breaks down."* → Slide 5.

---

## Slide 5 · What Trellis Does `[1:50–2:20]`

**Objective:** A scannable feature menu — what's in the box. This is where MVP vs V1 gets explicit. The judge should leave this slide knowing exactly what they're about to see in the demo versus what's roadmap.

**Visual:**
- Three columns, one per pillar. Each column has a header, two-three bullets, and an `[MVP]` or `[V1]` tag per bullet.
- Columns:

  **1. Capture** — *Personal Brain*
  - Voice, image, and text capture **[MVP]**
  - AI auto-organization (entities, classification, privilege) **[MVP]**
  - Personal knowledge graph (Obsidian-style) **[MVP]**
  - On-device LLM extraction **[V1]**

  **2. Publish & Govern** — *Privilege boundary*
  - Two-pass redaction (PII + generalization) **[MVP]**
  - Side-by-side diff with preservation score **[MVP]**
  - Knowledge Admin approval workflow **[V1]**
  - Ethical-wall enforcement **[V1+]**

  **3. Query** — *Team Brain*
  - Chat with the firm's accumulated knowledge **[MVP]**
  - Cited, grounded answers with refusal-when-uncertain **[MVP]**
  - Multi-turn conversation memory **[MVP]**
  - MCP endpoint for external AI tools (Harvey, CoCounsel, Copilot) **[V1]**

**Spoken script:**

**"Trellis ships in three pillars."**

*Gesture to column 1.*

**"Capture is the personal brain. Voice, image, and text — captured in seconds, organized by AI into a private knowledge graph that only the lawyer can see."**

*Column 2.*

**"Publish and Govern is the privilege boundary. When a lawyer decides an observation is worth sharing, an AI pipeline strips out client identifiers and generalizes the specifics. They see exactly what's being shared, side by side with the original, before it goes anywhere."**

*Column 3.*

**"Query is the team brain — chat with the firm's accumulated knowledge, grounded in only what the firm has actually published. Every claim is cited. If the firm hasn't learned the answer yet, the system says so plainly, rather than guessing."**

*Brief beat.*

**"For our hackathon MVP, we ship everything tagged `[MVP]` today, working end-to-end on a live deployment. The `[V1]` items — on-device LLM, admin workflows, the MCP endpoint — are architecturally specified and roadmap-staged."**

**Transition cue:** *"Built on a single API surface that we'll talk about briefly."* → Slide 6.

---

## Slide 6 · Built on Gemini `[2:20–2:40]`

**Objective:** Cover the tech stack in 20 seconds. The point isn't to flex the stack — it's to (a) qualify for the Gemini Award and (b) communicate "we made disciplined choices, not kitchen-sink architecture."

**Visual:**
- Logo strip across the middle: **Gemini** (prominent center), then in a smaller secondary row: pgvector + Postgres, React + Vite, Cytoscape.js, Microsoft Presidio
- One-line caption under Gemini: *"Six pipelines, one API key — extraction, transcription, OCR, redaction, embedding, synthesis"*
- One-line caption under the secondary row: *"Open infrastructure under the AI"*

**Spoken script:**

**"Under the hood, Trellis runs on Gemini end-to-end. Six AI pipelines — entity extraction, audio transcription, image OCR, redaction, embedding, and retrieval-augmented synthesis — all on a single API key."**

*Brief gesture to the secondary row.*

**"The infrastructure is conventional and open: Postgres with pgvector for the team brain, IndexedDB on-device for personal notes, Microsoft Presidio for first-pass PII detection, React and Cytoscape for the interface. No exotic dependencies."**

**Transition cue:** *"Let me show you what this looks like in practice."* → Slide 7 (one beat, then directly into demo).

---

## Slide 7 · Transition Into Demo `[2:40–2:55]`

**Objective:** Hand off cleanly from deck to live demo. The audience should know what to look for before the demo starts — not the punchline, but the frame.

**Visual:**
- Full-bleed dark slide
- One line of text, large: **"Meet Sarah Chen."**
- One line below, smaller: *"Senior associate, Acme Litigation Partners. Just returned from sabbatical."*
- Optionally: a small avatar / silhouette — but keep it minimal; the demo will introduce her

**Spoken script:**

**"What you're about to see is Sarah Chen — a 5th-year senior associate at Acme Litigation Partners. She's coming back from sabbatical. She has fifteen voicemails, three depositions to prep, and a partner asking for a memo by tomorrow."**

*Beat.*

**"Watch what happens when she has a firm brain underneath her."**

*Switch to live app. Demo begins.*

**Transition cue:** Direct switch to the live web app — Slide 7 stays on screen for 2–3 seconds after the spoken handoff so the audience absorbs the protagonist's name, then the wingperson advances to the app.

---

# DEMO BLOCK

`[2:55 → 7:55]` (5 minutes target)

**Live demo runs.** Full script lives in [`trellis-demo-super-narrative.md`](trellis-demo-super-narrative.md). Five beats:

1. Voice capture in the elevator (~0:45)
2. The personal brain comes alive (~0:45)
3. Privacy-preserving publish (~1:00)
4. The retrieval moment — the climax (~1:45)
5. Close + Pluggable Brain frame (~0:30) — *this beat lives inside the demo but is the conceptual bridge into the post-demo slides*

**Demo wraps. Switch back to deck. Land on Slide 8.**

---

# POST-DEMO BLOCK

## Slide 8 · Why Trellis Matters `[7:55–8:40]`

**Objective:** Translate "the thing you just saw" into "why this is a category move, not a feature." This is where the Pluggable Brain story gets reinforced for any judge who didn't fully catch it inside the demo's closing beat.

**Visual:**
- Three-row layout, each row one claim + one supporting line
- Headline at top: **"Trellis isn't another legal AI app. It's the layer underneath them all."**
- Rows:
  1. **For the lawyer** — *Their private thinking compounds, instead of evaporating.*
  2. **For the firm** — *Institutional memory becomes infrastructure, not folklore.*
  3. **For the AI ecosystem** — *Every other tool the firm adopts becomes firm-aware through one MCP endpoint.* **`[V1]`**
- Below: a single line, italicized: *"Every AI tool the firm adds raises Trellis's value, instead of competing with it."*

**Spoken script:**

**"What you just saw isn't a single product feature. It's three things at once."**

*Row 1.*

**"For the individual lawyer, their private thinking finally compounds across time, instead of evaporating between matters."**

*Row 2.*

**"For the firm, institutional memory stops being folklore that walks out the door with retiring partners — it becomes queryable infrastructure that every junior associate inherits on day one."**

*Row 3.*

**"And for the broader AI ecosystem, this is the missing substrate. Every AI tool the firm adopts — Harvey, CoCounsel, Copilot, the firm's own internal builds — plugs into the Trellis brain through an MCP endpoint and becomes firm-aware. That's V1, and the architecture is already specified."**

*Beat. Pause on the closing line.*

**"Every AI tool the firm adds raises Trellis's value instead of competing with it. That's the moat."**

**Transition cue:** *"None of this happens without the team."* → Slide 9.

---

## Slide 9 · The Team `[8:40–9:10]`

**Objective:** Establish credibility. Three names, three short qualifications, one shared frame. Don't over-sell — the demo just did the selling.

**Visual:**
- Three-column layout, one per teammate
- Each column: headshot (or initials avatar if no photo), name, role, one-line domain credibility
- Suggested layout:

  | Member | Role | One-line credibility |
  |---|---|---|
  | **[TODO: Keith]** | Capture domain — personal brain, organize pipeline, personal graph | `[TODO: brief credibility line]` |
  | **[TODO: Gabe]** | Govern domain — auth, redaction pipeline, publish flow, team graph | `[TODO: brief credibility line]` |
  | **[TODO: Nicolo]** | Retrieval domain — RAG pipeline, embedding/vector search, chat surface | `[TODO: brief credibility line]` |

- Bottom of slide, smaller: *"Three vertical slices. Six days. One deployment."*

**Spoken script:**

**"Trellis was built by three engineers across six days, working in vertical slices."**

*Brief gesture across the row.*

**"`[TODO: Keith]` owns capture — the personal brain, the organize pipeline, the personal graph. `[TODO: Gabe]` owns govern — auth, the redaction pipeline, the publish flow, the team graph view. `[TODO: Nicolo]` owns retrieval — the RAG pipeline, embedding and vector search, and the chat surface you just saw."**

*Beat.*

**"Three vertical slices. Six days. One deployment."**

**Transition cue:** Direct beat — into the close. → Slide 10.

---

## Slide 10 · Close `[9:10–9:25]`

**Objective:** Land the closing line and leave the room thinking about retiring partners. Memorable, short, no exit ramp.

**Visual:**
- Full-bleed dark slide
- One question, centered, large: **"What happens to all of this when our best people leave?"**
- Below it, smaller, after a beat: **"Trellis. The Knowledge Fabric for Law Firms."**
- Logo at the bottom
- No other elements. No bullet points. No URL. No QR code on this slide — that goes on the final outro slide if needed for judges to bookmark

**Spoken script:**

**"Every managing partner asks this question at 2 a.m., and until now there hasn't been a real answer."**

*The question fades in on screen. Read it.*

**"What happens to all of this when our best people leave?"**

*One beat. The wordmark fades in below.*

**"With Trellis, it stays."**

*Pause. Don't smile. Don't say "thank you" yet — let the line breathe for two beats.*

**"Thank you. Happy to take questions."**

**Transition cue:** End of pitch. Stay on Slide 10 for the Q&A window.

---

# Optional Slides (held in reserve)

Use only if Q&A goes long or a judge directly asks. Don't include in the main flow.

- **Slide R1 · Architecture deep-dive** — the architecture spec's two-layer diagram in detail. Use only if a technical judge asks about the privilege boundary or the RAG pipeline. Reference [`embedding-retrieval-citation-pipeline`](vault/topics/embedding-retrieval-citation-pipeline.md) for the source content.
- **Slide R2 · Pricing and go-to-market** — practice-group license, $25K–$85K tiers, ~$200K ARR per firm at maturity, land-and-expand path. Use only if a judge asks "how do you charge for this?" See [[trellis-business-model]].
- **Slide R3 · Competitive map** — Harvey, CoCounsel, Spellbook, Glean, Notion mapped against Trellis on two axes (firm-specific vs generic, privilege-safe vs cloud-first). See [[legal-ai-landscape]].
- **Slide R4 · The Refusal Moment** — single screenshot of a Trellis refusal: *"I don't have firm knowledge that directly addresses this..."* with the capture CTA. Use only if a judge questions hallucination risk. This is one of the strongest defenses in the room.

---

# Content Slots Still To Fill

`[TODO]` items the team needs to close before final rehearsal:

- [ ] Slide 3 numbers — actual researched values for: annual wisdom-evaporation loss per firm; % of firms with public-AI bans for client work; legal AI market size projection
- [ ] Slide 3 citations — actual source attributions (Thomson Reuters, ABA, Gartner, etc.)
- [ ] Slide 9 — three teammate names + one-line credibility per teammate
- [ ] Final deployment URL on a footer (Slide 10 or outro card) for the judge bookmark
- [ ] Optional QR code linking to the live deployment for slide 10
- [ ] All headshots if going with photo treatment on Slide 9

---

# Production Notes

**File format:** Suggest Marp ([apps/web/src/views/](apps/web/src/views/) already uses markdown; Obsidian has a Marp plugin) or Keynote / Google Slides. The deck should be exportable to PDF for the submission package.

**Slide aspect ratio:** 16:9. The current Trellis aesthetic is dark-mode with accent orange; carry that through every slide for visual continuity with the demo.

**Typography:** Source Serif 4 for headlines (matches the app), Inter for body text and bullets, JetBrains Mono for any code/identifier (matches the citation chip style).

**Color palette:**
- Background: `#0d1117` (matches app dark mode)
- Primary text: `#e6edf3`
- Accent: `#fb8500` (used sparingly — headlines, key numbers, transitions)
- Secondary accent: none. Resist the urge to introduce a third color.

**Wingperson choreography:** Same as the demo super-narrative. Wingperson advances slides during the deck portion, operates the second login during the demo, and returns to slide advancement for the close.

**If something goes wrong with the live demo:** Cut to the backup screen recording (mentioned in the super-narrative). Don't skip the demo block entirely — the deck-only version is much weaker. The recording is the safety net.

**Time tracking:** Wingperson holds a timer offstage. The presenter should not visibly clock-watch. Trust the rehearsal.

---

# Open Questions for the Team

- Do we want a separate **outro card** after Slide 10 (with deployment URL, GitHub link, contact info) for the judge takeaway, or fold those into Slide 10 itself?
- Are we doing a separate 2-min video version of this deck for the [`trellis-demo-video.md`](trellis-demo-video.md) submission? If yes, the deck portion compresses dramatically — likely Slides 1, 2, 4, 6, 8, 10 only.
- Headshot vs initials avatar on Slide 9 — depends on whether team photos are available in time.
- Slide 4 diagram — do we want to commission a polished version (Excalidraw / Figma), or use the architecture diagram already in `vault/raw/project-architecture.md`?
