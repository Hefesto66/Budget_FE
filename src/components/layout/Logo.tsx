
import Image from 'next/image';

export function Logo() {
  return (
    <div className="flex items-center gap-2" aria-label="Logotipo do Solaris">
      <Image 
        src="/Solaris.png" 
        alt="Solaris Logo" 
        width={32} 
        height={32} 
        className="rounded-full"
        style={{ height: 'auto' }}
      />
      <span className="text-xl font-bold font-headline text-white tracking-wide">
        Solaris
      </span>
    </div>
  );
}
