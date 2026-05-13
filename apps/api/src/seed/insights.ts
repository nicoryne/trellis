/**
 * Seed data: published insight nodes for the team graph.
 * 20 fictional litigation insights covering all required categories.
 * PH law context. Seed voice: conclusory + brief narrative, 2–3 sentences.
 *
 * Categories (from PRD §2.8):
 *   - Judge tendencies (5)
 *   - Opposing counsel patterns (3)
 *   - Motion practice (4)
 *   - Expert witness handling (3) — canonical demo query targets these
 *   - Settlement dynamics (3)
 *   - Procedural lessons (2)
 */

export interface SeedInsight {
  title: string;
  body: string;
  summary: string;
  classification: string;
  entities: Array<{
    name: string;
    type: string;
  }>;
}

export const seedInsights: SeedInsight[] = [
  // ─── Judge Tendencies (5) ────────────────────────────────────────────────

  {
    title: 'Judge Reyes strict on pre-trial conference deadlines',
    body: 'Judge Reyes of RTC Branch 42 consistently denies motions for postponement of pre-trial conferences absent medical certificates or force majeure documentation. In three matters before her court in the past year, counsel who filed motions to reset fewer than five days before the scheduled pre-trial had their motions denied outright, with warnings of potential citation for indirect contempt.',
    summary: 'Judge Reyes rarely grants pre-trial postponements without strong cause documentation.',
    classification: 'observation',
    entities: [
      { name: 'Judge Maria Reyes', type: 'judge' },
      { name: 'RTC Branch 42', type: 'matter' },
      { name: 'Pre-trial Conference Deadlines', type: 'concept' },
    ],
  },
  {
    title: 'Judge Santos favors mediation referrals in commercial disputes',
    body: 'Judge Santos of RTC Branch 15 has referred every commercial dispute to court-annexed mediation within the first two hearings. He tends to view failure to mediate in good faith unfavorably and has cited it as a factor in awarding costs. Counsel should prepare genuine settlement positions before the initial hearing to demonstrate willingness.',
    summary: 'Judge Santos consistently pushes commercial cases to mediation early and penalizes bad-faith participation.',
    classification: 'strategy',
    entities: [
      { name: 'Judge Arturo Santos', type: 'judge' },
      { name: 'RTC Branch 15', type: 'matter' },
      { name: 'Court-Annexed Mediation', type: 'concept' },
      { name: 'Commercial Disputes', type: 'concept' },
    ],
  },
  {
    title: 'Judge Lim restrictive on expert witness testimony scope',
    body: 'Judge Lim of RTC Branch 28 strictly limits expert witness testimony to the specific matters stated in the judicial affidavit. Any attempt to elicit opinions beyond the declared scope is consistently sustained on objection. Counsel should ensure the judicial affidavit comprehensively covers all anticipated expert opinion topics, including rebuttal scenarios.',
    summary: 'Judge Lim enforces narrow expert testimony scope; judicial affidavits must be comprehensive.',
    classification: 'observation',
    entities: [
      { name: 'Judge Patricia Lim', type: 'judge' },
      { name: 'RTC Branch 28', type: 'matter' },
      { name: 'Expert Witness Testimony Scope', type: 'concept' },
      { name: 'Judicial Affidavit Rule', type: 'precedent' },
    ],
  },
  {
    title: 'Judge Navarro accepts technology-assisted document review',
    body: 'Judge Navarro of RTC Branch 7 is one of the few trial court judges who has accepted predictive coding results as adequate compliance with discovery obligations. In the Meridian Holdings matter, he allowed a technology-assisted review protocol that reduced document production time by 60%. Counsel should prepare a detailed methodology submission when proposing TAR in his court.',
    summary: 'Judge Navarro is receptive to predictive coding and technology-assisted review in discovery.',
    classification: 'lesson_learned',
    entities: [
      { name: 'Judge Roberto Navarro', type: 'judge' },
      { name: 'RTC Branch 7', type: 'matter' },
      { name: 'Technology-Assisted Review', type: 'concept' },
      { name: 'Meridian Holdings Discovery', type: 'matter' },
    ],
  },
  {
    title: 'Judge Cruz delays rulings on jurisdictional challenges',
    body: 'Judge Cruz of RTC Branch 33 tends to defer rulings on motions to dismiss based on lack of jurisdiction, preferring to resolve them after the plaintiff has completed the presentation of evidence. This pattern has been observed in at least four cases in the last two years. Counsel defending jurisdictional challenges in her court should anticipate extended litigation before obtaining a ruling.',
    summary: 'Judge Cruz defers jurisdictional dismissal motions until after plaintiff evidence presentation.',
    classification: 'observation',
    entities: [
      { name: 'Judge Elena Cruz', type: 'judge' },
      { name: 'RTC Branch 33', type: 'matter' },
      { name: 'Jurisdictional Challenges', type: 'concept' },
      { name: 'Motion to Dismiss', type: 'concept' },
    ],
  },

  // ─── Opposing Counsel Patterns (3) ────────────────────────────────────────

  {
    title: 'Villanueva & Associates uses late document dumps before hearings',
    body: 'Villanueva & Associates has a pattern of producing voluminous supplemental document disclosures 48–72 hours before critical hearings. This has occurred in at least three matters against our firm. The tactic appears designed to overwhelm preparation time. Counter-strategy: file an urgent motion to strike late-produced documents or request a continuance citing prejudice.',
    summary: 'Villanueva & Associates regularly dumps documents right before hearings to overwhelm opposing counsel.',
    classification: 'strategy',
    entities: [
      { name: 'Villanueva & Associates', type: 'party' },
      { name: 'Late Document Disclosure', type: 'concept' },
      { name: 'Motion to Strike', type: 'concept' },
    ],
  },
  {
    title: 'Atty. Bernardo aggressive on deposition objections',
    body: 'Attorney Ricardo Bernardo of Santos Cruz Law consistently interposes speaking objections during depositions to coach witnesses. He frequently objects on grounds of "vague," "compound," and "calls for speculation" even on straightforward questions. Effective counter: have the stenographer read back the question verbatim, then ask the witness to answer. Consider filing a motion for protective order if the pattern persists.',
    summary: 'Atty. Bernardo uses speaking objections during depositions to coach witnesses; counter with read-backs.',
    classification: 'strategy',
    entities: [
      { name: 'Atty. Ricardo Bernardo', type: 'lawyer' },
      { name: 'Santos Cruz Law', type: 'party' },
      { name: 'Deposition Objections', type: 'concept' },
      { name: 'Speaking Objections', type: 'concept' },
    ],
  },
  {
    title: 'Ramos Law Firm settlement approach in labor disputes',
    body: 'Ramos Law Firm representing respondent employers in labor cases consistently makes settlement offers only after the mandatory conciliation-mediation period at the NLRC. Their initial offers are typically 30–40% of the claim. They tend to increase to 60–70% only after an adverse preliminary conference ruling. Counsel for complainants should hold firm through the preliminary conference.',
    summary: 'Ramos Law Firm makes low initial labor settlement offers; meaningful offers come only after adverse rulings.',
    classification: 'strategy',
    entities: [
      { name: 'Ramos Law Firm', type: 'party' },
      { name: 'NLRC Conciliation-Mediation', type: 'concept' },
      { name: 'Labor Dispute Settlement', type: 'concept' },
    ],
  },

  // ─── Motion Practice (4) ──────────────────────────────────────────────────

  {
    title: 'Summary judgment success rate higher with affidavit evidence',
    body: 'Motions for summary judgment in our commercial litigation practice have a significantly higher success rate when supported by detailed affidavits from fact witnesses rather than relying solely on documentary evidence. In the last eight summary judgment motions filed by our firm, the five that included witness affidavits were granted, while two of the three relying only on documents were denied.',
    summary: 'Summary judgment motions succeed more often with witness affidavits, not just documents.',
    classification: 'lesson_learned',
    entities: [
      { name: 'Summary Judgment', type: 'concept' },
      { name: 'Affidavit Evidence', type: 'concept' },
      { name: 'Commercial Litigation', type: 'concept' },
    ],
  },
  {
    title: 'Motion in limine to exclude hearsay business records',
    body: 'Filing a motion in limine to exclude business records under the hearsay rule before the formal offer of evidence has proven effective in two recent cases. By challenging authentication and the business records exception requirements early, we forced opposing counsel to produce the records custodian for testimony, which delayed their case and revealed inconsistencies in record-keeping practices.',
    summary: 'Early motions in limine challenging business records authentication force custodian testimony and reveal weaknesses.',
    classification: 'strategy',
    entities: [
      { name: 'Motion in Limine', type: 'concept' },
      { name: 'Hearsay Business Records', type: 'concept' },
      { name: 'Business Records Exception', type: 'precedent' },
    ],
  },
  {
    title: 'Demurrer to evidence timing in civil cases',
    body: 'Filing a demurrer to evidence immediately after the plaintiff rests, rather than waiting for the formal offer, creates tactical pressure. In three recent commercial cases, the demurrer forced the court to evaluate the sufficiency of plaintiff evidence before defendant presentation, resulting in one outright dismissal and two cases where the plaintiff sought favorable settlement terms during the pendency of the demurrer.',
    summary: 'Timely demurrers to evidence create settlement leverage and occasionally result in early dismissal.',
    classification: 'strategy',
    entities: [
      { name: 'Demurrer to Evidence', type: 'concept' },
      { name: 'Rule 33 Rules of Court', type: 'statute' },
      { name: 'Sufficiency of Evidence', type: 'concept' },
    ],
  },
  {
    title: 'Injunctive relief — irreparable injury requirement in IP cases',
    body: 'Courts in intellectual property cases increasingly require concrete evidence of irreparable injury rather than presuming it. In our recent trademark infringement matter, the TRO application was denied because we relied on the presumption of irreparable harm rather than presenting market survey data showing actual consumer confusion. Post-denial, we commissioned a rapid consumer survey and obtained the preliminary injunction on the renewed application.',
    summary: 'IP injunction applications should include concrete irreparable harm evidence, not just presumptions.',
    classification: 'lesson_learned',
    entities: [
      { name: 'Temporary Restraining Order', type: 'concept' },
      { name: 'Irreparable Injury', type: 'concept' },
      { name: 'Intellectual Property Litigation', type: 'concept' },
      { name: 'Trademark Infringement', type: 'concept' },
    ],
  },

  // ─── Expert Witness Handling (3) — CANONICAL DEMO QUERY TARGETS ──────────

  {
    title: 'Cross-examining damages experts on counsel-supplied assumptions',
    body: 'The most effective cross-examination technique for damages expert witnesses is establishing their reliance on assumptions provided by retaining counsel rather than independently verified data. In depositions, ask the expert to list every assumption in their damages model and identify which were supplied by counsel versus independently derived. In two recent matters, this approach revealed that over 70% of the damages calculation assumptions were counsel-supplied, which the court found significantly undermined the expert testimony credibility. The key is to systematically walk through each assumption and document the source.',
    summary: 'Attacking damages experts on counsel-supplied assumptions is highly effective; document assumption sources systematically.',
    classification: 'strategy',
    entities: [
      { name: 'Damages Expert Cross-Examination', type: 'concept' },
      { name: 'Counsel-Supplied Assumptions', type: 'concept' },
      { name: 'Expert Witness Credibility', type: 'concept' },
      { name: 'Damages Calculation Methodology', type: 'concept' },
    ],
  },
  {
    title: 'Daubert-style challenge to damages expert methodology in Philippine courts',
    body: 'While Philippine courts do not formally follow Daubert, the principles of expert qualification and methodology reliability are applicable under the Rules on Evidence. In a recent commercial damages case, we successfully challenged a damages expert by showing that their discounted cash flow model used a discount rate unsupported by any recognized financial methodology. The court excluded the expert opinion on damages, effectively reducing the claim by 60%. The motion cited American jurisprudence on expert methodology as persuasive authority.',
    summary: 'Daubert-style methodology challenges work in PH courts; attack unsupported financial assumptions in damages models.',
    classification: 'lesson_learned',
    entities: [
      { name: 'Daubert Standard', type: 'precedent' },
      { name: 'Expert Methodology Challenge', type: 'concept' },
      { name: 'Discounted Cash Flow', type: 'concept' },
      { name: 'Rules on Evidence', type: 'statute' },
    ],
  },
  {
    title: 'Preparing for expert rebuttal on damages calculations',
    body: 'When facing an opposing damages expert, our most successful rebuttal strategy involves three steps: (1) retain a competing expert who uses a different, recognized methodology for damages calculation; (2) have the rebuttal expert prepare a detailed comparison showing how different reasonable assumptions produce vastly different damages figures, undermining the certainty of opposing expert claims; (3) focus the rebuttal testimony on the sensitivity analysis — demonstrating that small changes in key assumptions produce disproportionate changes in the calculated damages. This three-step approach has successfully reduced damages awards in three consecutive matters.',
    summary: 'Three-step expert rebuttal: competing methodology, assumption comparison, and sensitivity analysis to undermine damages certainty.',
    classification: 'strategy',
    entities: [
      { name: 'Expert Rebuttal Strategy', type: 'concept' },
      { name: 'Damages Calculation', type: 'concept' },
      { name: 'Sensitivity Analysis', type: 'concept' },
      { name: 'Competing Expert Methodology', type: 'concept' },
    ],
  },

  // ─── Settlement Dynamics (3) ──────────────────────────────────────────────

  {
    title: 'Early mediation produces better outcomes in construction disputes',
    body: 'In our construction litigation practice, cases referred to mediation within the first six months of filing have settled at rates averaging 35% higher than those mediated later. Early mediation preserves business relationships and avoids the cost escalation of extended discovery. The key factor appears to be that parties are more willing to compromise before significant litigation costs have been incurred and positions have hardened.',
    summary: 'Construction disputes settle better when mediated early (within 6 months of filing); delay hardens positions.',
    classification: 'lesson_learned',
    entities: [
      { name: 'Construction Dispute Mediation', type: 'concept' },
      { name: 'Early Mediation', type: 'concept' },
      { name: 'Settlement Timing', type: 'concept' },
    ],
  },
  {
    title: 'Settlement leverage increases after adverse interlocutory rulings',
    body: 'Settlement offers made immediately after a favorable interlocutory ruling (such as denial of a motion to dismiss or granting of a preliminary injunction) consistently yield better terms. In five recent cases, settlement amounts increased by 25–40% when offers were made within one week of a favorable ruling. The psychological impact of a recent adverse ruling makes opposing parties more receptive to reasonable settlement terms.',
    summary: 'Make settlement offers immediately after favorable rulings; opposing parties are most receptive within one week.',
    classification: 'strategy',
    entities: [
      { name: 'Settlement Leverage', type: 'concept' },
      { name: 'Interlocutory Rulings', type: 'concept' },
      { name: 'Negotiation Timing', type: 'concept' },
    ],
  },
  {
    title: 'Structured settlement proposals in high-value commercial cases',
    body: 'For claims exceeding PHP 50 million, structured settlement proposals that include non-monetary components (such as ongoing business relationships, supply agreements, or licensing arrangements) have been accepted at twice the rate of pure monetary offers. This approach works because it allows the paying party to preserve cash flow while the receiving party obtains value that may exceed the monetary equivalent. Our template includes monetary component, business terms, timeline, and confidentiality provisions.',
    summary: 'High-value cases settle more often with structured proposals that mix monetary and business relationship terms.',
    classification: 'strategy',
    entities: [
      { name: 'Structured Settlement', type: 'concept' },
      { name: 'High-Value Commercial Claims', type: 'concept' },
      { name: 'Non-Monetary Settlement Terms', type: 'concept' },
    ],
  },

  // ─── Procedural Lessons (2) ───────────────────────────────────────────────

  {
    title: 'Filing verified pleadings — common deficiencies to avoid',
    body: 'The most common reason for dismissal of complaints in our practice has been deficient verification and certification against forum shopping. Specific pitfalls: (1) the verification must state that the affiant has read the pleading and that the allegations are true and correct of his personal knowledge or based on authentic records; (2) the certificate against forum shopping must be executed by the plaintiff, not counsel; (3) for corporate plaintiffs, a board resolution authorizing the signatory must be attached. Missing any of these results in dismissal without prejudice, wasting months of preparation.',
    summary: 'Verified pleading deficiencies (wrong affiant, missing board resolution) cause dismissals; check all three requirements.',
    classification: 'lesson_learned',
    entities: [
      { name: 'Verified Pleadings', type: 'concept' },
      { name: 'Certification Against Forum Shopping', type: 'concept' },
      { name: 'Rule 7 Rules of Court', type: 'statute' },
    ],
  },
  {
    title: 'Local court practice on service of pleadings in Metro Manila',
    body: 'Several Metro Manila RTC branches have adopted informal requirements for service of pleadings that go beyond the Rules of Court. Branches 12, 28, and 42 now require counsel to provide courtesy copies of all motions to the branch clerk of court via email at least two business days before the hearing date, in addition to the formal service. Non-compliance does not result in formal sanctions but counsel who comply receive more favorable scheduling and their motions are more likely to be heard on the scheduled date.',
    summary: 'Metro Manila RTC branches expect courtesy email copies of motions to the clerk 2 days before hearing for favorable scheduling.',
    classification: 'observation',
    entities: [
      { name: 'Metro Manila RTC Practice', type: 'concept' },
      { name: 'Service of Pleadings', type: 'concept' },
      { name: 'Courtesy Copies', type: 'concept' },
      { name: 'Rules of Court Service Requirements', type: 'statute' },
    ],
  },
];
