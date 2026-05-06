import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wilcox Health and Rehab Center",
  description: "Membership portal for Wilcox Health and Rehab Center, LLC.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
