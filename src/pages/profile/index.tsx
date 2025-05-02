import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { MainLayout } from "@/components/layouts/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserDTO } from "@/types/api";
import { Loader2, Save } from "lucide-react";

export default function ProfilePage() {
  const { user, updateProfile, isLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");
  
  // Initialize form data with user's current information
  const [formData, setFormData] = useState<Partial<UserDTO>>({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    gender: "",
    dateOfBirth: "",
    userType: ""
  });
  
  // Only update form data from user when not in editing mode
  // This prevents the form from resetting while the user is editing
  useEffect(() => {
    if (user && !isEditing) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
        gender: user.gender || "",
        dateOfBirth: user.dateOfBirth || "",
        userType: user.userType || ""
      });
    }
  }, [user, isEditing]);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Access denied",
        description: "Please login to view this page",
        variant: "destructive"
      });
      navigate("/login");
    }
  }, [user, isLoading, navigate, toast]);
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  // Handle select input changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsSaving(true);
    
    try {
      // Make sure we have all the required fields
      if (!formData.firstName || !formData.lastName || !formData.gender || !formData.dateOfBirth || !formData.phoneNumber) {
        setFormError("Please fill in all required fields");
        setIsSaving(false);
        return;
      }
      
      // Only include fields that can be edited
      const updatedProfile = {
        ...user,
        firstName: formData.firstName,
        lastName: formData.lastName,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        phoneNumber: formData.phoneNumber
      };
      
      await updateProfile(updatedProfile);
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully."
      });
    } catch (error: any) {
      setFormError(error?.message || "Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };
  
  // Start editing mode
  const startEditing = () => {
    // Make a fresh copy of the user data to avoid reference issues
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
        gender: user.gender || "",
        dateOfBirth: user.dateOfBirth || "",
        userType: user.userType || ""
      });
    }
    setIsEditing(true);
  };
  
  // Cancel editing
  const cancelEditing = () => {
    setIsEditing(false);
    // Reset form data to original user data
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
        gender: user.gender || "",
        dateOfBirth: user.dateOfBirth || "",
        userType: user.userType || ""
      });
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (e) {
      return dateString;
    }
  };
  
  // Get user initials for avatar
  const getInitials = () => {
    if (!user) return "U";
    return `${user.firstName?.charAt(0) || ""}${user.lastName?.charAt(0) || ""}`.toUpperCase() || "U";
  };
  
  if (isLoading) {
    return (
      <MainLayout>
        <div className="container py-12 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p>Loading profile...</p>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="container py-12">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col md:flex-row gap-8 mb-8 items-center md:items-start">
            <div className="flex flex-col items-center">
              <Avatar className="h-32 w-32 mb-4">
                <AvatarImage src={user?.avatar} alt={`${user?.firstName} ${user?.lastName}`} />
                <AvatarFallback className="text-3xl bg-primary/10 text-primary">{getInitials()}</AvatarFallback>
              </Avatar>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold mb-2">{user?.firstName} {user?.lastName}</h1>
              <p className="text-muted-foreground mb-4">{user?.email}</p>
              <div className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                {user?.userType}
              </div>
            </div>
          </div>
          
          <Tabs defaultValue="information" className="w-full">
            <TabsList>
              <TabsTrigger value="information">Information</TabsTrigger>
              <TabsTrigger value="security" disabled>Security</TabsTrigger>
              <TabsTrigger value="preferences" disabled>Preferences</TabsTrigger>
            </TabsList>
            
            <TabsContent value="information" className="py-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>View and edit your personal information</CardDescription>
                  </div>
                  {!isEditing ? (
                    <Button onClick={startEditing}>Edit Profile</Button>
                  ) : (
                    <Button variant="outline" onClick={cancelEditing}>
                      Cancel
                    </Button>
                  )}
                </CardHeader>
                
                <form onSubmit={handleSubmit}>
                  <CardContent className="space-y-4">
                    {formError && (
                      <Alert variant="destructive">
                        <AlertDescription>{formError}</AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        {isEditing ? (
                          <Input
                            id="firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            required
                          />
                        ) : (
                          <p className="py-2 px-3 border rounded-md bg-muted/30">{user?.firstName}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        {isEditing ? (
                          <Input
                            id="lastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            required
                          />
                        ) : (
                          <p className="py-2 px-3 border rounded-md bg-muted/30">{user?.lastName}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <p className="py-2 px-3 border rounded-md bg-muted/30">{user?.email}</p>
                      <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber">Phone Number</Label>
                        {isEditing ? (
                          <Input
                            id="phoneNumber"
                            name="phoneNumber"
                            type="tel"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            required
                          />
                        ) : (
                          <p className="py-2 px-3 border rounded-md bg-muted/30">{user?.phoneNumber || "Not provided"}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="gender">Gender</Label>
                        {isEditing ? (
                          <Select
                            value={formData.gender}
                            onValueChange={(value) => handleSelectChange("gender", value)}
                            required
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                              <SelectItem value="PreferNotToSay">Prefer not to say</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="py-2 px-3 border rounded-md bg-muted/30">{user?.gender || "Not provided"}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dateOfBirth">Date of Birth</Label>
                        {isEditing ? (
                          <Input
                            id="dateOfBirth"
                            name="dateOfBirth"
                            type="date"
                            value={formData.dateOfBirth}
                            onChange={handleChange}
                            required
                          />
                        ) : (
                          <p className="py-2 px-3 border rounded-md bg-muted/30">{formatDate(user?.dateOfBirth || "")}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="userType">Account Type</Label>
                        <p className="py-2 px-3 border rounded-md bg-muted/30">{user?.userType}</p>
                        <p className="text-xs text-muted-foreground">Account type cannot be changed</p>
                      </div>
                    </div>
                  </CardContent>
                  
                  {isEditing && (
                    <CardFooter>
                      <Button type="submit" className="ml-auto" disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  )}
                </form>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}