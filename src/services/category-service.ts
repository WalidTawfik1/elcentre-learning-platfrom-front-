
import { apiRequest } from "./api";
import { Category } from "@/types/api";

export const CategoryService = {
  getAllCategories: async (): Promise<Category[]> => {
    return apiRequest<Category[]>("/Category/get-all-categories");
  },
  
  getCategoryById: async (id: number): Promise<Category> => {
    return apiRequest<Category>(`/Category/get-category-by-id/${id}`);
  },
};
