import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Tag, 
  BookOpen, 
  Users, 
  ShieldCheck, 
  BarChart3, 
  Settings,
  PlusCircle
} from "lucide-react";

export function AdminQuickActions() {
  return (
    <section className="py-12 container">
      <div className="border-b mb-6 pb-4">
        <h2 className="text-2xl font-bold">Admin Quick Actions</h2>
        <p className="text-muted-foreground">Quick access to essential admin functions</p>
      </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Categories Management */}
        <Card className="hover:shadow-md transition-shadow h-full">
          <CardContent className="p-6 h-full flex flex-col">
            <div className="flex items-center mb-4 flex-shrink-0">
              <div className="p-2 rounded-full bg-orange-100 text-orange-600 mr-4">
                <Tag className="h-6 w-6" />
              </div>
              <div className="min-h-[3rem] flex flex-col justify-center">
                <h3 className="font-medium text-lg">Categories</h3>
                <p className="text-muted-foreground text-sm">Manage course categories</p>
              </div>
            </div>
            <div className="mt-auto">
              <Button asChild className="w-full">
                <Link to="/dashboard/admin/categories">Manage Categories</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Course Management */}
        <Card className="hover:shadow-md transition-shadow h-full">
          <CardContent className="p-6 h-full flex flex-col">
            <div className="flex items-center mb-4 flex-shrink-0">
              <div className="p-2 rounded-full bg-blue-100 text-blue-600 mr-4">
                <BookOpen className="h-6 w-6" />
              </div>
              <div className="min-h-[3rem] flex flex-col justify-center">
                <h3 className="font-medium text-lg">Courses</h3>
                <p className="text-muted-foreground text-sm">Review and manage courses</p>
              </div>
            </div>
            <div className="mt-auto">
              <Button asChild className="w-full" variant="outline">
                <Link to="/dashboard/admin">View All Courses</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Admin Users */}
        <Card className="hover:shadow-md transition-shadow h-full">
          <CardContent className="p-6 h-full flex flex-col">
            <div className="flex items-center mb-4 flex-shrink-0">
              <div className="p-2 rounded-full bg-purple-100 text-purple-600 mr-4">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div className="min-h-[3rem] flex flex-col justify-center">
                <h3 className="font-medium text-lg">Admin Users</h3>
                <p className="text-muted-foreground text-sm">Create new admin accounts</p>
              </div>
            </div>
            <div className="mt-auto">
              <Button asChild className="w-full">
                <Link to="/dashboard/admin/create-admin">Create Admin</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}