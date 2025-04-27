import { Course } from "@/types/api";
import { toast } from "@/components/ui/use-toast";

// Key for storing wishlist data in localStorage
const WISHLIST_STORAGE_KEY = "elcentre_wishlist";

export const WishlistService = {
  /**
   * Get all courses in the wishlist
   */
  getWishlist: (): Course[] => {
    try {
      const wishlistData = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return wishlistData ? JSON.parse(wishlistData) : [];
    } catch (error) {
      console.error("Error loading wishlist from localStorage:", error);
      return [];
    }
  },
  
  /**
   * Add a course to the wishlist
   */
  addToWishlist: (course: Course): boolean => {
    try {
      // Get current wishlist
      const currentWishlist = WishlistService.getWishlist();
      
      // Check if course is already in wishlist
      if (currentWishlist.some(item => item.id === course.id)) {
        return false; // Already in wishlist
      }
      
      // Add course to wishlist
      const updatedWishlist = [...currentWishlist, course];
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(updatedWishlist));
      
      // Show success notification
      toast({
        title: "Added to wishlist",
        description: `${course.title} has been added to your wishlist.`,
      });
      
      return true;
    } catch (error) {
      console.error("Error adding course to wishlist:", error);
      return false;
    }
  },
  
  /**
   * Remove a course from the wishlist
   */
  removeFromWishlist: (courseId: number): boolean => {
    try {
      // Get current wishlist
      const currentWishlist = WishlistService.getWishlist();
      
      // Find the course to be removed
      const courseToRemove = currentWishlist.find(item => item.id === courseId);
      if (!courseToRemove) {
        return false; // Not in wishlist
      }
      
      // Remove course from wishlist
      const updatedWishlist = currentWishlist.filter(item => item.id !== courseId);
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(updatedWishlist));
      
      // Show success notification
      toast({
        title: "Removed from wishlist",
        description: `${courseToRemove.title} has been removed from your wishlist.`,
      });
      
      return true;
    } catch (error) {
      console.error("Error removing course from wishlist:", error);
      return false;
    }
  },
  
  /**
   * Toggle a course in the wishlist (add if not present, remove if present)
   */
  toggleWishlist: (course: Course): boolean => {
    const isInWishlist = WishlistService.isInWishlist(course.id);
    
    return isInWishlist ? 
      WishlistService.removeFromWishlist(course.id) : 
      WishlistService.addToWishlist(course);
  },
  
  /**
   * Check if a course is in the wishlist
   */
  isInWishlist: (courseId: number): boolean => {
    const wishlist = WishlistService.getWishlist();
    return wishlist.some(course => course.id === courseId);
  },
  
  /**
   * Clear the entire wishlist
   */
  clearWishlist: (): void => {
    localStorage.removeItem(WISHLIST_STORAGE_KEY);
    toast({
      title: "Wishlist cleared",
      description: "All courses have been removed from your wishlist.",
    });
  }
};