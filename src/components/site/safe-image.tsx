import Image from 'next/image';

/** Hosts next.config.ts lets Next optimise. Anything else is shown with a plain <img> so a
 *  photo from an unexpected host can never crash the page. */
const OPTIMISED_HOSTS = ['placehold.co', 'zssukotccfkketryembq.supabase.co'];

export function isRealImage(url: string | null | undefined): url is string {
  return !!url && !/placehold\.co/i.test(url);
}

interface Props { src: string; alt: string; className?: string; sizes?: string; priority?: boolean }

/** A full-bleed image that fills its (relatively positioned) parent. */
export function FillImage({ src, alt, className, sizes = '100vw', priority }: Props) {
  let optimise = src.startsWith('/');
  if (!optimise) {
    try { optimise = OPTIMISED_HOSTS.includes(new URL(src).hostname); } catch { optimise = false; }
  }
  if (optimise) return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={className} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading={priority ? 'eager' : 'lazy'} decoding="async" className={`absolute inset-0 h-full w-full ${className ?? ''}`} />;
}
