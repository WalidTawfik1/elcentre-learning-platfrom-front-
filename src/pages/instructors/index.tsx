import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layouts/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  BookOpen, 
  GraduationCap
} from "lucide-react";
import { InstructorService } from "@/services/instructor-service";
import { toast } from "@/components/ui/use-toast";
import { getImageUrl } from "@/config/api-config";
import { getInitials } from "@/lib/utils";
import { UserDTO } from "@/types/api";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

export default function InstructorsPage() {
  const [instructors, setInstructors] = useState<UserDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const {isAuthenticated} = useAuth();

  useEffect(() => {
    const fetchInstructors = async () => {
      setIsLoading(true);
      try {
        const instructorsData = await InstructorService.getAllInstructors();
        setInstructors(instructorsData);
      } catch (error) {
        console.error("Error fetching instructors:", error);
        toast({
          title: "Error",
          description: "Failed to load instructors. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchInstructors();
  }, []);

  return (
    <MainLayout>
      <div className="container py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Meet Our Instructors</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Learn from industry experts and passionate educators who are dedicated to helping you succeed.
          </p>
        </div>        {/* Instructors Grid */}
        {isLoading ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i} className="overflow-hidden h-full">
                <CardContent className="p-8 text-center">
                  <div className="flex justify-center mb-6">
                    <Skeleton className="h-32 w-32 rounded-full" />
                  </div>
                  <Skeleton className="h-6 w-3/4 mx-auto mb-4" />
                  <div className="flex justify-center mb-4">
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                  <div className="space-y-2 mb-6">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6 mx-auto" />
                    <Skeleton className="h-4 w-4/6 mx-auto" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : instructors.length === 0 ? (
          <div className="text-center py-16 border rounded-lg">
            <div className="flex justify-center mb-4">
              <Users className="h-16 w-16 text-muted-foreground/50" />
            </div>
            <h3 className="text-2xl font-medium mb-2">No Instructors Found</h3>
            <p className="text-muted-foreground">
              We're currently building our team of expert instructors.
            </p>
          </div>
        ) : (          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {instructors.map((instructor) => (
              <Card key={instructor.id} className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
                <CardContent className="p-8 text-center flex-1 flex flex-col">
                  {/* Large Profile Picture */}
                  <div className="flex justify-center mb-6 flex-shrink-0">
                    <Avatar className="h-32 w-32 border-4 border-primary/20 shadow-lg">
                      <AvatarImage 
                        src={instructor.profilePicture ? getImageUrl(instructor.profilePicture) : ""} 
                        alt={`${instructor.firstName} ${instructor.lastName}`}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-eduBlue-500 text-white text-2xl font-semibold">
                        {getInitials(`${instructor.firstName} ${instructor.lastName}`)}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  {/* Instructor Name */}
                  <h3 className="text-xl font-bold mb-2 min-h-[2rem] flex items-center justify-center">
                    {instructor.firstName} {instructor.lastName}
                  </h3>

                  {/* User Type Badge */}
                  <div className="mb-4 flex justify-center">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <GraduationCap className="h-3 w-3" />
                      <span className="text-xs">Instructor</span>
                    </Badge>
                  </div>

                  {/* Bio Section - Fixed height */}
                  <div className="flex-1 min-h-[5rem] mb-6 flex items-start justify-center">
                    {instructor.bio ? (
                      <p className="text-sm text-muted-foreground line-clamp-4 text-center leading-relaxed">
                        {instructor.bio}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic opacity-60">   
                        No bio available
                      </p>
                    )}
                  </div>

                  {/* View Courses Button */}
                  <div className="mt-auto flex-shrink-0">
                    <Button className="w-full bg-primary hover:bg-primary/90" asChild>
                      <Link to={`/instructors/${instructor.id}/courses`}>
                        <BookOpen className="h-4 w-4 mr-2" />
                        View Courses
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Call to Action */}
        {!isLoading && instructors.length > 0 && !isAuthenticated && (
          <div className="text-center mt-16 py-12 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Interested in Teaching?</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Join our community of expert instructors and share your knowledge with thousands of eager learners worldwide.
            </p>
            <Button size="lg" className="bg-primary hover:bg-primary/90" asChild>
              <Link to="/register">Become an Instructor</Link>
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
