import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layouts/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Users, Search, Filter, RefreshCw, Shield, GraduationCap, BookOpen, ChevronLeft, ChevronRight, Ban, UserCheck, Globe } from "lucide-react";
import { AdminService } from "@/services/admin-service";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { getCountryName } from "@/components/ui/country-select";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  userType: 'Student' | 'Instructor' | 'Admin';
  isActive: boolean;
  createdAt: string;
  phoneNumber?: string;
  country?: string;
}

interface UsersResponse {
  users: User[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export default function UsersManagement() {
  const [usersData, setUsersData] = useState<UsersResponse>({
    users: [],
    totalCount: 0,
    currentPage: 1,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortFilter, setSortFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20; // Fixed page size
  const [blockingUserId, setBlockingUserId] = useState<string | null>(null);

  useEffect(() => {
    // Add a small delay to ensure component is properly mounted
    const timeoutId = setTimeout(() => {
      loadUsers();
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [currentPage, sortFilter]);

  // Separate effect for search term with debounce
  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (searchTerm !== "") {
        setCurrentPage(1);
        loadUsers();
      }
    }, 500);

    return () => clearTimeout(debounceTimeout);
  }, [searchTerm]);

  const loadUsers = async () => {
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

      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      const response = await AdminService.getAllUsers(params);
      setUsersData(response);
    } catch (error) {
      console.error("Error loading users:", error);
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUnblockUser = async (userId: string, block: boolean) => {
    try {
      setBlockingUserId(userId);
      const success = await AdminService.blockUnblockUser(userId, block);
      
      if (success) {
        toast({
          title: "Success",
          description: `User has been ${block ? 'blocked' : 'unblocked'} successfully.`,
        });
        // Reload users to reflect changes
        await loadUsers();
      } else {
        toast({
          title: "Endpoint Not Available",
          description: `The block/unblock endpoint is not implemented on the server yet. Please ensure the backend has the endpoint: POST /Account/block-user/{userId}?block=true/false`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error blocking/unblocking user:", error);
      toast({
        title: "Error",
        description: `Failed to ${block ? 'block' : 'unblock'} user. ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        variant: "destructive"
      });
    } finally {
      setBlockingUserId(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
    loadUsers();
  };

  const handleSortChange = (value: string) => {
    setSortFilter(value);
    setCurrentPage(1); // Reset to first page when changing filter
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSortFilter("all");
    setCurrentPage(1);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Admin':
        return <Shield className="h-4 w-4" />;
      case 'Instructor':
        return <GraduationCap className="h-4 w-4" />;
      case 'Student':
        return <BookOpen className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'destructive';
      case 'Instructor':
        return 'default';
      case 'Student':
        return 'secondary';
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
              <h1 className="text-3xl font-bold">User Management</h1>
              <p className="text-muted-foreground mt-2">
                Manage user accounts and administrator access
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={loadUsers} 
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <UserPlus className="h-6 w-6 text-blue-600" />
                <CardTitle className="text-lg">Create Admin Account</CardTitle>
              </div>
              <CardDescription className="text-sm">
                Add new administrators to the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button asChild className="w-full">
                <Link to="/dashboard/admin/create-admin">
                  Create New Admin
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50 hover:bg-green-100 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-green-600" />
                <CardTitle className="text-lg">Category Management</CardTitle>
              </div>
              <CardDescription className="text-sm">
                Manage course categories and organization
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button asChild className="w-full" variant="outline">
                <Link to="/dashboard/admin/categories">
                  Manage Categories
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50 hover:bg-purple-100 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-purple-600" />
                <CardTitle className="text-lg">User Statistics</CardTitle>
              </div>
              <CardDescription className="text-sm">
                {loading ? "Loading..." : `${usersData.totalCount || 0} total users registered`}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-lg font-bold text-red-600">
                    {loading ? "..." : (usersData.users || []).filter(u => u.userType === 'Admin').length}
                  </div>
                  <div className="text-xs text-muted-foreground">Admins</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-600">
                    {loading ? "..." : (usersData.users || []).filter(u => u.userType === 'Instructor').length}
                  </div>
                  <div className="text-xs text-muted-foreground">Instructors</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-green-600">
                    {loading ? "..." : (usersData.users || []).filter(u => u.userType === 'Student').length}
                  </div>
                  <div className="text-xs text-muted-foreground">Students</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filter Users</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
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
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="Admin">Admins Only</SelectItem>
                  <SelectItem value="Instructor">Instructors Only</SelectItem>
                  <SelectItem value="Student">Students Only</SelectItem>
                  <SelectItem value="Active">Active Users</SelectItem>
                  <SelectItem value="Blocked">Blocked Users</SelectItem>
                </SelectContent>
              </Select>
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

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>
              {loading ? "Loading users..." : `Showing ${(usersData.users || []).length} users on page ${currentPage}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-4 w-1/3" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </div>
            ) : (!usersData.users || usersData.users.length === 0) ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No users found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || sortFilter !== "all"
                    ? "Try adjusting your filters"
                    : "No users have been registered yet"}
                </p>
                {(searchTerm || sortFilter !== "all") && (
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
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(usersData.users || []).map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                                {getRoleIcon(user.userType)}
                              </div>
                              <div>
                                <div className="font-medium">
                                  {user.firstName} {user.lastName}
                                </div>
                                <div className="text-sm text-muted-foreground space-y-1">
                                  {user.phoneNumber && (
                                    <div className="flex items-center gap-1">
                                      <span>📱</span>
                                      <span>{user.phoneNumber}</span>
                                    </div>
                                  )}
                                  {user.country && (
                                    <div className="flex items-center gap-1">
                                      <Globe className="h-3 w-3" />
                                      <span>{getCountryName(user.country)}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={getRoleBadgeVariant(user.userType)}>
                              {user.userType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.isActive ? "default" : "destructive"}>
                              {user.isActive ? "Active" : "Blocked"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(user.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant={user.isActive ? "destructive" : "default"} 
                                    size="sm"
                                    disabled={blockingUserId === user.id}
                                  >
                                    {blockingUserId === user.id ? (
                                      <RefreshCw className="h-4 w-4 animate-spin" />
                                    ) : user.isActive ? (
                                      <>
                                        <Ban className="h-4 w-4 mr-1" />
                                        Block
                                      </>
                                    ) : (
                                      <>
                                        <UserCheck className="h-4 w-4 mr-1" />
                                        Unblock
                                      </>
                                    )}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      {user.isActive ? 'Block User' : 'Unblock User'}
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {user.isActive 
                                        ? `Are you sure you want to block ${user.firstName} ${user.lastName}? They will no longer be able to access their account.`
                                        : `Are you sure you want to unblock ${user.firstName} ${user.lastName}? They will regain access to their account.`
                                      }
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleBlockUnblockUser(user.id, user.isActive)}
                                      className={user.isActive ? "bg-red-600 hover:bg-red-700" : ""}
                                    >
                                      {user.isActive ? 'Block User' : 'Unblock User'}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Simple Next Pagination */}
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
                      <span>Showing {(usersData.users || []).length} users</span>
                      {usersData.totalCount && (
                        <>
                          <span>•</span>
                          <span>{usersData.totalCount} total</span>
                        </>
                      )}
                    </div>
                    
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={loading || (usersData.users || []).length < pageSize}
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
