import { Sun } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-2" aria-label="FE Sistema Solar Logo">
      <div className="rounded-full bg-accent/20 p-2">
        <Sun className="h-6 w-6 text-accent" />
      </div>
      <span className="text-xl font-bold font-headline text-foreground tracking-wide">
        FE Sistema Solar
      </span>
    </div>
  );
}
