
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="py-16 container">
      <div className="bg-eduPurple-500 text-white rounded-xl p-8 md:p-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div className="mb-6 md:mb-0 md:mr-6">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to start your learning journey?
            </h2>
            <p className="text-eduPurple-100 md:text-lg max-w-2xl">
              Join thousands of students already learning on our platform. 
              Get unlimited access to all courses with a membership.
            </p>
          </div>
          <Button 
            size="lg" 
            variant="secondary" 
            className="bg-white text-eduPurple-500 hover:bg-eduPurple-50"
            asChild
          >
            <Link to="/register">Get Started</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
