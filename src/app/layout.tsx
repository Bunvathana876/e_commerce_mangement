import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Blue Panda — Management & Seller Center",
  description:
    "Merchant center and administrative back-office portal for Blue Panda e-commerce platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${plusJakartaSans.className} antialiased text-slate-900 bg-[#F5F7FB] selection:bg-blue-600 selection:text-white`}
      >
        {children}
      </body>
    </html>
  );
}
