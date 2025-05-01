import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NavBar } from '@/components/navigation/navbar';
import { Footer } from '@/components/navigation/footer';
import { Button } from '@/components/ui/button';
import { Layers, Users, BookOpen, Settings, Tag, Menu, X, ChevronRight, Home } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const sidebarItems = [
    {
      title: 'Dashboard',
      href: '/admin/dashboard',
      icon: Layers
    },
    {
      title: 'Categories',
      href: '/dashboard/admin/categories',
      icon: Tag
    },
    {
      title: 'Courses',
      href: '/dashboard/admin/courses',
      icon: BookOpen
    },
    {
      title: 'Users',
      href: '/dashboard/admin/users',
      icon: Users
    },
    {
      title: 'Settings',
      href: '/dashboard/admin/settings',
      icon: Settings
    }
  ];

  // Function to generate breadcrumbs based on current path
  const generateBreadcrumbs = () => {
    const pathnames = location.pathname.split('/').filter(x => x);
    let breadcrumbs = [];
    let path = '';
    
    // Add Home
    breadcrumbs.push({
      name: 'Home',
      path: '/',
      icon: Home
    });
    
    // Add Admin Dashboard
    if (pathnames.includes('admin')) {
      breadcrumbs.push({
        name: 'Admin',
        path: '/admin/dashboard',
        icon: Layers
      });
    }
    
    // Add Category management
    if (pathnames.includes('categories')) {
      breadcrumbs.push({
        name: 'Categories',
        path: '/dashboard/admin/categories',
        icon: Tag
      });
    }
    
    // Can add more section-specific breadcrumbs here later
    
    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  const SidebarContent = () => (
    <div className="space-y-1">
      <h2 className="text-lg font-semibold mb-4">Admin Panel</h2>
      {sidebarItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.href;
        
        return (
          <Link 
            to={item.href} 
            key={item.href}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Button 
              variant={isActive ? "default" : "ghost"}
              className="w-full justify-start mb-1"
            >
              <Icon className="mr-2 h-4 w-4" />
              {item.title}
            </Button>
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <div className="flex-1 flex">
        {/* Desktop Sidebar */}
        <div className="hidden md:block w-64 border-r bg-muted/30 p-6">
          <SidebarContent />
        </div>
        
        {/* Main content container */}
        <div className="flex-1 flex flex-col">
          {/* Mobile Sidebar Button and Breadcrumbs */}
          <div className="p-4 flex items-center border-b">
            <div className="md:hidden mr-4">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64">
                  <SidebarContent />
                </SheetContent>
              </Sheet>
            </div>
            
            {/* Breadcrumbs */}
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((crumb, index) => {
                  const Icon = crumb.icon;
                  const isLast = index === breadcrumbs.length - 1;
                  
                  return (
                    <React.Fragment key={crumb.path}>
                      <BreadcrumbItem>
                        {isLast ? (
                          <span className="flex items-center font-medium">
                            <Icon className="h-3 w-3 mr-1" />
                            {crumb.name}
                          </span>
                        ) : (
                          <BreadcrumbLink asChild>
                            <Link to={crumb.path} className="flex items-center">
                              <Icon className="h-3 w-3 mr-1" />
                              {crumb.name}
                            </Link>
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      
                      {!isLast && <BreadcrumbSeparator>
                        <ChevronRight className="h-3 w-3" />
                      </BreadcrumbSeparator>}
                    </React.Fragment>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          
          {/* Page content */}
          <div className="flex-1 p-6">
            {children}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};