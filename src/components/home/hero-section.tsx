import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

export function HeroSection() {
  const { isAuthenticated, user } = useAuth();
  
  return (
    <section className="relative py-20 md:py-32 overflow-hidden bg-gradient-to-b from-eduBlue-50 to-transparent">
      <div className="container relative z-10">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          <img
            src="/ELCentreLogo21.png"
            alt="ElCentre Logo"
            width={200}
            height={80}
            className="h-20 w-auto mb-6"
            draggable={false}
          />
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Discover Your Learning Path with{" "}
            <span className="text-eduBlue-500">ElCentre</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl">
            Unlock your potential with our expert-led courses. Learn at your own pace 
            and achieve your goals with structured learning paths.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="bg-eduBlue-500 hover:bg-eduBlue-600" asChild>
              <Link to="/courses">Browse Courses</Link>
            </Button>
            
            {isAuthenticated ? (
              user?.userType !== "Admin" && (
                <Button size="lg" variant="outline" className="border-eduBlue-500 text-eduBlue-500 hover:bg-eduBlue-50" asChild>
                  <Link to={user?.userType === "Instructor" ? "/instructor/courses" : "/my-courses"}>My Courses</Link>
                </Button>
              )
            ) : (
              <Button size="lg" variant="outline" className="border-eduBlue-500 text-eduBlue-500 hover:bg-eduBlue-50" asChild>
                <Link to="/register">Join for Free</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-eduAccent opacity-5"></div>
        <div className="absolute top-20 -left-20 w-60 h-60 rounded-full bg-eduBlue-300 opacity-5"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 rounded-full bg-eduAccent-secondary opacity-5"></div>
      </div>
    </section>
  );
}
