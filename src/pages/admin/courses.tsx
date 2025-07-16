import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layouts/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Search, 
  Filter, 
  RefreshCw, 
  BookOpen, 
  DollarSign, 
  Star, 
  Users, 
  ChevronLeft, 
  ChevronRight, 
  Trash2,
  Edit,
  Eye,
  Plus,
  GraduationCap,
  TrendingUp,
  Archive
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { AdminService } from "@/services/admin-service";
import { CategoryService } from "@/services/category-service";
import { getImageUrl } from "@/config/api-config";
import { useToast } from "@/hooks/use-toast";

interface AdminCourse {
  id: number;
  title: string;
  description: string;
  price: number;
  thumbnail: string;
  isActive: boolean;
  isDeleted: boolean;
  durationInHours: number;
  categoryId: number;
  categoryName?: string;
  rating?: number;
  instructorId?: string;
  instructorName?: string;
  instructorImage?: string;
  enrollmentCount?: number;
  courseStatus?: string;
  createdAt?: string;
}

interface CoursesResponse {
  courses: AdminCourse[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

interface Category {
  id: number;
  name: string;
}

export default function CoursesManagement() {
  const [coursesData, setCoursesData] = useState<CoursesResponse>({
    courses: [],
    totalCount: 0,
    currentPage: 1,
    totalPages: 0
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortFilter, setSortFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("active"); // New filter for active/deleted
  const [currentPage, setCurrentPage] = useState(1);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]); // Changed to use slider with higher max
  const pageSize = 20; // Fixed page size
  const [deletingCourseId, setDeletingCourseId] = useState<number | null>(null);
  const [undeletingCourseId, setUndeletingCourseId] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Load categories once
    loadCategories();
    
    // Add a small delay to ensure component is properly mounted
    const timeoutId = setTimeout(() => {
      loadCourses();
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [currentPage, sortFilter, categoryFilter, statusFilter]);

  // Separate effect for search term and price filters with debounce
  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (searchTerm !== "" || priceRange[0] > 0 || priceRange[1] < 5000) {
        setCurrentPage(1);
        loadCourses();
      }
    }, 500);

    return () => clearTimeout(debounceTimeout);
  }, [searchTerm, priceRange]);

  const loadCategories = async () => {
    try {
      const categoriesResponse = await CategoryService.getAllCategories();
      setCategories(categoriesResponse || []);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const loadCourses = async () => {
    try {
      setLoading(true);
      
      const params: any = {
        pagenum: currentPage,
        pagesize: pageSize,
        Maxpagesize: 50
      };

      if (sortFilter && sortFilter !== "all") {
        params.sort = sortFilter;
      }

      if (categoryFilter && categoryFilter !== "all") {
        params.categoryId = parseInt(categoryFilter);
      }

      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      if (priceRange[0] > 0) {
        params.minPrice = priceRange[0];
      }

      if (priceRange[1] < 5000) {
        params.maxPrice = priceRange[1];
      }

      const response = await AdminService.getAllCoursesForAdmin(params);
      setCoursesData(response);
    } catch (error) {
      console.error("Error loading courses:", error);
      toast({
        title: "Error",
        description: "Failed to load courses. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId: number) => {
    try {
      setDeletingCourseId(courseId);
      const success = await AdminService.deleteCourse(courseId);
      
      if (success) {
        toast({
          title: "Success",
          description: "Course has been moved to trash successfully.",
        });
        // Reload courses to reflect changes
        await loadCourses();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete course. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error deleting course:", error);
      toast({
        title: "Error",
        description: `Failed to delete course. ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        variant: "destructive"
      });
    } finally {
      setDeletingCourseId(null);
    }
  };

  const handleUndeleteCourse = async (courseId: number) => {
    try {
      setUndeletingCourseId(courseId);
      const success = await AdminService.undeleteCourse(courseId);
      
      if (success) {
        toast({
          title: "Success",
          description: "Course has been restored successfully.",
        });
        // Reload courses to reflect changes
        await loadCourses();
      } else {
        toast({
          title: "Error",
          description: "Failed to restore course. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error restoring course:", error);
      toast({
        title: "Error",
        description: `Failed to restore course. ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        variant: "destructive"
      });
    } finally {
      setUndeletingCourseId(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
    loadCourses();
  };

  const handleSortChange = (value: string) => {
    setSortFilter(value);
    setCurrentPage(1); // Reset to first page when changing filter
  };

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
    setCurrentPage(1); // Reset to first page when changing filter
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1); // Reset to first page when changing filter
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSortFilter("all");
    setCategoryFilter("all");
    setStatusFilter("active");
    setPriceRange([0, 5000]);
    setCurrentPage(1);
  };

  // Handle price range change from slider
  const handlePriceChange = (range: [number, number]) => {
    setPriceRange(range);
    setCurrentPage(1); // Reset to page 1 when changing price
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} EGP`;
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Course Management</h1>
              <p className="text-muted-foreground mt-2">
                Manage all courses, view statistics, and moderate content
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={loadCourses} 
                variant="outline" 
                size="sm"
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <BookOpen className="h-6 w-6 text-blue-600" />
                <CardTitle className="text-lg">Total Courses</CardTitle>
              </div>
              <CardDescription className="text-2xl font-bold text-blue-600">
                {loading ? "..." : coursesData.totalCount || 0}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-green-200 bg-green-50 hover:bg-green-100 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <GraduationCap className="h-6 w-6 text-green-600" />
                <CardTitle className="text-lg">Active Courses</CardTitle>
              </div>
              <CardDescription className="text-2xl font-bold text-green-600">
                {loading ? "..." : (coursesData.courses || []).filter(c => c.isActive && !c.isDeleted).length}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-red-200 bg-red-50 hover:bg-red-100 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Archive className="h-6 w-6 text-red-600" />
                <CardTitle className="text-lg">Deleted Courses</CardTitle>
              </div>
              <CardDescription className="text-2xl font-bold text-red-600">
                {loading ? "..." : (coursesData.courses || []).filter(c => c.isDeleted).length}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-orange-200 bg-orange-50 hover:bg-orange-100 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-6 w-6 text-orange-600" />
                <CardTitle className="text-lg">Avg. Rating</CardTitle>
              </div>
              <CardDescription className="text-2xl font-bold text-orange-600">
                {loading ? "..." : (
                  () => {
                    const ratings = (coursesData.courses || []).filter(c => c.rating && c.rating > 0 && !c.isDeleted);
                    if (ratings.length === 0) return "N/A";
                    const avg = ratings.reduce((sum, course) => sum + (course.rating || 0), 0) / ratings.length;
                    return avg.toFixed(1);
                  }
                )()}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filter Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={sortFilter} onValueChange={handleSortChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  <SelectItem value="PriceAsc">Price (Low to High)</SelectItem>
                  <SelectItem value="PriceDesc">Price (High to Low)</SelectItem>
                  <SelectItem value="Rating">Rating</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={handleCategoryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active Courses</SelectItem>
                  <SelectItem value="deleted">Deleted Courses</SelectItem>
                  <SelectItem value="all">All Courses</SelectItem>
                </SelectContent>
              </Select>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Price Range</label>
                  <div className="px-2">
                    <Slider
                      defaultValue={[0, 5000]}
                      min={0}
                      max={5000}
                      step={50}
                      value={priceRange}
                      onValueChange={handlePriceChange}
                      className="mb-4"
                    />
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{priceRange[0]} EGP</span>
                      <span>{priceRange[1] >= 5000 ? '5000 EGP' : `${priceRange[1]} EGP`}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Button type="submit" variant="default">
                Search
              </Button>
              
              <Button 
                type="button"
                variant="outline" 
                onClick={clearFilters}
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Courses Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Courses</CardTitle>
            <CardDescription>
              {loading ? "Loading courses..." : 
                `Showing ${(coursesData.courses || []).filter((course) => {
                  if (statusFilter === "active") return !course.isDeleted;
                  if (statusFilter === "deleted") return course.isDeleted;
                  return true;
                }).length} ${statusFilter === "all" ? "" : statusFilter} courses on page ${currentPage}`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-16 w-16 rounded" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-4 w-1/5" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </div>
            ) : (!coursesData.courses || coursesData.courses.length === 0) ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No courses found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || sortFilter !== "all" || categoryFilter !== "all" || statusFilter !== "active" || priceRange[0] > 0 || priceRange[1] < 5000
                    ? "Try adjusting your filters"
                    : "No courses have been created yet"}
                </p>
                {(searchTerm || sortFilter !== "all" || categoryFilter !== "all" || statusFilter !== "active" || priceRange[0] > 0 || priceRange[1] < 5000) && (
                  <Button 
                    variant="outline" 
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Course</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Instructor</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Enrollments</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(coursesData.courses || [])
                        .filter((course) => {
                          if (statusFilter === "active") return !course.isDeleted;
                          if (statusFilter === "deleted") return course.isDeleted;
                          return true; // "all" shows everything
                        })
                        .map((course) => (
                        <TableRow key={course.id} className={course.isDeleted ? "opacity-60 bg-red-50" : ""}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-12 rounded border bg-muted flex items-center justify-center overflow-hidden">
                                {course.thumbnail ? (
                                  <img 
                                    src={getImageUrl(course.thumbnail)} 
                                    alt={course.title}
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.src = "/placeholder.svg";
                                    }}
                                  />
                                ) : (
                                  <BookOpen className="h-6 w-6 text-muted-foreground" />
                                )}
                              </div>
                              <div className="max-w-[200px]">
                                <div className="font-medium truncate">
                                  {course.title}
                                  {course.isDeleted && (
                                    <Badge variant="destructive" className="ml-2 text-xs">
                                      Deleted
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {course.durationInHours}h duration
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{course.categoryName || 'Unknown'}</TableCell>
                          <TableCell>{course.instructorName || 'Unknown'}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4 text-green-600" />
                              {formatPrice(course.price)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {course.rating ? (
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                <span className="text-sm">{course.rating.toFixed(1)}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">No rating</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4 text-blue-600" />
                              {course.enrollmentCount || 0}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Badge variant={course.isActive ? "default" : "secondary"}>
                                {course.isActive ? "Active" : "Inactive"}
                              </Badge>
                              {course.courseStatus && (
                                <Badge variant={getStatusBadgeVariant(course.courseStatus)}>
                                  {course.courseStatus}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              {!course.isDeleted && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  asChild
                                >
                                  <Link to={`/courses/${course.id}`}>
                                    <Eye className="h-4 w-4" />
                                  </Link>
                                </Button>
                              )}
                              
                              {course.isDeleted ? (
                                // Undelete button for deleted courses
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      variant="default" 
                                      size="sm"
                                      disabled={undeletingCourseId === course.id}
                                    >
                                      {undeletingCourseId === course.id ? (
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <RefreshCw className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Restore Course</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to restore the course "{course.title}"? This will make it visible to students again.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleUndeleteCourse(course.id)}
                                        className="bg-green-600 hover:bg-green-700"
                                      >
                                        Restore Course
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              ) : (
                                // Delete button for active courses
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      variant="destructive" 
                                      size="sm"
                                      disabled={deletingCourseId === course.id}
                                    >
                                      {deletingCourseId === course.id ? (
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Trash2 className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Move to Trash</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to move the course "{course.title}" to trash? This will hide it from students but you can restore it later.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteCourse(course.id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Move to Trash
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex justify-center mt-6">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1 || loading}
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                    
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <span>Page {currentPage}</span>
                      <span>•</span>
                      <span>Showing {(coursesData.courses || []).length} courses</span>
                      {coursesData.totalCount && (
                        <>
                          <span>•</span>
                          <span>{coursesData.totalCount} total</span>
                        </>
                      )}
                    </div>
                    
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={loading || (coursesData.courses || []).length < pageSize}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
