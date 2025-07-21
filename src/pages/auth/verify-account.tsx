import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthService } from "@/services/auth-service";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { MainLayout } from "@/components/layouts/main-layout";
import { OTPInput } from "@/components/ui/otp-input";
import { cn } from "@/lib/utils";

export default function VerifyAccount() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Get email from state, sessionStorage (from login) or localStorage (from registration)
  const email = location.state?.email || 
                sessionStorage.getItem("unverifiedEmail") || 
                localStorage.getItem("registrationEmail") || 
                "";
  
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60); // Countdown for resend button
  const [isResendActive, setIsResendActive] = useState(false);

  // Store email in localStorage for persistence
  useEffect(() => {
    if (email) {
      localStorage.setItem("registrationEmail", email);
    }
  }, [email]);

  // Countdown timer for resend button
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isResendActive && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setIsResendActive(false);
      setCountdown(60);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isResendActive, countdown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError("Email not found. Please go back to registration.");
      return;
    }
    
    if (!verificationCode.trim() || verificationCode.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }
    
    setIsVerifying(true);
    setError(null);
    
    try {
      // Call the API to verify the account
      await AuthService.activeAccount(email, verificationCode);
      
      toast({
        title: "Account Verified Successfully",
        description: "Your account has been verified. You can now log in.",
      });
      
      // Clear the stored email after successful verification
      localStorage.removeItem("registrationEmail");
      sessionStorage.removeItem("unverifiedEmail");
      
      // Redirect to login page
      navigate("/login");
    } catch (error: any) {
      console.error("Verification failed:", error);
      setError(error.message || "Verification failed. Please check your code and try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (isResendActive) return;
    
    if (!email) {
      setError("Email not found. Please go back to registration.");
      return;
    }
    
    try {
      await AuthService.resendOTP(email);
      
      toast({
        title: "Code Resent",
        description: "A new verification code has been sent to your email.",
      });
      
      // Start countdown
      setIsResendActive(true);
    } catch (error: any) {
      console.error("Failed to resend code:", error);
      toast({
        title: "Failed to Resend Code",
        description: error.message || "There was a problem sending a new code. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <MainLayout>
      <div className="container flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-8 sm:py-12">
        <div className="mx-auto flex w-full max-w-sm sm:max-w-md flex-col justify-center space-y-6">
          {/* Header Section */}
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-eduBlue-500">
              Verify Your Account
            </h1>
            <p className="text-sm text-muted-foreground px-2">
              Enter the verification code sent to your email
            </p>
          </div>

          <Card className="border-0 shadow-lg sm:border sm:shadow-md">
            <CardHeader className="space-y-1 px-6 pt-6 pb-4">
              <CardTitle className="text-lg sm:text-xl text-center">Email Verification</CardTitle>
              <CardDescription className="text-center text-sm leading-relaxed">
                We've sent a 6-digit verification code to{" "}
                <span className="font-medium text-foreground break-all">
                  {email || "your email"}
                </span>
              </CardDescription>
            </CardHeader>
            
            <form onSubmit={handleVerify}>
              <CardContent className="px-6 pb-4">
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription className="text-sm">{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-4">
                  <Label className="text-center block text-sm font-medium">
                    Verification Code
                  </Label>
                  
                  {/* OTP Input Container */}
                  <div className="flex flex-col items-center space-y-3">
                    <OTPInput
                      length={6}
                      value={verificationCode}
                      onChange={setVerificationCode}
                      disabled={isVerifying}
                      className="justify-center px-2"
                    />
                    
                    {/* Progress indicator */}
                    <div className="flex space-x-1">
                      {Array.from({ length: 6 }, (_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "h-1 w-4 rounded-full transition-colors duration-200",
                            i < verificationCode.length 
                              ? "bg-primary" 
                              : "bg-gray-200"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground text-center px-4 leading-relaxed">
                    Enter the 6-digit code sent to your email. You can paste all digits in any field.
                  </p>
                </div>
              </CardContent>
              
              <CardFooter className="flex flex-col px-6 pb-6 space-y-4">
                <Button 
                  className="w-full h-11 text-sm font-medium" 
                  type="submit" 
                  disabled={isVerifying || verificationCode.length !== 6}
                >
                  {isVerifying ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying...</span>
                    </div>
                  ) : (
                    "Verify Account"
                  )}
                </Button>
                
                {/* Resend Section */}
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Didn't receive a code?
                  </p>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={isResendActive}
                    className={cn(
                      "text-sm font-medium transition-colors duration-200",
                      "text-primary hover:text-primary/80 underline-offset-4 hover:underline",
                      isResendActive && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {isResendActive ? `Resend in ${countdown}s` : "Resend code"}
                  </button>
                </div>
                
                {/* Navigation Links */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-sm text-muted-foreground">
                  <span>Go back to</span>
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="text-primary hover:text-primary/80 underline-offset-4 hover:underline font-medium"
                  >
                    Login
                  </button>
                  <span className="hidden sm:inline">•</span>
                  <button
                    type="button"
                    onClick={() => navigate("/register")}
                    className="text-primary hover:text-primary/80 underline-offset-4 hover:underline font-medium"
                  >
                    Register
                  </button>
                </div>
              </CardFooter>
            </form>
          </Card>
          
          {/* Additional Help Section */}
          <Card className="border-dashed border-gray-300 bg-gray-50/50">
            <CardContent className="px-4 py-3">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                  <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-xs text-gray-600 leading-relaxed">
                  <p className="font-medium mb-1">Having trouble?</p>
                  <p>Check your spam folder or contact support if you don't receive the verification code within 5 minutes.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}