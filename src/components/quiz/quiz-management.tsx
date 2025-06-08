import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit2, Trash2, HelpCircle, CheckCircle, XCircle } from 'lucide-react';
import { Quiz } from '@/types/api';
import { QuizService } from '@/services/quiz-service';
import { toast } from '@/components/ui/use-toast';

interface QuizManagementProps {
  lessonId?: number; // Make lessonId optional for course-level management
  courseId: number;
  lessonTitle: string;
  onQuizChange?: () => void;
  lessons?: Array<{ id: number; title: string; }>; // Add lessons for selection
}

interface QuizFormData {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
}

const initialFormData: QuizFormData = {
  question: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  correctAnswer: 'A',
  explanation: ''
};

export function QuizManagement({ lessonId, courseId, lessonTitle, onQuizChange, lessons }: QuizManagementProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentQuizId, setCurrentQuizId] = useState<number | null>(null);
  const [formData, setFormData] = useState<QuizFormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState<number | undefined>(lessonId);

  useEffect(() => {
    if (selectedLessonId) {
      loadQuizzes();
    } else {
      // If no lesson is selected, load all course quizzes
      loadAllCourseQuizzes();
    }
  }, [selectedLessonId, courseId]);
  const loadQuizzes = async () => {
    if (!selectedLessonId) return;
    
    setIsLoading(true);
    try {
      const quizData = await QuizService.getQuizzesByLessonId(selectedLessonId, courseId);
      console.log('=== LOAD QUIZZES DEBUG ===');
      console.log('Lesson ID:', selectedLessonId);
      console.log('Course ID:', courseId);
      console.log('Loaded quizzes:', JSON.stringify(quizData, null, 2));
      console.log('==========================');
      setQuizzes(quizData);
    } catch (error) {
      console.error('Error loading quizzes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load quizzes. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllCourseQuizzes = async () => {
    setIsLoading(true);
    try {
      const quizData = await QuizService.getAllCourseQuizzes(courseId);
      setQuizzes(quizData);
    } catch (error) {
      console.error('Error loading course quizzes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load quizzes. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddQuiz = () => {
    setIsEditing(false);
    setCurrentQuizId(null);
    setFormData(initialFormData);
    setIsDialogOpen(true);
  };  const handleEditQuiz = (quiz: Quiz) => {
    setIsEditing(true);
    setCurrentQuizId(quiz.id!);
    setSelectedLessonId(quiz.lessonId); // Set the lesson ID for the quiz being edited
    setFormData({
      question: quiz.question,
      optionA: quiz.optionA,
      optionB: quiz.optionB,
      optionC: quiz.optionC || '',
      optionD: quiz.optionD || '',
      correctAnswer: quiz.correctAnswer,
      explanation: quiz.explanation || ''
    });
    setIsDialogOpen(true);
  };const handleSaveQuiz = async () => {
    if (!formData.question.trim() || !formData.optionA.trim() || !formData.optionB.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields (question, option A, and option B).',
        variant: 'destructive'
      });
      return;
    }

    if (lessons && lessons.length > 0 && !selectedLessonId) {
      toast({
        title: 'Validation Error',
        description: 'Please select a lesson for this quiz.',
        variant: 'destructive'
      });
      return;
    }    setIsSaving(true);
    try {
      if (isEditing && currentQuizId) {
        // For updates, only send defined values
        const updateData: any = {
          id: currentQuizId,
          question: formData.question,
          optionA: formData.optionA,
          optionB: formData.optionB,
          correctAnswer: formData.correctAnswer,
          courseId,
          lessonId: selectedLessonId || lessonId || 1
        };
        
        // Only add optional fields if they have values
        if (formData.optionC && formData.optionC.trim()) {
          updateData.optionC = formData.optionC;
        }
        if (formData.optionD && formData.optionD.trim()) {
          updateData.optionD = formData.optionD;
        }
        if (formData.explanation && formData.explanation.trim()) {
          updateData.explanation = formData.explanation;
        }
          console.log('=== UPDATE QUIZ DEBUG ===');
        console.log('Current Quiz ID:', currentQuizId, 'Type:', typeof currentQuizId);
        console.log('Selected Lesson ID:', selectedLessonId, 'Type:', typeof selectedLessonId);
        console.log('Course ID:', courseId, 'Type:', typeof courseId);
        console.log('Update data being sent:', JSON.stringify(updateData, null, 2));
        
        // Verify the quiz exists before updating
        console.log('Verifying quiz exists...');
        const existingQuiz = await QuizService.getQuizById(currentQuizId);
        if (!existingQuiz) {
          console.error('Quiz not found in database! Quiz ID:', currentQuizId);
          toast({
            title: 'Error',
            description: 'Quiz not found. It may have been deleted by another user.',
            variant: 'destructive'
          });
          setIsDialogOpen(false);
          setFormData(initialFormData);
          // Reload quizzes to refresh the list
          if (selectedLessonId) {
            await loadQuizzes();
          } else {
            await loadAllCourseQuizzes();
          }
          return;
        }
        console.log('Quiz exists in database:', JSON.stringify(existingQuiz, null, 2));
        console.log('========================');
        
        await QuizService.updateQuiz(updateData);
        toast({
          title: 'Success',
          description: 'Quiz updated successfully!'
        });} else {
        // For new quiz creation
        const newQuizData: any = {
          question: formData.question,
          optionA: formData.optionA,
          optionB: formData.optionB,
          correctAnswer: formData.correctAnswer,
          courseId,
          lessonId: selectedLessonId || lessonId || 1
        };
        
        // Only add optional fields if they have values
        if (formData.optionC && formData.optionC.trim()) {
          newQuizData.optionC = formData.optionC;
        }
        if (formData.optionD && formData.optionD.trim()) {
          newQuizData.optionD = formData.optionD;
        }
        if (formData.explanation && formData.explanation.trim()) {
          newQuizData.explanation = formData.explanation;
        }
        
        await QuizService.addQuiz(newQuizData);
        toast({
          title: 'Success',
          description: 'Quiz created successfully!'
        });
      }setIsDialogOpen(false);
      setFormData(initialFormData);
      if (selectedLessonId) {
        await loadQuizzes();
      } else {
        await loadAllCourseQuizzes();
      }
      
      if (onQuizChange) {
        onQuizChange();      }
    } catch (error) {
      console.error('=== ERROR SAVING QUIZ ===');
      console.error('Error object:', error);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('========================');
      
      let errorMessage = 'Failed to save quiz. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('database operation was expected to affect 1 row(s), but actually affected 0 row(s)')) {
          errorMessage = 'Quiz not found or was modified by another user. Please refresh and try again.';
        } else if (error.message.includes('404')) {
          errorMessage = 'Quiz endpoint not found. Please contact support.';
        } else if (error.message.includes('401') || error.message.includes('unauthorized')) {
          errorMessage = 'Authentication required. Please log in again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteQuiz = async (quizId: number) => {
    try {
      await QuizService.deleteQuiz(quizId);      toast({
        title: 'Success',
        description: 'Quiz deleted successfully!'
      });
      if (selectedLessonId) {
        await loadQuizzes();
      } else {
        await loadAllCourseQuizzes();
      }
      
      if (onQuizChange) {
        onQuizChange();
      }
    } catch (error) {
      console.error('Error deleting quiz:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete quiz. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const getCorrectAnswerText = (quiz: Quiz): string => {
    switch (quiz.correctAnswer) {
      case 'A': return quiz.optionA;
      case 'B': return quiz.optionB;
      case 'C': return quiz.optionC || '';
      case 'D': return quiz.optionD || '';
      default: return '';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Lesson Selector - only show if lessons are provided */}
      {lessons && lessons.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Label htmlFor="lesson-select" className="text-sm font-medium">
                Select Lesson:
              </Label>              <Select
                value={selectedLessonId?.toString() || "all"}
                onValueChange={(value) => setSelectedLessonId(value === "all" ? undefined : parseInt(value))}
              >
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Select a lesson to manage quizzes" />
                </SelectTrigger>                <SelectContent>
                  <SelectItem value="all">All Course Quizzes</SelectItem>
                  {lessons.map((lesson) => (
                    <SelectItem key={lesson.id} value={lesson.id.toString()}>
                      {lesson.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Quiz Management</h3>
          <p className="text-sm text-muted-foreground">
            {selectedLessonId 
              ? `Lesson: ${lessons?.find(l => l.id === selectedLessonId)?.title || lessonTitle}`
              : `Course: ${lessonTitle}`
            }
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddQuiz} disabled={!selectedLessonId && lessons && lessons.length > 0}>
              <Plus className="h-4 w-4 mr-2" />
              Add Quiz
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? 'Edit Quiz' : 'Create New Quiz'}
              </DialogTitle>
            </DialogHeader>
              <div className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="question">Question *</Label>
                <Textarea
                  id="question"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="Enter your question"
                  rows={3}
                />
              </div>

              <div className="grid gap-4">
                <Label>Answer Options</Label>
                
                <div className="grid gap-2">
                  <Label htmlFor="optionA" className="text-sm">Option A *</Label>
                  <Input
                    id="optionA"
                    value={formData.optionA}
                    onChange={(e) => setFormData({ ...formData, optionA: e.target.value })}
                    placeholder="Enter option A"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="optionB" className="text-sm">Option B *</Label>
                  <Input
                    id="optionB"
                    value={formData.optionB}
                    onChange={(e) => setFormData({ ...formData, optionB: e.target.value })}
                    placeholder="Enter option B"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="optionC" className="text-sm">Option C (Optional)</Label>
                  <Input
                    id="optionC"
                    value={formData.optionC}
                    onChange={(e) => setFormData({ ...formData, optionC: e.target.value })}
                    placeholder="Enter option C"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="optionD" className="text-sm">Option D (Optional)</Label>
                  <Input
                    id="optionD"
                    value={formData.optionD}
                    onChange={(e) => setFormData({ ...formData, optionD: e.target.value })}
                    placeholder="Enter option D"
                  />
                </div>
              </div>              <div className="grid gap-2">
                <Label htmlFor="correctAnswer">Correct Answer *</Label>
                <Select value={formData.correctAnswer} onValueChange={(value: 'A' | 'B' | 'C' | 'D') => setFormData({ ...formData, correctAnswer: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select correct answer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    {formData.optionC && <SelectItem value="C">C</SelectItem>}
                    {formData.optionD && <SelectItem value="D">D</SelectItem>}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="explanation">Explanation (Optional)</Label>
                <Textarea
                  id="explanation"
                  value={formData.explanation}
                  onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                  placeholder="Provide an explanation for the correct answer"
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveQuiz} disabled={isSaving}>
                {isSaving ? 'Saving...' : isEditing ? 'Update Quiz' : 'Create Quiz'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {quizzes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <HelpCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">No quizzes created for this lesson yet.</p>
            <Button onClick={handleAddQuiz}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Quiz
            </Button>
          </CardContent>
        </Card>
      ) : (        <div className="grid gap-4">
          {quizzes.map((quiz) => (
            <Card key={quiz.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg line-clamp-2">{quiz.question}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditQuiz(quiz)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Quiz</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this quiz? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteQuiz(quiz.id!)}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label className="text-sm font-medium">Options:</Label>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant={quiz.correctAnswer === 'A' ? "default" : "outline"} className="w-6 h-6 text-xs">A</Badge>
                        <span>{quiz.optionA}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={quiz.correctAnswer === 'B' ? "default" : "outline"} className="w-6 h-6 text-xs">B</Badge>
                        <span>{quiz.optionB}</span>
                      </div>
                      {quiz.optionC && (
                        <div className="flex items-center gap-2">
                          <Badge variant={quiz.correctAnswer === 'C' ? "default" : "outline"} className="w-6 h-6 text-xs">C</Badge>
                          <span>{quiz.optionC}</span>
                        </div>
                      )}
                      {quiz.optionD && (
                        <div className="flex items-center gap-2">
                          <Badge variant={quiz.correctAnswer === 'D' ? "default" : "outline"} className="w-6 h-6 text-xs">D</Badge>
                          <span>{quiz.optionD}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Correct Answer:</Label>
                    <p className="text-sm text-green-600 font-medium">
                      {quiz.correctAnswer}. {getCorrectAnswerText(quiz)}
                    </p>
                  </div>

                  {quiz.explanation && (
                    <div>
                      <Label className="text-sm font-medium">Explanation:</Label>
                      <p className="text-sm text-muted-foreground mt-1">{quiz.explanation}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
