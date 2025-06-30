import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layouts/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/ui/use-toast";
import { DIRECT_API_URL } from "@/config/api-config";

export default function GoogleBridge() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { fetchUser } = useAuth();
  
  const [isProcessing, setIsProcessing] = useState(true);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("Student");
  const [error, setError] = useState<string | null>(null);

  const token = searchParams.get("token");
  const isNewUser = searchParams.get("isNewUser") === "true";
  const role = searchParams.get("role");

  useEffect(() => {
    const processGoogleAuth = async () => {
      try {
        if (!token) {
          setError("No authentication token received");
          setIsProcessing(false);
          return;
        }

        // Set the JWT cookie
        const setCookie = (name: string, value: string, days = 7) => {
          const date = new Date();
          date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
          const expires = "; expires=" + date.toUTCString();
          document.cookie = name + "=" + value + expires + "; path=/; SameSite=Lax";
        };

        setCookie('jwt', token, 7);

        if (isNewUser) {
          // New user - show role selection
          setShowRoleSelection(true);
          setIsProcessing(false);
        } else {
          // Existing user - redirect based on their role
          await handleSuccessfulAuth(role);
        }
      } catch (error) {
        console.error("Error processing Google auth:", error);
        setError("Failed to process authentication");
        setIsProcessing(false);
      }
    };

    processGoogleAuth();
  }, [token, isNewUser, role]);

  const handleSuccessfulAuth = async (userRole?: string | null) => {
    try {
      // Fetch user profile to update auth context
      await fetchUser(true);

      toast({
        title: "Login successful",
        description: "Welcome to ElCentre!",
      });

      // Redirect based on user role
      setTimeout(() => {
        if (userRole === 'Instructor') {
          navigate('/instructor/dashboard');
        } else if (userRole === 'Admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/dashboard');
        }
      }, 500);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      // Even if profile fetch fails, the auth was successful
      navigate('/dashboard');
    }
  };

  const handleRoleSelection = async () => {
    try {
      setIsProcessing(true);
      
      // Update user role via API
      const response = await fetch(`${DIRECT_API_URL}/Account/update-role`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({ role: selectedRole })
      });

      if (!response.ok) {
        throw new Error("Failed to update user role");
      }

      await handleSuccessfulAuth(selectedRole);
    } catch (error) {
      console.error("Error updating user role:", error);
      setError("Failed to update user role. Please try again.");
      setIsProcessing(false);
    }
  };

  if (isProcessing && !showRoleSelection) {
    return (
      <MainLayout>
        <div className="container py-20 flex flex-col items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle>Processing Authentication</CardTitle>
              <CardDescription>Please wait while we set up your account...</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="container py-20 flex flex-col items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle>Authentication Error</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <Button 
                onClick={() => navigate('/login')} 
                className="w-full"
              >
                Return to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (showRoleSelection) {
    return (
      <MainLayout>
        <div className="container py-20 flex flex-col items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle>Complete Your Registration</CardTitle>
              <CardDescription>
                Please select how you'd like to join ElCentre
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label className="text-base font-medium">I want to join as:</Label>
                <RadioGroup 
                  value={selectedRole}
                  onValueChange={setSelectedRole}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value="Student" id="google-student" />
                    <div className="flex-1">
                      <Label htmlFor="google-student" className="cursor-pointer font-medium">
                        Student
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Access courses and learning materials
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value="Instructor" id="google-instructor" />
                    <div className="flex-1">
                      <Label htmlFor="google-instructor" className="cursor-pointer font-medium">
                        Instructor
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Create and manage courses
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>
              
              <Button 
                onClick={handleRoleSelection}
                disabled={isProcessing}
                className="w-full"
              >
                {isProcessing ? "Setting up your account..." : "Complete Registration"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return null;
}
