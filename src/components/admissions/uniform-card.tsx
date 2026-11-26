import { Shirt } from 'lucide-react';

/** Points families to the AngelMoeth uniform shop. Set NEXT_PUBLIC_UNIFORM_SHOP_URL to the shop's address. */
export function UniformCard({ className = '' }: { className?: string }) {
  const url = (process.env.NEXT_PUBLIC_UNIFORM_SHOP_URL ?? '').trim();
  return (
    <div className={`rounded-xl border-l-4 border-accent bg-card p-5 text-left shadow-sm ${className}`}>
      <div className="flex items-start gap-3">
        <Shirt className="mt-0.5 h-6 w-6 shrink-0 text-accent" aria-hidden="true" />
        <div>
          <h3 className="font-semibold text-primary">School uniform</h3>
          <p className="mt-1 text-sm text-foreground/80">Once your child is offered a place, order the school uniform from our official uniform shop, AngelMoeth. You can do it from home and plan ahead so your child is ready on the first day.</p>
          {url ? (
            <a href={url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90">Buy uniform at AngelMoeth</a>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Ask the school office for the AngelMoeth shop link.</p>
          )}
        </div>
      </div>
    </div>
  );
}
