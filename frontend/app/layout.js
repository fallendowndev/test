import { Inter } from "next/font/google";
import "./globals.css";
import ClientProviders from "./components/ClientProviders";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "Just Blog! — Community Content Platform",
  description: "A community platform where users create, discuss, and vote on content. Join the conversation.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col font-sans">
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
