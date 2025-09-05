
import { Sun } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-2" aria-label="Solaris Logo">
      <div className="rounded-full bg-primary/20 p-2">
        <Sun className="h-6 w-6 text-primary" />
      </div>
      <span className="text-xl font-bold font-headline text-white tracking-wide">
        Solaris
      </span>
    </div>
  );
}
