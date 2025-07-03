import React from 'react';
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layouts/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, XCircle, Users, BookOpen, TrendingUp, Settings, RefreshCw, Tag } from "lucide-react";
import { useState, useEffect } from "react";
import { CourseService } from "@/services/course-service";
import { AdminService } from "@/services/admin-service";

export default function AdminDashboard() {
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [adminStats, setAdminStats] = useState({
    totalCourses: 0,
    activeCourses: 0,
    totalInstructors: 0,
    totalEnrollments: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);
  const loadAdminData = async () => {
    try {
      setLoading(true);
      
      const stats = await AdminService.getAdminStatistics();
      
      
      setPendingCount(stats.pendingCourses);
      setAdminStats({
        totalCourses: stats.totalCourses,
        activeCourses: stats.activeCourses,
        totalInstructors: stats.totalInstructors,
        totalEnrollments: stats.totalEnrollments
      });
      
      
    } catch (error) {
      console.error("Error loading admin data:", error);
    } finally {
      setLoading(false);
    }
  };const adminActions = [
    {
      title: "Pending Course Approvals",
      description: "Review and approve new course submissions from instructors",
      icon: Clock,
      href: "/admin/pending-courses",
      badge: pendingCount > 0 ? pendingCount : null,
      badgeVariant: "destructive" as const,
      color: "border-yellow-200 hover:border-yellow-300 bg-yellow-50 hover:bg-yellow-100"
    },
    {
      title: "User Management",
      description: "Manage user accounts, roles, and permissions. Create new admin accounts.",
      icon: Users,
      href: "/admin/users",
      color: "border-blue-200 hover:border-blue-300 bg-blue-50 hover:bg-blue-100"
    },
    {
      title: "Course Management",
      description: "View, manage, and moderate all courses on the platform",
      icon: BookOpen,
      href: "/admin/courses",
      color: "border-indigo-200 hover:border-indigo-300 bg-indigo-50 hover:bg-indigo-100"
    },
    {
      title: "Category Management",
      description: "Manage course categories and organize content structure",
      icon: Tag,
      href: "/dashboard/admin/categories",
      color: "border-green-200 hover:border-green-300 bg-green-50 hover:bg-green-100"
    },
    {
      title: "Course Analytics",
      description: "View course performance metrics and enrollment statistics",
      icon: TrendingUp,
      href: "/admin/analytics",
      color: "border-green-200 hover:border-green-300 bg-green-50 hover:bg-green-100"
    },
    {
      title: "Platform Settings",
      description: "Configure system settings and platform preferences",
      icon: Settings,
      href: "/admin/settings",
      color: "border-purple-200 hover:border-purple-300 bg-purple-50 hover:bg-purple-100"
    }
  ];  const quickStats = [
    {
      title: "Pending Reviews",
      value: loading ? "..." : pendingCount.toString(),
      icon: Clock,
      color: "text-yellow-600",
      description: "Courses awaiting approval"
    },
    {
      title: "Active Courses",
      value: loading ? "..." : adminStats.activeCourses.toString(),
      icon: BookOpen,
      color: "text-blue-600",
      description: "Published courses"
    },
    {
      title: "Total Instructors",
      value: loading ? "..." : adminStats.totalInstructors.toString(),
      icon: Users,
      color: "text-green-600",
      description: "Registered instructors"
    },
    {
      title: "Total Enrollments",
      value: loading ? "..." : adminStats.totalEnrollments.toString(),
      icon: TrendingUp,
      color: "text-purple-600",
      description: "Student enrollments"
    }
  ];
  return (
    <MainLayout>
      <div className="container mx-auto py-8 px-4">        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground mt-2">
                Manage and monitor your learning platform
              </p>
            </div>
            <Button 
              onClick={loadAdminData} 
              variant="outline" 
              size="sm"
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
          </div>
        </div>      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {quickStats.map((stat, index) => (
          <Card key={index} className={index === 0 && pendingCount > 0 ? "border-yellow-300 bg-yellow-50" : ""}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className={`text-2xl font-bold ${index === 0 && pendingCount > 0 ? 'text-yellow-700' : ''}`}>
                    {stat.value}
                    {index === 0 && pendingCount > 0 && (
                      <Badge variant="destructive" className="ml-2 text-xs">
                        Action Required
                      </Badge>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color} ${index === 0 && pendingCount > 0 ? 'animate-pulse' : ''}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Admin Actions */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Admin Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {adminActions.map((action, index) => (
            <Card key={index} className={`transition-colors ${action.color}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <action.icon className="h-6 w-6" />
                    <CardTitle className="text-lg">{action.title}</CardTitle>
                  </div>
                  {action.badge && (
                    <Badge variant={action.badgeVariant}>
                      {action.badge}
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-sm">
                  {action.description}
                </CardDescription>
              </CardHeader>              <CardContent className="pt-0">
                <Button asChild className="w-full">
                  <Link to={action.href}>
                    Access {action.title}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Priority Actions */}
      {pendingCount > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <CardTitle className="text-yellow-800">Action Required</CardTitle>
            </div>
            <CardDescription className="text-yellow-700">
              You have {pendingCount} course{pendingCount !== 1 ? 's' : ''} pending approval that require your attention.
            </CardDescription>
          </CardHeader>
          <CardContent>            <Button asChild className="bg-yellow-600 hover:bg-yellow-700">
              <Link to="/admin/pending-courses">
                Review Pending Courses
              </Link>
            </Button>
          </CardContent>        </Card>
      )}
    </div>
    </MainLayout>
  );
}
