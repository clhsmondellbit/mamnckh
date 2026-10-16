import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-moss-100 bg-white">
      <div className="page-shell flex flex-col justify-between gap-3 py-7 text-sm text-slate-600 sm:flex-row sm:items-center">
        <p>🌱 MẦM là công cụ AI hỗ trợ bước đầu, không thay thế sự hỗ trợ trực tiếp từ con người.</p>
        <div className="flex gap-4">
          <Link href="/privacy" className="underline hover:text-moss-700">Quyền riêng tư</Link>
          <Link href="/about" className="underline hover:text-moss-700">Về MẦM</Link>
        </div>
      </div>
    </footer>
  );
}
