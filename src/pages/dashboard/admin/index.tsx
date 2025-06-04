import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminLayout } from '@/components/layouts/admin-layout';
import { useQuery } from '@tanstack/react-query';
import { CategoryService } from '@/services/category-service';
import { CourseService } from '@/services/course-service';
import { Tag, BookOpen, Users, Settings, Plus } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/use-auth';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();

  // Fetch data for dashboard overview
  const { data: categories = [] } = useQuery({
    queryKey: ['adminDashboardCategories'],
    queryFn: CategoryService.getAllCategories
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['adminDashboardCourses'],
    queryFn: async () => {
      try {
        const result = await CourseService.getAllCourses(1, 100);  // Get up to 100 courses for stats
        return result?.data || [];
      } catch (error) {
        console.error("Failed to fetch courses:", error);
        return [];
      }
    }
  });

  // Calculate some statistics
  const totalCategories = categories.length;
  const totalCourses = courses.length;
  const activeCourses = courses.filter((course: any) => course.isActive).length;
  const courseActivationRate = totalCourses > 0 ? Math.round((activeCourses / totalCourses) * 100) : 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div>
            <span className="text-sm text-muted-foreground mr-2">Welcome,</span>
            <span className="font-medium">{user?.firstName} {user?.lastName}</span>
          </div>
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Tag className="h-5 w-5 mr-2 text-primary" />
                <div className="text-3xl font-bold">{totalCategories}</div>
              </div>
              <div className="mt-4 flex justify-end">
                <Link to="/dashboard/admin/categories">
                  <Button size="sm" variant="outline">Manage</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Courses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <BookOpen className="h-5 w-5 mr-2 text-emerald-500" />
                <div className="text-3xl font-bold">{totalCourses}</div>
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span>Active: {activeCourses}</span>
                  <span>{courseActivationRate}%</span>
                </div>
                <Progress value={courseActivationRate} className="h-1" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/dashboard/admin/categories">
                    <Tag className="h-4 w-4 mr-2" /> Manage Categories
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/dashboard/admin/create-admin">
                    <Plus className="h-4 w-4 mr-2" /> Create Admin Account
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
          {/* Admin Modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex-shrink-0">
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" />
                <CardTitle>Categories</CardTitle>
              </div>
              <CardDescription>Manage course categories</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="flex-1 min-h-[3rem] mb-4">
                <p>Add, update, or remove course categories</p>
              </div>
              <div className="mt-auto">
                <Link to="/dashboard/admin/categories">
                  <Button variant="default">Manage Categories</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          <Card className="h-full flex flex-col">
            <CardHeader className="flex-shrink-0">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle>Admin Accounts</CardTitle>
              </div>
              <CardDescription>Create new admin users</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="flex-1 min-h-[3rem] mb-4">
                <p>Add new administrators to the platform</p>
              </div>
              <div className="mt-auto">
                <Link to="/dashboard/admin/create-admin">
                  <Button variant="default">Create Admin Account</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          <Card className="h-full flex flex-col">
            <CardHeader className="flex-shrink-0">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <CardTitle>Courses</CardTitle>
              </div>
              <CardDescription>Manage all courses</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="flex-1 min-h-[3rem] mb-4">
                <p>Review, edit or delete courses</p>
              </div>
              <div className="mt-auto">
                <Button variant="outline">Coming Soon</Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="h-full flex flex-col">
            <CardHeader className="flex-shrink-0">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                <CardTitle>Settings</CardTitle>
              </div>
              <CardDescription>System configuration</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="flex-1 min-h-[3rem] mb-4">
                <p>Configure system settings</p>
              </div>
              <div className="mt-auto">
                <Button variant="outline">Coming Soon</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;