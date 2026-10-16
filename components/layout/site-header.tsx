import Link from 'next/link';

const links = [
  { href: '/chat', label: 'Trò chuyện' },
  { href: '/check-in', label: 'Check-in' },
  { href: '/resources', label: 'Góc hỗ trợ' },
  { href: '/help', label: 'Tìm người hỗ trợ' },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-moss-100 bg-[#fbfaf7]/95 shadow-sm backdrop-blur">
      <div className="page-shell flex min-h-16 items-center justify-between gap-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold text-ink" aria-label="Trang chủ MẦM">
          <span className="grid size-9 place-items-center rounded-2xl bg-moss-100 text-xl" aria-hidden="true">🌱</span>
          <span>MẦM <span className="hidden font-normal text-moss-700 sm:inline">— Đồng hành học đường</span></span>
        </Link>
        <nav className="flex items-center gap-1 overflow-x-auto text-sm font-semibold" aria-label="Điều hướng chính">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="whitespace-nowrap rounded-full px-3 py-2 text-moss-700 hover:bg-moss-100">
              {link.label}
            </Link>
          ))}
          <Link href="/help#urgent" className="whitespace-nowrap rounded-full bg-[#f9e9e5] px-3 py-2 text-[#8a3939] hover:bg-[#f4dcd7]">
            🆘 Giúp ngay
          </Link>
        </nav>
      </div>
    </header>
  );
}
