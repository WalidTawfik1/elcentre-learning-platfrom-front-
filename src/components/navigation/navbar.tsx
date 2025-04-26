import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Menu, Search, X } from "lucide-react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/use-auth"
import { UserNav } from "./user-nav"
import { useEffect, useState } from "react"

export function NavBar() {
  const { user, isAuthenticated, isLoading, refreshUser } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
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

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      navigate(`/courses?search=${encodeURIComponent(searchTerm.trim())}`)
      setSearchTerm("")
      setIsSearchOpen(false)
    }
  }

  // Close mobile menu when clicking a link
  const handleMobileNavClick = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Desktop Logo and Nav */}
        <div className="mr-4 hidden md:flex items-center">
          <Link to="/" className="mr-6 flex items-center self-center">
            <img
              src="/ELCentreLogo21.png"
              alt="ElCentre Logo"
              className="h-8 w-auto my-auto -mt-2.5"
            />
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link to="/courses" className="transition-colors hover:text-foreground/80">
              Courses
            </Link>
            <Link to="/categories" className="transition-colors hover:text-foreground/80">
              Categories
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

        {/* Mobile Logo - Properly sized */}
        <div className="flex items-center md:hidden">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Link to="/" className="flex items-center">
            <img
              src="/ELCentreLogo21.png"
              alt="ElCentre Logo"
              className="h-7 w-auto" /* Fixed size for mobile */
            />
          </Link>
        </div>

        {/* Right-side content */}
        <div className="flex flex-1 items-center justify-end space-x-2 sm:space-x-4">
          {/* Desktop search bar */}
          <div className="hidden md:flex md:w-full md:max-w-sm lg:max-w-md">
            <form onSubmit={handleSearch} className="relative w-full">
              <Input
                type="search"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
              <Button 
                type="submit" 
                variant="ghost" 
                size="icon" 
                className="absolute right-0 top-0 h-full"
              >
                <Search className="h-4 w-4" />
                <span className="sr-only">Search</span>
              </Button>
            </form>
          </div>
          
          {/* Mobile search bar - expands when clicked */}
          <div className="relative md:hidden">
            {isSearchOpen ? (
              <form onSubmit={handleSearch} className="absolute right-0 top-1/2 -translate-y-1/2 flex w-[calc(100vw-8rem)] max-w-[16rem] z-10">
                <Input
                  type="search"
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-16"
                  autoFocus
                />
                <div className="absolute right-0 flex">
                  <Button 
                    type="submit" 
                    variant="ghost" 
                    size="icon" 
                    className="h-full"
                  >
                    <Search className="h-4 w-4" />
                    <span className="sr-only">Search</span>
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="h-full"
                    onClick={() => setIsSearchOpen(false)}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </Button>
                </div>
              </form>
            ) : (
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => setIsSearchOpen(true)}
              >
                <Search className="h-4 w-4" />
                <span className="sr-only">Search</span>
              </Button>
            )}
          </div>
          
          {/* Auth state dependent UI */}
          {isLoading ? (
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse"></div>
          ) : isAuthenticated ? (
            <UserNav />
          ) : (
            <div className="flex items-center gap-1 sm:gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
                  Log in
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="text-xs sm:text-sm">
                  Sign up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
      
      {/* Mobile menu dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-background border-t border-b py-2">
          <nav className="container flex flex-col space-y-2">
            <Link 
              to="/courses" 
              className="px-4 py-2 hover:bg-accent rounded-md" 
              onClick={handleMobileNavClick}
            >
              Courses
            </Link>
            <Link 
              to="/categories" 
              className="px-4 py-2 hover:bg-accent rounded-md" 
              onClick={handleMobileNavClick}
            >
              Categories
            </Link>
            {isAuthenticated && user?.userType === "Instructor" && (
              <Link 
                to="/instructor/dashboard" 
                className="px-4 py-2 hover:bg-accent rounded-md" 
                onClick={handleMobileNavClick}
              >
                Instructor Dashboard
              </Link>
            )}
            {isAuthenticated && user?.userType === "Admin" && (
              <Link 
                to="/admin/dashboard" 
                className="px-4 py-2 hover:bg-accent rounded-md" 
                onClick={handleMobileNavClick}
              >
                Admin Dashboard
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
