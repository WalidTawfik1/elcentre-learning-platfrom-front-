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
      <div className="container py-12 flex flex-col items-center justify-center">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-eduBlue-500">Verify Your Account</h1>
            <p className="text-sm text-muted-foreground">
              Enter the verification code sent to your email
            </p>
          </div>

          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl">Email Verification</CardTitle>
                <CardDescription>
                We've sent a 6-digit verification code to <strong>{email || "your email"}</strong>
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleVerify}>
              <CardContent className="grid gap-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="grid gap-4">
                  <Label className="text-center">Verification Code</Label>
                  <OTPInput
                    length={6}
                    value={verificationCode}
                    onChange={setVerificationCode}
                    disabled={isVerifying}
                    className="justify-center"
                  />
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Enter the 6-digit code sent to your email. You can paste all digits in any field.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col">
                <Button 
                  className="w-full" 
                  type="submit" 
                  disabled={isVerifying}
                >
                  {isVerifying ? "Verifying..." : "Verify Account"}
                </Button>
                
                <div className="mt-4 text-sm text-center">
                  Didn't receive a code?{" "}
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={isResendActive}
                    className={`text-primary underline-offset-4 hover:underline ${isResendActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isResendActive ? `Resend in ${countdown}s` : "Resend code"}
                  </button>
                </div>
                
                <div className="mt-4 text-sm text-center">
                  Go back to{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    Login
                  </button>
                </div>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}