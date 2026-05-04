import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SAKSHAM.AI – Master Your Next Big Interview with AI',
  description: 'AI-powered interview preparation. Practice with realistic mock interviews, get instant feedback, and land your dream job.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
      </head>
      <body className="mesh-bg min-h-screen antialiased">{children}</body>
    </html>
  )
}
