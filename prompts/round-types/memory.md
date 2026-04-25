---
type: memory
display_name: Memory
axis_weights:
  specificity: heavy
  groundedness: heavy
  noticing: heavy
  non_obviousness: medium
  generosity_of_frame: bonus
---

# Description

A round that surfaces a previous-session reference and asks for an answer that builds on it. The point: demonstrate to the players that the game is becoming theirs specifically — that it's paying attention over time. Requires at least one prior session with memory entries.

The user prompt is a template that gets filled at runtime with a glossary entry, pattern, or previous round reference. There is no static prompt pool.

# Prompt Template

The runtime fills `{reference}` (a memory entry) and `{partner_name}` (the partner being admired) into one of these templates. Pick the template that fits the kind of memory entry being surfaced.

## glossary
A few sessions ago you and {partner_name} talked about *{reference}*. {partner_name}, what's something {answering_player_name} has done since then that connects to that?

## pattern
You've been noticing this about {partner_name}: *{reference}*. What's a recent moment that confirms or complicates that?

## reference
You've talked about *{reference}* before. What's a small thing about {partner_name} that lives in that same territory?

# Scoring Instructions

Apply the base rubric. For this round type:

- **Noticing** is heavy. The round is designed to reward attention over time. An answer that names a specific recent moment connected to the reference scores high here.
- **Specificity** is heavy. Same as admiration round — concrete moments win.
- **Groundedness** is heavy. The reference makes it tempting to perform familiarity. Ground or lose the score.
- **Non-obviousness** is medium. Rewarded if the player extends the reference rather than just restating it.
- **Generosity of frame** is a bonus.

The biggest failure mode here is restating the reference without adding a new observation. If the answer doesn't move past what was already known, cap at 1 heart and name it in the reason ("the answer restated the reference rather than building on it").
