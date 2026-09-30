import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  return (
    <nav style={{ backgroundColor: "#292929" }} className="w-full border-b border-[#3a3a3a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-13 py-2.5">
          <Link href="/" className="flex-shrink-0 flex items-center">
            <Image
              src="/logo.png"
              alt="fehrist"
              width={120}
              height={32}
              priority
              className="h-7 sm:h-8 w-auto object-contain"
            />
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/login"
              className="text-xs sm:text-sm text-slate-300 hover:text-white transition-colors"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
