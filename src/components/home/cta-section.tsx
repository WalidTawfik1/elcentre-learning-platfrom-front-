import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export function CTASection() {
  const { isAuthenticated, user } = useAuth();
  
  return (
    <section className="py-16 container">
      <div className="bg-eduBlue-500 text-white rounded-xl p-8 md:p-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div className="mb-6 md:mb-0 md:mr-6">
            {isAuthenticated ? (
              <>
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  Continue your learning journey, {user?.firstName}
                </h2>
                <p className="text-eduBlue-100 md:text-lg max-w-2xl">
                  Jump back into your courses or explore new learning opportunities to enhance your skills.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  Ready to start your learning journey?
                </h2>
                <p className="text-eduBlue-100 md:text-lg max-w-2xl">
                  Join thousands of students already learning on our platform. 
                  Get unlimited access to all courses with a membership.
                </p>
              </>
            )}
          </div>
          <Button 
            size="lg" 
            variant="secondary" 
            className="bg-white text-eduBlue-500 hover:bg-eduBlue-50"
            asChild
          >
            {isAuthenticated ? (
              <Link to="/my-courses">Continue Learning</Link>
            ) : (
              <Link to="/register">Get Started</Link>
            )}
          </Button>
        </div>
      </div>
    </section>
  );
}
