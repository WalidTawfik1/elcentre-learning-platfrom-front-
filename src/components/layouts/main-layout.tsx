
import { ReactNode } from "react"
import { Toaster } from "@/components/ui/toaster"
import { NavBar } from "@/components/navigation/navbar"
import { Footer } from "@/components/navigation/footer"

interface MainLayoutProps {
  children: ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <main className="flex-grow">{children}</main>
      <Footer />
      <Toaster />
    </div>
  )
}
