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
import { OTPInput } from "@/components/ui/otp-input";
import { cn } from "@/lib/utils";

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
      <div className="container flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-8 sm:py-12">
        <div className="mx-auto flex w-full max-w-sm sm:max-w-md flex-col justify-center space-y-6">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-eduBlue-500">
              Reset Your Password
            </h1>
            <p className="text-sm text-muted-foreground px-2">
              {step === 1 && "Enter your email to receive a verification code"}
              {step === 2 && "Enter the verification code sent to your email"}
              {step === 3 && "Create a new password for your account"}
            </p>
          </div>

          <Card className="border-0 shadow-lg sm:border sm:shadow-md">
            <CardHeader className="space-y-1 px-6 pt-6 pb-4">
              <CardTitle className="text-lg sm:text-xl text-center">
                {step === 1 && "Forgot Password"}
                {step === 2 && "Verify Code"}
                {step === 3 && "Reset Password"}
              </CardTitle>
              <CardDescription className="text-center text-sm leading-relaxed">
                {step === 1 && "Enter your email address to receive a reset code"}
                {step === 2 && `We've sent a verification code to ${email}`}
                {step === 3 && "Create a new secure password"}
              </CardDescription>
            </CardHeader>
            
            {/* Step 1: Email Form */}
            {step === 1 && (
              <form onSubmit={handleSendOTP}>
                <CardContent className="px-6 pb-4">
                  {error && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertDescription className="text-sm">{error}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-11"
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col px-6 pb-6 space-y-4">
                  <Button 
                    className="w-full h-11 text-sm font-medium" 
                    type="submit" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Sending...</span>
                      </div>
                    ) : (
                      "Send Reset Code"
                    )}
                  </Button>
                  <div className="text-sm text-center">
                    Remember your password?{" "}
                    <button
                      type="button"
                      onClick={() => navigate("/login")}
                      className="text-primary hover:text-primary/80 underline-offset-4 hover:underline font-medium"
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
                <CardContent className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
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
                        value={otpCode}
                        onChange={setOtpCode}
                        disabled={isLoading}
                        className="justify-center px-2"
                      />
                      
                      {/* Progress indicator */}
                      <div className="flex space-x-1">
                        {Array.from({ length: 6 }, (_, i) => (
                          <div
                            key={i}
                            className={cn(
                              "h-1 w-4 rounded-full transition-colors duration-200",
                              i < otpCode.length 
                                ? "bg-primary" 
                                : "bg-gray-200"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground text-center px-4 leading-relaxed">
                      Enter the 6-digit code sent to your email to reset your password.
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                  <Button 
                    className="w-full h-11 text-sm font-medium" 
                    type="submit" 
                    disabled={isLoading || otpCode.length !== 6}
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Verifying...</span>
                      </div>
                    ) : (
                      "Verify Code"
                    )}
                  </Button>
                  
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Didn't receive a code?
                    </p>
                    <button
                      type="button"
                      onClick={handleResendOTP}
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
                  
                  <div className="text-sm text-center">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-primary hover:text-primary/80 underline-offset-4 hover:underline font-medium"
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
                <CardContent className="px-6 pb-4 space-y-4">
                  {error && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertDescription className="text-sm">{error}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">New Password</Label>
                      <PasswordInput
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <PasswordInput
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="h-11"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col px-6 pb-6 space-y-4">
                  <Button 
                    className="w-full h-11 text-sm font-medium" 
                    type="submit" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Resetting...</span>
                      </div>
                    ) : (
                      "Reset Password"
                    )}
                  </Button>
                  
                  <div className="text-sm text-center">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="text-primary hover:text-primary/80 underline-offset-4 hover:underline font-medium"
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