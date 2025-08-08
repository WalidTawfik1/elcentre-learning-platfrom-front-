import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { MainLayout } from "@/components/layouts/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PhoneInput } from "@/components/ui/phone-input";
import { CountrySelect, getCountryName } from "@/components/ui/country-select";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserDTO } from "@/types/api";
import { Loader2, Save, Camera } from "lucide-react";
import { getImageUrl } from "@/config/api-config";

export default function ProfilePage() {
  const { user, updateProfile, isLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [selectedProfilePicture, setSelectedProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  // Initialize form data with user's current information
  const [formData, setFormData] = useState<Partial<UserDTO>>({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    country: "",
    gender: "",
    dateOfBirth: "",
    userType: "",
    bio: ""
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
        country: user.country || "",
        gender: user.gender || "",
        dateOfBirth: user.dateOfBirth || "",
        userType: user.userType || "",
        bio: user.bio || ""
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

  // Handle phone number changes
  const handlePhoneChange = (value: string) => {
    setFormData((prev) => ({ ...prev, phoneNumber: value }));
  };

  // Handle country changes
  const handleCountryChange = (value: string) => {
    setFormData((prev) => ({ ...prev, country: value }));
  };

  // Handle profile picture change
  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedProfilePicture(file);
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setProfilePicturePreview(previewUrl);
    }
  };  // Get the current profile picture URL
  const getCurrentProfilePictureUrl = () => {
    
    
    
    
    // If we have a preview (user is editing and selected a new image)
    if (profilePicturePreview) {
      
      return profilePicturePreview;
    }
    
    // Check both avatar and profilePicture fields (avatar is the computed field from useAuth)
    const profilePictureSource = user?.avatar || user?.profilePicture;
    if (profilePictureSource) {
      try {
        const imageUrl = getImageUrl(profilePictureSource);
        
        
        
        // Don't return placeholder URLs
        if (imageUrl === "/placeholder.svg") {
          
          return "";
        }
        
        return imageUrl;
      } catch (error) {
        console.error('Error getting profile picture URL:', error);
        return "";
      }
    }
    
    
    return "";
  };
    // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsSaving(true);
    
    try {
      // Make sure we have all the required fields
      if (!formData.firstName || !formData.lastName || !formData.gender || !formData.dateOfBirth || !formData.phoneNumber || !formData.country) {
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
        phoneNumber: formData.phoneNumber,
        country: formData.country,
        bio: formData.bio || ""
      };
      
      await updateProfile(updatedProfile, selectedProfilePicture);
      setIsEditing(false);
      
      // Clear selected profile picture and preview after successful update
      setSelectedProfilePicture(null);
      setProfilePicturePreview(null);
      
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
        country: user.country || "",
        gender: user.gender || "",
        dateOfBirth: user.dateOfBirth || "",
        userType: user.userType || "",
        bio: user.bio || ""
      });
    }
    setIsEditing(true);
  };
  
  // Cancel editing
  const cancelEditing = () => {
    setIsEditing(false);
    setSelectedProfilePicture(null);
    setProfilePicturePreview(null);
    // Reset form data to original user data
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
        country: user.country || "",
        gender: user.gender || "",
        dateOfBirth: user.dateOfBirth || "",
        userType: user.userType || "",
        bio: user.bio || ""
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
        <div className="max-w-3xl mx-auto">          <div className="flex flex-col md:flex-row gap-8 mb-8 items-center md:items-start">            <div className="flex flex-col items-center">
              <div className="relative">                <Avatar className="h-32 w-32 mb-4">
                  <AvatarImage 
                    src={getCurrentProfilePictureUrl() || ""} 
                    alt={`${user?.firstName} ${user?.lastName}`}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-3xl bg-eduBlue-500 text-white">{getInitials()}</AvatarFallback>
                </Avatar>
                {isEditing && (
                  <div className="absolute bottom-4 right-0">
                    <Label htmlFor="profilePicture" className="cursor-pointer">
                      <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-full text-white hover:bg-primary/90 transition-colors">
                        <Camera className="h-5 w-5" />
                      </div>
                      <input
                        id="profilePicture"
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePictureChange}
                        className="hidden"
                      />
                    </Label>
                  </div>
                )}
              </div>
            </div>
              <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold mb-2">{user?.firstName} {user?.lastName}</h1>
              <p className="text-muted-foreground mb-2">{user?.email}</p>
              {user?.bio && (
                <p className="text-sm text-muted-foreground mb-4 max-w-md">{user.bio}</p>
              )}
              <div className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                {user?.userType}              </div>
            </div>
          </div>
          
          <Tabs defaultValue="information" className="w-full">
            <TabsList>
              <TabsTrigger value="information">Information</TabsTrigger>
              <TabsTrigger value="security" disabled>Security</TabsTrigger>
              <TabsTrigger value="preferences" disabled>Preferences</TabsTrigger>
            </TabsList>
            
            <TabsContent value="information" className="py-4">
              <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                <div className="flex flex-row items-center justify-between p-6 border-b border-gray-100">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                    <p className="text-sm text-gray-500">View and edit your personal information</p>
                  </div>
                  {!isEditing ? (
                    <Button onClick={startEditing}>Edit Profile</Button>
                  ) : (
                    <Button variant="outline" onClick={cancelEditing}>
                      Cancel
                    </Button>
                  )}
                </div>
                
                <form onSubmit={handleSubmit}>
                  <div className="p-6 space-y-4">
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
                    
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      {isEditing ? (
                        <CountrySelect
                          id="country"
                          name="country"
                          value={formData.country || ""}
                          onChange={handleCountryChange}
                          placeholder="Select your country"
                          required
                        />
                      ) : (
                        <p className="py-2 px-3 border rounded-md bg-muted/30">{user?.country ? getCountryName(user.country) : "Not provided"}</p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber">Phone Number</Label>
                        {isEditing ? (
                          <PhoneInput
                            id="phoneNumber"
                            name="phoneNumber"
                            value={formData.phoneNumber || ""}
                            onChange={handlePhoneChange}
                            onCountryChange={handleCountryChange}
                            placeholder="Enter phone number"
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
                    
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      {isEditing ? (
                        <Textarea
                          id="bio"
                          name="bio"
                          value={formData.bio}
                          onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                          placeholder="Tell us a bit about yourself..."
                          rows={4}
                        />
                      ) : (
                        <div className="py-2 px-3 border rounded-md bg-muted/30 min-h-[100px]">
                          {user?.bio || "No bio provided"}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {isEditing && (
                    <div className="px-6 py-4 border-t border-gray-100">
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
                    </div>
                  )}
                </form>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}