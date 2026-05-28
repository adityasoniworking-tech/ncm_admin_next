import { Inter } from 'next/font/google';
import "./globals.css";
import { AdminProvider } from "@/context/AdminContext";
import AdminLayout from "@/components/layout/AdminLayout";

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  title: "Admin Portal | NuttyChocoMorsels",
  description: "Management dashboard for NuttyChocoMorsels bakery.",
  robots: "noindex, nofollow",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
      </head>
      <body className="antialiased">
        <AdminProvider>
          <AdminLayout>
            {children}
          </AdminLayout>
        </AdminProvider>
      </body>
    </html>
  );
}
