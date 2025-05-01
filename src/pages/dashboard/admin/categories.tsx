import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CategoryService } from '@/services/category-service';
import { Category } from '@/types/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pencil, Trash2, Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AdminLayout } from '@/components/layouts/admin-layout';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const AdminCategories: React.FC = () => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Use React Query to fetch and cache categories
  const {
    data: categories = [],
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ['adminCategories'],
    queryFn: CategoryService.getAllCategories,
  });

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    
    setIsActionLoading(true);
    try {
      const newCategory = await CategoryService.addCategory(newCategoryName.trim());
      if (newCategory) {
        // Invalidate and refetch categories instead of manually updating state
        await queryClient.invalidateQueries({ queryKey: ['adminCategories'] });
        setNewCategoryName('');
        toast({
          title: 'Success',
          description: 'Category added successfully',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add category',
        variant: 'destructive',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.name.trim()) return;
    
    setIsActionLoading(true);
    try {
      const updatedCategory = await CategoryService.updateCategory(
        editingCategory.id,
        editingCategory.name.trim()
      );
      
      if (updatedCategory) {
        // Invalidate and refetch categories
        await queryClient.invalidateQueries({ queryKey: ['adminCategories'] });
        setEditingCategory(null);
        toast({
          title: 'Success',
          description: 'Category updated successfully',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update category',
        variant: 'destructive',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    
    setIsActionLoading(true);
    try {
      const success = await CategoryService.deleteCategory(categoryToDelete.id);
      if (success) {
        // Invalidate and refetch categories
        await queryClient.invalidateQueries({ queryKey: ['adminCategories'] });
        toast({
          title: 'Success',
          description: 'Category deleted successfully',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete category',
        variant: 'destructive',
      });
    } finally {
      setIsActionLoading(false);
      setCategoryToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const openDeleteDialog = (category: Category) => {
    setCategoryToDelete(category);
    setIsDeleteDialogOpen(true);
  };

  const startEditing = (category: Category) => {
    setEditingCategory({ ...category });
  };

  const cancelEditing = () => {
    setEditingCategory(null);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Category Management</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Add Category Form */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Add New Category</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddCategory}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      placeholder="Category name"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      disabled={isActionLoading}
                    />
                  </div>
                  <Button type="submit" disabled={isActionLoading || !newCategoryName.trim()}>
                    {isActionLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Category
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Categories List */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : isError ? (
                <div className="text-center py-6 text-red-500">
                  Failed to load categories. 
                  <Button variant="link" onClick={() => refetch()} className="pl-1">
                    Try again
                  </Button>
                </div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.map((category) => (
                        <TableRow key={category.id}>
                          <TableCell>{category.id}</TableCell>
                          <TableCell>
                            {editingCategory?.id === category.id ? (
                              <Input
                                value={editingCategory.name}
                                onChange={(e) =>
                                  setEditingCategory({ ...editingCategory, name: e.target.value })
                                }
                                autoFocus
                              />
                            ) : (
                              category.name
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {editingCategory?.id === category.id ? (
                              <div className="flex justify-end gap-2">
                                <Button size="sm" onClick={handleUpdateCategory} disabled={isActionLoading}>
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={cancelEditing}
                                  disabled={isActionLoading}
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => startEditing(category)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="text-red-500 hover:text-red-600"
                                  onClick={() => openDeleteDialog(category)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {categories.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-6 text-gray-500">
                            No categories found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the category "{categoryToDelete?.name}". This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isActionLoading}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteCategory} disabled={isActionLoading}>
                {isActionLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default AdminCategories;