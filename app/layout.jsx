import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata = {
  title: "CarolinaOS - EventTech CRM",
  description: "Sistema operativo comercial y operativo para gestion end-to-end de clientes, fechas y eventos.",
}

export const viewport = {
  themeColor: "#1a56db",
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
