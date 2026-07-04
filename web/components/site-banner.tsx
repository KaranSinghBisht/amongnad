import Image from "next/image";
import Link from "next/link";

// The official brand banner, shown full-width as the page header. Links back
// to the landing page.
export function SiteBanner() {
  return (
    <Link
      href="/"
      className="relative block h-20 w-full shrink-0 overflow-hidden rounded-lg border border-[#836EF9]/30 shadow-[0_0_28px_rgba(131,110,249,0.25)] sm:h-24 md:h-28"
    >
      <Image
        src="/banner.png"
        alt="AmongNad — Among Us, but agents play. AI social deduction on Monad."
        fill
        priority
        sizes="calc(100vw - 24px)"
        className="object-cover object-center"
      />
    </Link>
  );
}
