import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layouts/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AuthService } from "@/services/auth-service";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function DeleteAccountPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logout } = useAuth();
  const [confirmationText, setConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const REQUIRED_TEXT = "I want to delete my account";

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate confirmation text
    if (confirmationText !== REQUIRED_TEXT) {
      setError("Please type the exact confirmation phrase to proceed.");
      return;
    }

    setIsDeleting(true);

    try {
      await AuthService.deleteAccount();
      
      toast({
        title: "Account deleted",
        description: "Your account has been successfully deleted. You will be redirected to the home page.",
      });

      // Log out the user
      await logout();

      // Redirect to home page after a short delay
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error: any) {
      setError(error?.message || "Failed to delete account. Please try again.");
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    navigate("/profile");
  };

  return (
    <MainLayout>
      <div className="container py-12">
        <div className="max-w-2xl mx-auto">
          <Card className="border-destructive">
            <CardHeader>
              <div className="flex items-center gap-2 text-destructive mb-2">
                <AlertTriangle className="h-6 w-6" />
                <CardTitle className="text-2xl">Delete Account</CardTitle>
              </div>
              <CardDescription>
                This action cannot be undone. Please read carefully before proceeding.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Warning:</strong> Deleting your account is permanent and irreversible.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4 text-sm text-muted-foreground">
                  <p>
                    <strong>What happens when you delete your account:</strong>
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Your account will be permanently marked as deleted</li>
                    <li>You will not be able to log in with this account</li>
                    <li>You cannot register again with the same email address</li>
                    <li>All your personal data will be inaccessible</li>
                    <li>Your enrollments and course progress will be lost</li>
                  </ul>
                  <p className="pt-2">
                    <strong>To restore your account:</strong> You must contact ElCentre support at{" "}
                    <a 
                      href="mailto:elcentre.business@gmail.com" 
                      className="text-primary hover:underline font-medium"
                    >
                      elcentre.business@gmail.com
                    </a>
                    {" "}for assistance.
                  </p>
                </div>

                <form onSubmit={handleDeleteAccount} className="space-y-4 pt-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="confirmation" className="text-base">
                      To confirm, type: <span className="font-semibold">{REQUIRED_TEXT}</span>
                    </Label>
                    <Input
                      id="confirmation"
                      type="text"
                      value={confirmationText}
                      onChange={(e) => setConfirmationText(e.target.value)}
                      placeholder="Type the confirmation phrase"
                      disabled={isDeleting}
                      className="font-mono"
                    />
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isDeleting}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="destructive"
                      disabled={isDeleting || confirmationText !== REQUIRED_TEXT}
                      className="flex-1"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting Account...
                        </>
                      ) : (
                        "Delete My Account"
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
