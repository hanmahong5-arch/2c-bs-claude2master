import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <p className="eyebrow mb-4">404</p>
      <h1 className="font-display italic text-5xl md:text-6xl font-semibold mb-4 headline-tight">
        这页走丢了
      </h1>
      <p className="text-[var(--color-text-secondary)] mb-8 max-w-md">
        也许它还在草稿里，也许我们把链接改了。回首页试试看？
      </p>
      <Link href="/" className="btn btn-primary">
        回到首页 →
      </Link>
    </div>
  );
}
