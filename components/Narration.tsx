/*
 * A plain-language callout that explains, in one or two sentences, what the
 * numbers around it mean. Sits at the top of a view so a newcomer is never
 * staring at an unlabeled chart.
 */

export function Narration({ text, live }: { text: string; live?: boolean }) {
  return (
    <p className="narration" aria-live={live ? "polite" : undefined}>
      {text}
    </p>
  );
}
