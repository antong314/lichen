import { Button } from "./Button";

export function PassDevice({
  toName,
  subtitle,
  onContinue,
}: {
  toName: string;
  subtitle?: string;
  onContinue: () => void;
}) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-stone-900 text-stone-50 z-50">
      <p className="text-stone-400 text-sm uppercase tracking-widest mb-4">Pass to</p>
      <h2 className="text-5xl font-medium mb-2">{toName}</h2>
      {subtitle ? <p className="text-stone-400 text-base mb-12 mt-2">{subtitle}</p> : null}
      <Button variant="secondary" onClick={onContinue} className="mt-8">
        Tap when ready
      </Button>
    </div>
  );
}
