import { MainLayout } from "@/components/layouts/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link } from "react-router-dom";
import { 
  Users, 
  Settings, 
  Shield, 
  UserPlus, 
  AlertTriangle, 
  Server, 
  Database,
  Key,
  Tag
} from "lucide-react";

export default function AdminApiDocs() {
  return (
    <MainLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin API Documentation</h1>
          <p className="text-muted-foreground mt-2">
            Required backend endpoints for admin functionality
          </p>
        </div>

        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Backend Implementation Required</AlertTitle>
          <AlertDescription>
            The following endpoints need to be implemented on the backend server for full admin functionality.
            Current base URL: <code className="bg-muted px-1 rounded">http://localhost:8080/api</code>
          </AlertDescription>
        </Alert>

        <div className="grid gap-6">
          {/* User Management API */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-blue-600" />
                <div>
                  <CardTitle>User Management API</CardTitle>
                  <CardDescription>Endpoints for managing user accounts</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge>GET</Badge>
                    <code className="text-sm">/Account/get-all-users</code>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">Get paginated list of all users</p>
                  <div className="text-xs space-y-1">
                    <div><strong>Query Parameters:</strong></div>
                    <div>• pagenum: number (default: 1) - Page number</div>
                    <div>• pagesize: number (default: 16) - Items per page</div>
                    <div>• Maxpagesize: number (default: 50) - Maximum items per page</div>
                    <div>• sort: string - Filter by "Admin", "Instructor", "Student", "Active", "Blocked"</div>
                    <div>• search: string - Search users by name or email</div>
                    <div><strong>Authentication:</strong> Bearer token required</div>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="destructive">POST</Badge>
                    <code className="text-sm">/Account/block-user/{`{userId}`}</code>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">Block or unblock a user account</p>
                  <div className="text-xs space-y-1">
                    <div><strong>Query Parameters:</strong></div>
                    <div>• block: boolean - true to block, false to unblock</div>
                    <div><strong>Authentication:</strong> Bearer token required</div>
                    <div><strong>Note:</strong> Updates the user's IsActive property</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Authentication Check */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Key className="h-6 w-6 text-green-600" />
                <div>
                  <CardTitle>Authentication Enhancement</CardTitle>
                  <CardDescription>Login flow updates for blocked accounts</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  The user profile endpoint should return the <code>isActive</code> property
                </p>
                <div className="text-xs space-y-1">
                  <div><strong>Enhancement for:</strong> /Account/profile</div>
                  <div>• Include "isActive": boolean in user profile response</div>
                  <div>• When isActive is false, users are redirected to /auth/blocked</div>
                  <div>• Blocked users see appeal instructions and contact information</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Response Format */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Database className="h-6 w-6 text-purple-600" />
                <div>
                  <CardTitle>Expected Response Formats</CardTitle>
                  <CardDescription>JSON structure for API responses</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">GET /Account/get-all-users Response:</h4>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`{
  "users": [
    {
      "id": "string",
      "firstName": "string",
      "lastName": "string", 
      "email": "string",
      "userType": "Admin|Instructor|Student",
      "isActive": boolean,
      "createdAt": "ISO date string",
      "phoneNumber": "string"
    }
  ],
  "totalCount": number,
  "currentPage": number,
  "totalPages": number
}`}
                  </pre>
                </div>

                <div>
                  <h4 className="font-medium mb-2">User Profile Enhancement:</h4>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`{
  "id": "string",
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "isActive": boolean,  // Add this property
  // ...other existing properties
}`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Settings className="h-6 w-6 text-orange-600" />
                <div>
                  <CardTitle>Quick Admin Actions</CardTitle>
                  <CardDescription>Available admin functionality</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button asChild>
                  <Link to="/admin/users" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    User Management
                  </Link>
                </Button>
                
                <Button asChild variant="outline">
                  <Link to="/dashboard/admin/create-admin" className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Create Admin
                  </Link>
                </Button>
                
                <Button asChild variant="outline">
                  <Link to="/dashboard/admin/categories" className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Manage Categories
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
