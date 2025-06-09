import { Course } from "@/types/api";
import { toast } from "@/components/ui/use-toast";

// Base key for storing wishlist data in localStorage
const WISHLIST_STORAGE_BASE_KEY = "elcentre_wishlist";

export const WishlistService = {
  /**
   * Get the user-specific wishlist storage key
   * If userId is provided, it creates a user-specific key
   * Otherwise, falls back to anonymous wishlist
   */
  getStorageKey: (): string => {
    // Try to get current user ID from localStorage 
    // (where it should be stored during login)
    const userData = localStorage.getItem("elcentre_user");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user && user.id) {        return `${WISHLIST_STORAGE_BASE_KEY}_${user.id}`;
        }
      } catch (error) {
        // Silent error handling for parsing issues
      }
    }
    
    // Fallback to anonymous wishlist
    return WISHLIST_STORAGE_BASE_KEY;
  },

  /**
   * Get all courses in the wishlist
   */
  getWishlist: (): Course[] => {
    try {
      const storageKey = WishlistService.getStorageKey();
      const wishlistData = localStorage.getItem(storageKey);
      return wishlistData ? JSON.parse(wishlistData) : [];    } catch (error) {
      // Silent error handling
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
      const storageKey = WishlistService.getStorageKey();
      localStorage.setItem(storageKey, JSON.stringify(updatedWishlist));
      
      // Show success notification
      toast({
        title: "Added to wishlist",
        description: `${course.title} has been added to your wishlist.`,      });
      
      return true;
    } catch (error) {
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
      const storageKey = WishlistService.getStorageKey();
      localStorage.setItem(storageKey, JSON.stringify(updatedWishlist));
      
      // Show success notification
      toast({
        title: "Removed from wishlist",
        description: `${courseToRemove.title} has been removed from your wishlist.`,
      });
        return true;
    } catch (error) {
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
    const storageKey = WishlistService.getStorageKey();
    localStorage.removeItem(storageKey);
    toast({
      title: "Wishlist cleared",
      description: "All courses have been removed from your wishlist.",
    });
  }
};