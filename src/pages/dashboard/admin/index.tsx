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
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Categories</h3>
                <div className="flex items-center">
                  <Tag className="h-5 w-5 mr-2 text-blue-500" />
                  <div className="text-3xl font-bold text-gray-900">{totalCategories}</div>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-3 flex justify-end">
              <Link to="/dashboard/admin/categories">
                <Button size="sm" variant="outline">Manage</Button>
              </Link>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Total Courses</h3>
                <div className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-emerald-500" />
                  <div className="text-3xl font-bold text-gray-900">{totalCourses}</div>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">Active: {activeCourses}</span>
                <span className="text-gray-900 font-medium">{courseActivationRate}%</span>
              </div>
              <Progress value={courseActivationRate} className="h-1" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Quick Actions</h3>
              </div>
            </div>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/admin/courses">
                  <BookOpen className="h-4 w-4 mr-2" /> Manage Courses
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/admin/coupon-management">
                  <Tag className="h-4 w-4 mr-2" /> Coupon Codes
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/dashboard/admin/create-admin">
                  <Plus className="h-4 w-4 mr-2" /> Create Admin Account
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/admin/users">
                  <Users className="h-4 w-4 mr-2" /> User Management
                </Link>
              </Button>
            </div>
          </div>
        </div>
          {/* Admin Modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-md border border-gray-100 transition-all duration-200 hover:shadow-lg h-full flex flex-col">
            <div className="p-6 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <Tag className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-gray-900">Categories</h3>
              </div>
              <p className="text-sm text-gray-500">Manage course categories</p>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex-1 min-h-[3rem] mb-4">
                <p className="text-sm text-gray-600">Add, update, or remove course categories</p>
              </div>
              <div className="mt-auto">
                <Link to="/dashboard/admin/categories">
                  <Button variant="default">Manage Categories</Button>
                </Link>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md border border-gray-100 transition-all duration-200 hover:shadow-lg h-full flex flex-col">
            <div className="p-6 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-gray-900">Admin Accounts</h3>
              </div>
              <p className="text-sm text-gray-500">Create new admin users</p>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex-1 min-h-[3rem] mb-4">
                <p className="text-sm text-gray-600">Add new administrators to the platform</p>
              </div>
              <div className="mt-auto">
                <Link to="/dashboard/admin/create-admin">
                  <Button variant="default">Create Admin Account</Button>
                </Link>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md border border-gray-100 transition-all duration-200 hover:shadow-lg h-full flex flex-col">
            <div className="p-6 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
              </div>
              <p className="text-sm text-gray-500">Manage users and admin accounts</p>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex-1 min-h-[3rem] mb-4">
                <p className="text-sm text-gray-600">View users, create admin accounts, and manage user roles</p>
              </div>
              <div className="mt-auto">
                <Link to="/admin/users">
                  <Button variant="default">Manage Users</Button>
                </Link>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md border border-gray-100 transition-all duration-200 hover:shadow-lg h-full flex flex-col">
            <div className="p-6 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-gray-900">Courses</h3>
              </div>
              <p className="text-sm text-gray-500">Manage all courses</p>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex-1 min-h-[3rem] mb-4">
                <p className="text-sm text-gray-600">Review, edit or delete courses</p>
              </div>
              <div className="mt-auto">
                <Link to="/admin/courses">
                  <Button variant="default">Manage Courses</Button>
                </Link>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md border border-gray-100 transition-all duration-200 hover:shadow-lg h-full flex flex-col">
            <div className="p-6 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <Tag className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-gray-900">Coupon Codes</h3>
              </div>
              <p className="text-sm text-gray-500">Manage discount coupons</p>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex-1 min-h-[3rem] mb-4">
                <p className="text-sm text-gray-600">Create and manage discount codes for courses</p>
              </div>
              <div className="mt-auto">
                <Link to="/admin/coupon-management">
                  <Button variant="default">Manage Coupons</Button>
                </Link>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md border border-gray-100 transition-all duration-200 hover:shadow-lg h-full flex flex-col">
            <div className="p-6 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-gray-900">Settings</h3>
              </div>
              <p className="text-sm text-gray-500">System configuration</p>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex-1 min-h-[3rem] mb-4">
                <p className="text-sm text-gray-600">Configure system settings</p>
              </div>
              <div className="mt-auto">
                <Button variant="outline">Coming Soon</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;