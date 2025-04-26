import { API } from "@/lib/api";
import { Category } from "@/types/api";

export const CategoryService = {
  getAllCategories: async (): Promise<Category[]> => {
    try {
      // This endpoint is already defined in API.categories.getAll() which points to /Category/get-all-categories
      const result = await API.categories.getAll();
      console.log("Categories fetched from API:", result);
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error("Error fetching categories:", error);
      return [];
    }
  },
  
  getCategoryById: async (id: string | number): Promise<Category | null> => {
    try {
      const result = await API.categories.getById(Number(id));
      if (result && typeof result === 'object' && result !== null && 'id' in result && 'name' in result) {
        return result as Category;
      }
      return null;
    } catch (error) {
      console.error(`Error fetching category with id ${id}:`, error);
      return null;
    }
  },
  
  addCategory: async (name: string): Promise<Category | null> => {
    try {
      const result = await API.categories.add({ name });
      return result as Category;
    } catch (error) {
      console.error("Error adding category:", error);
      return null;
    }
  },
  
  updateCategory: async (id: number, name: string): Promise<Category | null> => {
    try {
      const result = await API.categories.update({ id, name });
      return result as Category;
    } catch (error) {
      console.error(`Error updating category with id ${id}:`, error);
      return null;
    }
  },
  
  deleteCategory: async (id: number): Promise<boolean> => {
    try {
      await API.categories.delete(id);
      return true;
    } catch (error) {
      console.error(`Error deleting category with id ${id}:`, error);
      return false;
    }
  },
};
