## Project Title

**Trellis: The Knowledge Fabric for Law Firms**

*The substrate that finally makes legal AI work.*

---

## Short Description

When a senior lawyer retires, fifteen years of hard-won instinct walks out the door with them. Trellis is the privacy-first knowledge fabric that catches that wisdom before it leaves: a private second brain for every lawyer, woven into a living, queryable knowledge graph the entire firm can finally trust to ask.

---

## Long Description

**Every law firm is sitting on a fortune it can't find.**

That fortune lives in the head of the senior litigator who knows which judge runs out of patience after lunch, in the partner who knows the exact settlement number a particular insurance carrier will quietly accept, and in the associate who spent three weeks last year solving the same motion problem someone two floors up had already cracked. None of it is written down anywhere, and the reason is structural rather than careless. Lawyers bill in six-minute increments, so every minute spent documenting an insight is a minute they aren't paid for, and the firm's own economics quietly punish the behavior the firm most needs. When senior people retire or move on, the institutional intelligence they spent careers building simply walks out with them, and a typical mid-to-large firm loses an estimated **$15 to $40 million a year** to that quiet evaporation.

You would think modern AI would solve this, but it can't, because attorney-client privilege is a legal obligation rather than a preference. Lawyers cannot paste case facts into ChatGPT, most major firms have banned public AI tools for client work outright, and the legal AI tools that *are* allowed (Harvey, CoCounsel, Spellbook) only know generic legal knowledge rather than what your particular firm has actually learned. The smartest people in the building end up choosing between paralysis and shadow IT, and the firm keeps bleeding wisdom either way.

**Trellis is the missing layer, and it works two ways at once.**

For the individual lawyer, Trellis is a **private second brain** that captures their thinking as fluidly as they have it. They might dictate a quick observation between meetings, *"Judge Reyes pushed back hard on our motion to compel today, focused on proportionality,"* and within seconds an **on-device AI model** has transcribed the voice memo, extracted the entities, and threaded the note into their personal knowledge graph alongside everything else they have captured about that judge, that doctrine, and that matter. Nothing leaves their device unsanitized, so the second brain is theirs and theirs alone. The reason this matters is simple: a lawyer's most valuable thinking happens in moments that aren't billable, and unless those moments are captured the instant they occur (without the friction of "should I write this up later?") they are lost. Trellis gives them a place where their own intuition compounds across time, where they can revisit a half-formed thought from six months ago and recognize the pattern they didn't have words for at the time.

For the firm, Trellis is a **team-managed, queryable knowledge graph** of every insight the team has chosen to share. When a lawyer decides an observation is worth contributing, they hit publish and a redaction pipeline visibly strips client identifiers and generalizes the specifics: *"Our client's 2019 acquisition of a medical device competitor"* becomes *"An acquisition of a horizontal competitor in a regulated industry,"* so that the strategic insight survives the move from personal to shared without ever risking the privileged content underneath. The sanitized insight then flows into the firm's collective graph, where any teammate can ask a question like *"What have we learned about cross-examining expert witnesses on damages?"* and a **cloud AI model bound strictly to that graph** answers, drawing not on the open internet or generic training data but only on what the firm itself has actually learned. As the answer streams back, the graph fades into view at the center of the screen and the cited nodes pulse one by one in real time, so the reasoning is visible and every claim is clickable back to its source; if the firm hasn't learned the answer yet, the system refuses rather than inventing one, which is exactly the behavior a lawyer needs from a tool whose output they might one day cite in a brief.

**The two halves complete each other.** The personal second brain protects every lawyer's private thinking and lets it compound for them alone, while the team graph captures only what has been deliberately and safely shared, and together they turn institutional memory from something fragile and human into something durable and queryable. This is the layer that survives departures, that makes every junior associate as smart as the firm itself on their first day, and that finally answers the question every managing partner asks at 2am: *what happens to all of this when our best people leave?*

There is also a longer game. Once the firm has a living knowledge graph of its own, every other AI tool the firm adopts can plug into it, so Harvey gets smarter for *your* firm, Copilot gets smarter for *your* firm, and the firm's internal builds get smarter for *your* firm too, because for the first time those tools actually know what *this firm* has learned rather than what the internet has learned.

Lawyers spend a lifetime getting wise. **Trellis is how that wisdom stops dying.**

---

## Technology & Category Tags

### Categories

`Legal AI` · `Legal Tech` · `Knowledge Management` · `Vertical SaaS` · `Enterprise AI` · `Privacy-First AI` · `RAG` · `Knowledge Graphs` · `AI Pipelines` · `Conversational Search` · `Data & Intelligence` · `Productivity` · `B2B SaaS`

### Hackathon track

`Track 4: Data & Intelligence` · `Gemini Award`

Trellis hits all four Track 4 focus areas in one product: RAG over proprietary data, AI-powered data pipelines, analytics agents for natural-language querying, and knowledge graph extraction.

### Core technologies

| Layer | Stack |
|---|---|
| **Frontend** | React, Vite, TypeScript, Cytoscape.js |
| **Backend** | Node.js, Express, JWT auth |
| **Database** | PostgreSQL, pgvector |
| **AI, Personal layer (on-device)** | Gemma (V1): local inference, never leaves the device |
| **AI, Team layer (cloud, knowledge-bound)** | Gemini Pro: grounded strictly in the firm's own graph via RAG over pgvector |
| **AI, Scoring & Light Reasoning** | Gemini Flash |
| **AI, Image Understanding** | Gemini Vision |
| **AI, Embeddings** | Google `text-embedding-004` |
| **AI, Speech to Text** | OpenAI Whisper |
| **AI, PII Detection** | Microsoft Presidio |
| **Storage, Personal Layer** | IndexedDB (on-device markdown via Tauri in V1) |
| **Hosting** | Vercel · Railway / Render |

### V1 horizon

`Tauri (native desktop)` · `On-device Gemma` · `MCP server endpoint` · `SSO / SAML / OIDC` · `iManage & NetDocuments integration` · `SOC 2 Type II` · `Four-pass redaction` · `Audit logging`
