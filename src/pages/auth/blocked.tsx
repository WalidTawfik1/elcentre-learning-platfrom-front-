import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Mail, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function BlockedAccount() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    // Clear all authentication data
    document.cookie = "jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    localStorage.removeItem("elcentre_user");
    localStorage.removeItem("userType");
    
    // Navigate to login page
    navigate('/login');
  };

  const handleEmailSupport = () => {
    window.location.href = 'mailto:elcentre.business@gmail.com?subject=Account Block Appeal&body=Hello,%0D%0A%0D%0AI would like to appeal the block on my account. Please provide information about the violation and how I can resolve this issue.%0D%0A%0D%0AThank you.';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl text-red-700">Account Blocked</CardTitle>
              <CardDescription className="text-red-600">
                Your account has been temporarily suspended
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <p className="text-sm text-gray-700">
                  Your account has been blocked due to violation of our community guidelines 
                  or terms of service. This action was taken to maintain the safety and 
                  integrity of our platform.
                </p>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>What you can do:</strong>
                  </p>
                  <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                    <li>• Review our terms of service and community guidelines</li>
                    <li>• Contact our support team to appeal this decision</li>
                    <li>• Provide any relevant information about your case</li>
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 font-medium mb-2">
                    Need help? Contact our support team:
                  </p>
                  <p className="text-sm text-blue-700">
                    <strong>Email:</strong> elcentre.business@gmail.com
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Please include your account details and reason for appeal
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <Button 
                  onClick={handleEmailSupport} 
                  className="w-full"
                  variant="default"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email Support Team
                </Button>
                
                <Button 
                  onClick={handleLogout} 
                  variant="outline" 
                  className="w-full"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
