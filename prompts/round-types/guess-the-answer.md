---
type: guess_the_answer
display_name: Guess
axis_weights:
  specificity: heavy
  non_obviousness: medium
  groundedness: heavy
  noticing: heavy
  generosity_of_frame: bonus
---

# Description

A two-stage round about Player A. Player B answers first, predicting what A would say. Then A answers for real. Scoring splits into two parts:

1. **Attention score** — Claude scores Player B's prediction against the rubric (specificity, non-obviousness, groundedness). This is the part the AI can judge on its own.
2. **Accuracy score** — Player A taps 1–3 hearts: how close did the prediction get?

This round can produce the most insight and also the most harm. **A wrong guess must be framed as a gift, not a failure.** The reason text on a low-accuracy round must name the gap as something worth noticing — a small blind spot — not as a failure of attention. After the round, if accuracy is 1 heart, the game offers an exit ramp: "Take as long as you need. Tap when ready." No coaching. No follow-up.

# User Prompts

## quietly_proud
If your partner had to name one thing about your shared life that they're quietly proud of — something they wouldn't bring up on their own but would admit to if asked — what would they say?

## secretly_treasures
Name something your partner secretly treasures about the relationship that they wouldn't bring up unprompted.

## proudest_recent
What's a recent moment your partner is quietly proud of that they didn't make a thing of?

## would_admit
Name something your partner would admit to admiring about themselves only if you asked them point-blank.

## small_resentment_or_wish
Name something your partner privately wishes were different about your shared life — not a big thing, a small one.

## what_anchors_them
Name a small recurring thing that anchors your partner's week — something they wouldn't list but would miss if it disappeared.

# Scoring Instructions (attention score only — accuracy comes from the partner)

Apply the base rubric to Player B's prediction. For this round type:

- **Specificity** and **groundedness** are heavy. A concrete prediction with texture is much more interesting than a generic one, even if wrong.
- **Noticing** is heavy. A prediction that draws on something only this couple would know — a shared reference, a private joke, a household pattern — scores high.
- **Non-obviousness** is medium. Avoid the "she'd say she's proud of the kids" default.
- **Generosity of frame** is a bonus.

For the reason text, do not pre-empt the accuracy score. Speak only to the quality of the prediction as an act of attention. ("Your prediction was specific and grounded — texture this couple would recognize, regardless of whether it lands.")

# Reason text on a low accuracy score

When the partner taps 1 heart for accuracy, the system will generate a follow-up reason. That reason must:
- Frame the gap as a *gift* — a small visible thing one of you didn't know about the other
- Not assign blame
- Be short — one or two sentences
- Not coach. Do not say what the player should have said. Do not explain the partner's real answer beyond what the partner wrote
- Offer the exit ramp at the end: "Take as long as you need. Tap when ready."

A starting template: "{partner_name} answered differently than you guessed. That's a small thing visible now that wasn't before. Take as long as you need. Tap when ready."
