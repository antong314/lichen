---
type: build_on
display_name: Build-On
axis_weights:
  specificity: heavy
  non_obviousness: heavy
  groundedness: medium
  noticing: bonus
  generosity_of_frame: bonus
---

# Description

A two-player back-and-forth round. One player starts, the other adds, alternating. Each contribution must clear an escalating bar — repeats and obvious answers are out. The first player to stall (tap "I'm out") loses the round; the other wins. This is one of the legitimately competitive round types and it works because the loss is benign.

The AI does not score each contribution individually for hearts. Instead, the AI judges whether each contribution clears the rising bar. If the AI judges a contribution as a repeat or generic, the contributing player gets a warning ("That's close to what was already said — try again or tap out").

# User Prompts

## as_a_parent
Take turns naming small ways your partner shows up as a parent. Specific moments only. No repeats.

## household_things
Take turns naming small things your partner does for the household that the other person mostly doesn't see.

## treats_strangers
Take turns naming ways your partner treats people outside the family that say something true about them.

## creative_practice
Take turns naming things you admire about how your partner approaches their work or creative practice.

## with_friends
Take turns naming things your partner does with their friends that you find admirable.

## around_food
Take turns naming small things about your partner around food, eating, cooking, or feeding people.

# Judging Instructions

For each contribution, judge:
1. Is it specific? (concrete moment, gesture, or detail — not an abstract adjective)
2. Is it non-obvious relative to what's already been said in this round?
3. Is it not a repeat or rephrase of an earlier contribution?

Return a single JSON object — no prose, no markdown fence:

```
{
  "verdict": "accept" | "warning" | "out",
  "reason": "One sentence. State what was off if not accept."
}
```

- **accept**: the contribution clears the bar. Round continues.
- **warning**: borderline (vague, close to a previous answer). The player can try again with the next contribution. Do not issue more than one warning per player per round.
- **out**: this is a clear repeat or pure abstraction with no specificity at all. The player loses the round.

Bias toward "accept" early in the round (first 4–6 contributions). Get stricter as the round goes on. The bar rises with each turn.
