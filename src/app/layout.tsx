import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import "./globals.css";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "ExampleIQ Booking",
  description: "Book your next ride with ExampleIQ.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${openSans.variable} min-h-full bg-white`}>
      <body className="min-h-full min-w-[320px] bg-white font-sans text-[15px] font-normal text-[#111111] antialiased">
        {children}
      </body>
    </html>
  );
}
