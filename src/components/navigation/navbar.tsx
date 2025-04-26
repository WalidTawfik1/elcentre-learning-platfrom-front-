import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { useAuth } from "@/hooks/use-auth"
import { UserNav } from "./user-nav"
import { useEffect, useState } from "react"

export function NavBar() {
  const { user, isAuthenticated, isLoading, refreshUser } = useAuth()
  const location = useLocation()
  
  // Force a refresh of user data when navbar mounts or route changes
  useEffect(() => {
    if (document.cookie.includes('jwt=')) {
      refreshUser()
    }
  }, [location.pathname, refreshUser])
  
  // Add class to body when authenticated for global styling
  useEffect(() => {
    if (isAuthenticated) {
      document.body.classList.add('is-authenticated')
    } else {
      document.body.classList.remove('is-authenticated')
    }
    
    // Debug auth state
    console.log("Auth state updated:", { 
      isAuthenticated, 
      userPresent: !!user,
      userDetails: user ? `${user.firstName} ${user.lastName} (${user.userType})` : null,
    })
  }, [isAuthenticated, user])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 hidden md:flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <img
              src="/lovable-uploads/9b447436-da1d-48da-a60f-33c2518e8e50.png"
              alt="ElCentre Logo"
              className="h-10 w-auto"
            />
            <span className="hidden font-bold sm:inline-block text-eduBlue-500 text-xl">ElCentre</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link to="/courses" className="transition-colors hover:text-foreground/80">
              Courses
            </Link>
            <Link to="/categories" className="transition-colors hover:text-foreground/80">
              Categories
            </Link>
            <Link to="/instructors" className="transition-colors hover:text-foreground/80">
              Instructors
            </Link>
            {isAuthenticated && user?.userType === "Instructor" && (
              <Link to="/instructor/dashboard" className="transition-colors hover:text-foreground/80">
                Instructor Dashboard
              </Link>
            )}
            {isAuthenticated && user?.userType === "Admin" && (
              <Link to="/admin/dashboard" className="transition-colors hover:text-foreground/80">
                Admin Dashboard
              </Link>
            )}
          </nav>
        </div>

        <div className="flex-1 md:hidden">
          <Link to="/" className="flex items-center space-x-2">
            <img
              src="/lovable-uploads/9b447436-da1d-48da-a60f-33c2518e8e50.png"
              alt="ElCentre Logo"
              className="h-8 w-auto"
            />
            <span className="font-bold text-eduBlue-500 text-xl">ElCentre</span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-4">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <Button variant="outline" size="icon" className="ml-auto h-8 w-8">
              <Search className="h-4 w-4" />
              <span className="sr-only">Search</span>
            </Button>
          </div>
          
          {/* Auth state dependent UI */}
          {isLoading ? (
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse"></div>
          ) : isAuthenticated ? (
            <UserNav />
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Sign up</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
