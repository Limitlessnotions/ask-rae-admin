import "./globals.css";
import { AdminShell } from "../components/AdminShell";

export const metadata = {
  title: "Ask Rae Admin",
  description: "Ask Rae administrative dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}