import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const baseUrl = new URL(`${protocol}://${host}`);

  return {
    metadataBase: baseUrl,
    title: "Beneath the Pine — một bước tiếp theo",
    description: "Một companion dịu dàng giúp bạn đi từ quá tải đến một bước tiếp theo.",
    icons: { icon: "/favicon.svg" },
    openGraph: {
      title: "Beneath the Pine",
      description: "Từ quá tải đến một bước tiếp theo.",
      images: [{ url: "/og.png", width: 1664, height: 952, alt: "Beneath the Pine" }],
    },
    twitter: { card: "summary_large_image", title: "Beneath the Pine", images: ["/og.png"] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
