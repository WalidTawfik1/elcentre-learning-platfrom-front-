import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/hooks/use-auth"
import { Link, useNavigate } from "react-router-dom"
import { UserCircle, LogOut, BookOpen, Gauge, User, GraduationCap } from "lucide-react"

export function UserNav() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  
  // Create initials from first and last name if available
  const getInitials = () => {
    if (!user) return "U";
    
    if (user.firstName && user.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    
    if (user.name) {
      return user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();
    }
    
    return "U";
  };
  
  // Full name from first and last name
  const fullName = user ? 
    (user.firstName && user.lastName ? 
      `${user.firstName} ${user.lastName}` : 
      user.name || "User") : 
    "User";
  
  // Handle logout with redirect to home page
  const handleLogout = async () => {
    try {
      // Uses the /Account/logout endpoint through AuthService
      await logout();
      
      // Force redirect to home after logout
      navigate('/');
      
      // Force page reload to clear any cached state
      window.location.reload();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9 border border-primary/10">
            <AvatarImage src={user?.avatar} alt={fullName} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{fullName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
            {user?.userType && (
              <p className="text-xs text-muted-foreground mt-1">
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[10px] font-medium">
                  {user.userType}
                </span>
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {user?.userType === "Instructor" && (
            <DropdownMenuItem asChild>
              <Link to="/instructor/dashboard" className="flex items-center w-full text-gray-600 hover:bg-blue-500/10 hover:text-gray-900 focus:bg-blue-500/10 focus:text-gray-900">
                <Gauge className="w-4 h-4 mr-2" />
                <span>Instructor Dashboard</span>
              </Link>
            </DropdownMenuItem>
          )}
          {user?.userType === "Student" && (
            <DropdownMenuItem asChild>
              <Link to="/dashboard" className="flex items-center w-full text-gray-600 hover:bg-blue-500/10 hover:text-gray-900 focus:bg-blue-500/10 focus:text-gray-900">
                <Gauge className="w-4 h-4 mr-2" />
                <span>Dashboard</span>
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <Link to="/profile" className="flex items-center w-full text-gray-600 hover:bg-blue-500/10 hover:text-gray-900 focus:bg-blue-500/10 focus:text-gray-900">
              <User className="w-4 h-4 mr-2" />
              <span>My Profile</span>
            </Link>
          </DropdownMenuItem>
          {user?.userType === "Instructor" && (
            <DropdownMenuItem asChild>
              <Link to="/instructor/courses" className="flex items-center w-full text-gray-600 hover:bg-blue-500/10 hover:text-gray-900 focus:bg-blue-500/10 focus:text-gray-900">
                <BookOpen className="w-4 h-4 mr-2" />
                <span>My Courses</span>
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <Link to="/my-courses" className="flex items-center w-full text-gray-600 hover:bg-blue-500/10 hover:text-gray-900 focus:bg-blue-500/10 focus:text-gray-900">
              <GraduationCap className="w-4 h-4 mr-2" />
              <span>My Enrollments</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleLogout}           
        >
          <LogOut className="w-4 h-4 mr-2" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
