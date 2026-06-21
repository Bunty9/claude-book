import type { Metadata } from 'next'
import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Claude, End to End',
  description: 'An interactive book about Claude',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
