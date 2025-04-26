import { API } from "@/lib/api";
import { Category } from "@/types/api";

export const CategoryService = {
  getAllCategories: async (): Promise<Category[]> => {
    try {
      const result = await API.categories.getAll();
      return result || [];
    } catch (error) {
      console.error("Error fetching categories:", error);
      return [];
    }
  },
  
  getCategoryById: async (id: string | number): Promise<Category | null> => {
    try {
      return await API.categories.getById(Number(id));
    } catch (error) {
      console.error(`Error fetching category with id ${id}:`, error);
      return null;
    }
  },
  
  addCategory: async (name: string): Promise<Category | null> => {
    try {
      return await API.categories.add({ name });
    } catch (error) {
      console.error("Error adding category:", error);
      return null;
    }
  },
  
  updateCategory: async (id: number, name: string): Promise<Category | null> => {
    try {
      return await API.categories.update({ id, name });
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
