import { Helmet } from 'react-helmet-async';

interface CourseStructuredDataProps {
  course: {
    id: string | number;
    title: string;
    description: string;
    thumbnail: string;
    rating?: number;
    reviewCount?: number;
    price: number;
    category?: string;
    categoryName?: string;
    instructor?: {
      id: string;
      name: string;
      avatar?: string;
    };
    instructorName?: string;
    instructorImage?: string;
    durationInHours?: number;
    enrollmentCount?: number;
    studentsCount?: number;
    requirements?: string;
    whatYouWillLearn?: string[];
    modules?: any[];
    lastUpdated?: string;
    createdAt?: string;
  };
  url: string;
}

export const CourseStructuredData = ({ course, url }: CourseStructuredDataProps) => {
  // Calculate total duration from modules if available
  const calculateTotalDuration = () => {
    if (course.durationInHours) {
      return `PT${course.durationInHours}H`;
    }
    if (course.modules && course.modules.length > 0) {
      let totalMinutes = 0;
      course.modules.forEach(module => {
        if (module.lessons) {
          module.lessons.forEach((lesson: any) => {
            if (lesson.durationInMinutes) {
              totalMinutes += lesson.durationInMinutes;
            }
          });
        }
      });
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return hours > 0 ? `PT${hours}H${minutes}M` : `PT${minutes}M`;
    }
    return 'PT1H'; // Default 1 hour if no duration available
  };

  // Get instructor information
  const instructorName = course.instructorName || course.instructor?.name || 'Unknown Instructor';
  const instructorImage = course.instructorImage || course.instructor?.avatar;

  // Build offers array based on price
  const offers = {
    "@type": "Offer",
    "price": course.price || 0,
    "priceCurrency": "USD", // You can change this to your actual currency
    "availability": "https://schema.org/InStock",
    "validFrom": course.createdAt || new Date().toISOString(),
    "category": "Education"
  };

  // Build course outcomes (what you'll learn)
  const courseOutcomes = course.whatYouWillLearn || [
    `Learn ${course.title}`,
    `Master skills in ${course.categoryName || course.category || 'this subject'}`,
    'Apply knowledge in real-world projects'
  ];

  // Build course requirements
  const courseRequirements = course.requirements ? 
    course.requirements.split('\n').filter(req => req.trim()) : 
    ['Basic computer skills', 'Internet connection'];

  // Build the structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": course.title,
    "description": course.description,
    "url": url,
    "image": course.thumbnail,
    "courseCode": `COURSE-${course.id}`,
    "educationalLevel": "Beginner to Intermediate",
    "timeRequired": calculateTotalDuration(),
    "inLanguage": "en",
    "offers": offers,
    "provider": {
      "@type": "EducationalOrganization", 
      "name": "ElCentre",
      "url": "https://elcentre-learn.vercel.app/",
      "logo": "https://elcentre-learn.vercel.app/ELCentreLogo21.png"
    },
    "instructor": {
      "@type": "Person",
      "name": instructorName,
      ...(instructorImage && { "image": instructorImage }),
      "jobTitle": "Course Instructor",
      "worksFor": {
        "@type": "EducationalOrganization",
        "name": "ElCentre"
      }
    },
    "about": {
      "@type": "Thing",
      "name": course.categoryName || course.category || "Technology",
      "description": `Learn ${course.categoryName || course.category || 'new skills'} with this comprehensive course`
    },
    "teaches": courseOutcomes,
    "courseRequirements": courseRequirements,
    "numberOfStudents": course.enrollmentCount || course.studentsCount || 0,
    "totalTime": calculateTotalDuration(),
    "courseMode": "Online",
    "hasCourseInstance": {
      "@type": "CourseInstance",
      "courseMode": "Online",
      "instructor": {
        "@type": "Person", 
        "name": instructorName
      },
      "courseSchedule": {
        "@type": "Schedule",
        "repeatFrequency": "Self-paced",
        "scheduleTimezone": "UTC"
      }
    },
    ...(course.rating && course.reviewCount && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": course.rating,
        "reviewCount": course.reviewCount,
        "bestRating": 5,
        "worstRating": 1
      }
    }),
    ...(course.lastUpdated && {
      "dateModified": course.lastUpdated
    }),
    ...(course.createdAt && {
      "datePublished": course.createdAt
    })
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};
