import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthService } from "@/services/auth-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { MainLayout } from "@/components/layouts/main-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";

export default function ForgetPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State management
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // Step 1: Email, Step 2: OTP, Step 3: New Password
  const [countdown, setCountdown] = useState(60);
  const [isResendActive, setIsResendActive] = useState(false);
  
  // Store email in localStorage for persistence
  useEffect(() => {
    const savedEmail = localStorage.getItem("forgetPasswordEmail");
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);
  
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
  
  // Step 1: Send email for OTP
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Call the API to send forget password email with OTP
      await AuthService.requestPasswordReset(email);
      
      // Save email to localStorage for next steps
      localStorage.setItem("forgetPasswordEmail", email);
      
      toast({
        title: "OTP Sent",
        description: "A verification code has been sent to your email.",
      });
      
      // Move to OTP verification step
      setStep(2);
      setIsResendActive(true); // Start countdown for resend
    } catch (error: any) {
      console.error("Failed to send OTP:", error);
      setError(error.message || "Failed to send verification code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Step 2: Verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otpCode.trim()) {
      setError("Please enter the verification code.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Call the API to verify OTP
      await AuthService.verifyOTP(email, otpCode);
      
      // Save OTP code in localStorage for final step
      localStorage.setItem("resetPasswordOTP", otpCode);
      
      toast({
        title: "Code Verified",
        description: "Verification successful. You can now reset your password.",
      });
      
      // Move to password reset step
      setStep(3);
    } catch (error: any) {
      console.error("OTP verification failed:", error);
      setError(error.message || "Verification failed. Please check your code and try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError("Please enter a new password.");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Get saved OTP code from localStorage
      const savedOTP = localStorage.getItem("resetPasswordOTP") || otpCode;
      
      // Call the API to reset password
      await AuthService.resetPassword(email, password, savedOTP);
      
      toast({
        title: "Password Reset Successful",
        description: "Your password has been reset. You can now log in with your new password.",
      });
      
      // Clean up localStorage
      localStorage.removeItem("forgetPasswordEmail");
      localStorage.removeItem("resetPasswordOTP");
      
      // Redirect to login page
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error: any) {
      console.error("Password reset failed:", error);
      setError(error.message || "Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle resend OTP
  const handleResendOTP = async () => {
    if (isResendActive) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Call the API to resend OTP
      await AuthService.requestPasswordReset(email);
      
      toast({
        title: "OTP Resent",
        description: "A new verification code has been sent to your email.",
      });
      
      // Start countdown
      setIsResendActive(true);
    } catch (error: any) {
      console.error("Failed to resend OTP:", error);
      setError(error.message || "Failed to resend code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <MainLayout>
      <div className="container py-12 flex flex-col items-center justify-center">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-eduBlue-500">Reset Your Password</h1>
            <p className="text-sm text-muted-foreground">
              {step === 1 && "Enter your email to receive a verification code"}
              {step === 2 && "Enter the verification code sent to your email"}
              {step === 3 && "Create a new password for your account"}
            </p>
          </div>

          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl">
                {step === 1 && "Forgot Password"}
                {step === 2 && "Verify Code"}
                {step === 3 && "Reset Password"}
              </CardTitle>
              <CardDescription>
                {step === 1 && "Enter your email address to receive a reset code"}
                {step === 2 && `We've sent a verification code to ${email}`}
                {step === 3 && "Create a new secure password"}
              </CardDescription>
            </CardHeader>
            
            {/* Step 1: Email Form */}
            {step === 1 && (
              <form onSubmit={handleSendOTP}>
                <CardContent className="grid gap-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col">
                  <Button className="w-full" type="submit" disabled={isLoading}>
                    {isLoading ? "Sending..." : "Send Reset Code"}
                  </Button>
                  <div className="mt-4 text-sm text-center">
                    Remember your password?{" "}
                    <button
                      type="button"
                      onClick={() => navigate("/login")}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      Back to Login
                    </button>
                  </div>
                </CardFooter>
              </form>
            )}
            
            {/* Step 2: OTP Verification Form */}
            {step === 2 && (
              <form onSubmit={handleVerifyOTP}>
                <CardContent className="grid gap-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <div className="grid gap-2">
                    <Label htmlFor="otpCode">Verification Code</Label>
                    <Input
                      id="otpCode"
                      placeholder="Enter verification code"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col">
                  <Button className="w-full" type="submit" disabled={isLoading}>
                    {isLoading ? "Verifying..." : "Verify Code"}
                  </Button>
                  
                  <div className="mt-4 text-sm text-center">
                    Didn't receive a code?{" "}
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={isResendActive}
                      className={`text-primary underline-offset-4 hover:underline ${isResendActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isResendActive ? `Resend in ${countdown}s` : "Resend code"}
                    </button>
                  </div>
                  
                  <div className="mt-4 text-sm text-center">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      Back to Email
                    </button>
                  </div>
                </CardFooter>
              </form>
            )}
            
            {/* Step 3: Password Reset Form */}
            {step === 3 && (
              <form onSubmit={handleResetPassword}>
                <CardContent className="grid gap-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <div className="grid gap-2">
                    <Label htmlFor="password">New Password</Label>
                    <PasswordInput
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <PasswordInput
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col">
                  <Button className="w-full" type="submit" disabled={isLoading}>
                    {isLoading ? "Resetting..." : "Reset Password"}
                  </Button>
                  
                  <div className="mt-4 text-sm text-center">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      Back to Verification
                    </button>
                  </div>
                </CardFooter>
              </form>
            )}
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}