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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  HelpCircle, 
  CheckCircle, 
  XCircle, 
  Eye, 
  BarChart3, 
  Filter,
  Search,
  BookOpen,
  Clock,
  Target,
  Users,
  TrendingUp,
  Copy,
  Download,
  Settings
} from 'lucide-react';
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

interface QuizStats {
  totalQuizzes: number;
  hardestQuiz: string;
  easiestQuiz: string;
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
  const [filteredQuizzes, setFilteredQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentQuizId, setCurrentQuizId] = useState<number | null>(null);
  const [formData, setFormData] = useState<QuizFormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState<number | undefined>(lessonId);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('quizzes');
  const [previewQuiz, setPreviewQuiz] = useState<Quiz | null>(null);
  const [stats, setStats] = useState<QuizStats | null>(null);
  useEffect(() => {
    if (selectedLessonId) {
      loadQuizzes();
    } else {
      // If no lesson is selected, load all course quizzes
      loadAllCourseQuizzes();
    }
  }, [selectedLessonId, courseId]);
  useEffect(() => {
    // Filter quizzes based on search query and difficulty
    let filtered = quizzes;
    
    if (searchQuery) {
      filtered = filtered.filter(quiz => 
        quiz.question.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (filterDifficulty !== 'all') {
      filtered = filtered.filter(quiz => 
        getDifficultyLevel(quiz).toLowerCase() === filterDifficulty.toLowerCase()
      );
    }
    
    setFilteredQuizzes(filtered);
  }, [quizzes, searchQuery, filterDifficulty]);

  useEffect(() => {
    if (quizzes.length > 0) {
      calculateStats();
    }
  }, [quizzes]);  const calculateStats = () => {
    if (quizzes.length === 0) return;
    
    // Calculate real difficulty distribution
    const difficultyCount = { Easy: 0, Medium: 0, Hard: 0 };
    const quizDifficulties = quizzes.map(quiz => {
      const difficulty = getDifficultyLevel(quiz);
      difficultyCount[difficulty]++;
      return { quiz, difficulty };
    });

    // Find hardest and easiest quizzes based on actual difficulty assessment
    const hardQuizzes = quizDifficulties.filter(q => q.difficulty === 'Hard');
    const easyQuizzes = quizDifficulties.filter(q => q.difficulty === 'Easy');
    
    const realStats: QuizStats = {
      totalQuizzes: quizzes.length,
      hardestQuiz: hardQuizzes.length > 0 ? hardQuizzes[0].quiz.question : 
                   quizDifficulties.find(q => q.difficulty === 'Medium')?.quiz.question || 
                   quizzes[0]?.question || "No quizzes",
      easiestQuiz: easyQuizzes.length > 0 ? easyQuizzes[0].quiz.question :
                   quizDifficulties.find(q => q.difficulty === 'Medium')?.quiz.question ||
                   quizzes[0]?.question || "No quizzes"
    };
    
    setStats(realStats);
  };
  const getDifficultyLevel = (quiz: Quiz): 'Easy' | 'Medium' | 'Hard' => {
    let difficultyScore = 0;
    
    // Factor 1: Question length and complexity
    const questionLength = quiz.question.length;
    if (questionLength < 50) difficultyScore += 1; // Short questions tend to be easier
    else if (questionLength > 150) difficultyScore += 3; // Very long questions are harder
    else difficultyScore += 2; // Medium length
    
    // Factor 2: Number of answer options (more options = more confusing)
    const optionCount = [quiz.optionA, quiz.optionB, quiz.optionC, quiz.optionD].filter(Boolean).length;
    if (optionCount === 2) difficultyScore += 1; // True/false or binary choice
    else if (optionCount === 3) difficultyScore += 2; // Three options
    else difficultyScore += 3; // Four options (most confusing)
    
    // Factor 3: Presence of explanation (indicates complexity)
    if (quiz.explanation && quiz.explanation.length > 50) {
      difficultyScore += 2; // Detailed explanation suggests complex topic
    } else if (quiz.explanation) {
      difficultyScore += 1; // Basic explanation
    }
    
    // Factor 4: Question complexity indicators
    const complexityKeywords = ['analyze', 'evaluate', 'compare', 'synthesize', 'justify', 'critique', 'why', 'how', 'explain'];
    const hasComplexKeywords = complexityKeywords.some(keyword => 
      quiz.question.toLowerCase().includes(keyword)
    );
    if (hasComplexKeywords) difficultyScore += 2;
    
    // Factor 5: Option length variance (similar length options are harder to distinguish)
    const optionLengths = [quiz.optionA, quiz.optionB, quiz.optionC, quiz.optionD]
      .filter(Boolean)
      .map(option => option.length);
    const avgLength = optionLengths.reduce((sum, len) => sum + len, 0) / optionLengths.length;
    const variance = optionLengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / optionLengths.length;
    if (variance < 50) difficultyScore += 1; // Similar length options are trickier
    
    // Determine final difficulty
    if (difficultyScore <= 4) return 'Easy';
    if (difficultyScore <= 7) return 'Medium';
    return 'Hard';
  };

  const getDifficultyColor = (difficulty: 'Easy' | 'Medium' | 'Hard') => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Hard': return 'bg-red-100 text-red-800';
    }
  };
  const duplicateQuiz = (quiz: Quiz) => {
    setFormData({
      question: `Copy of ${quiz.question}`,
      optionA: quiz.optionA,
      optionB: quiz.optionB,
      optionC: quiz.optionC || '',
      optionD: quiz.optionD || '',
      correctAnswer: quiz.correctAnswer,
      explanation: quiz.explanation || ''
    });
    setIsEditing(false);
    setCurrentQuizId(null);
    setIsDialogOpen(true);
  };
  const loadQuizzes = async () => {
    if (!selectedLessonId) return;
    
    setIsLoading(true);
    try {
      const quizData = await QuizService.getQuizzesByLessonId(selectedLessonId, courseId);
      setQuizzes(quizData);
    } catch (error) {
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
      });    } finally {
      setIsLoading(false);
    }
  };

  const handleAddQuiz = () => {
    setIsEditing(false);
    setCurrentQuizId(null);
    setFormData(initialFormData);
    setIsDialogOpen(true);
  };

  const handleEditQuiz = (quiz: Quiz) => {
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
    });    setIsDialogOpen(true);
  };

  const handleSaveQuiz = async () => {
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
      });      return;
    }

    setIsSaving(true);
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
        }        if (formData.explanation && formData.explanation.trim()) {
          updateData.explanation = formData.explanation;
        }
        
        // Verify the quiz exists before updating
        const existingQuiz = await QuizService.getQuizById(currentQuizId);
        if (!existingQuiz) {
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
        
        await QuizService.updateQuiz(updateData);
        toast({
          title: 'Success',
          description: 'Quiz updated successfully!'
        });
      } else {
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
          description: 'Quiz created successfully!'        });
      }

      setIsDialogOpen(false);
      setFormData(initialFormData);
      if (selectedLessonId) {
        await loadQuizzes();      } else {
        await loadAllCourseQuizzes();
      }
      
      if (onQuizChange) {
        onQuizChange();
      }
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
      <Card className="border-0 shadow-md">
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
            <p className="text-sm text-muted-foreground">Loading quizzes...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Better Layout */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-blue-600" />
              Quiz Management
            </h2>
            <p className="text-sm text-gray-600">
              {selectedLessonId 
                ? `Managing quizzes for: ${lessons?.find(l => l.id === selectedLessonId)?.title || lessonTitle}`
                : `Managing all quizzes for course: ${lessonTitle}`
              }
            </p>            {stats && (
              <div className="flex items-center gap-4 mt-3">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  {stats.totalQuizzes} Quizzes
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {filteredQuizzes.filter(q => getDifficultyLevel(q) === 'Hard').length} Hard
                </Badge>
              </div>
            )}
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={handleAddQuiz} 
                disabled={!selectedLessonId && lessons && lessons.length > 0}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Quiz
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <Edit2 className="h-5 w-5" />
                      Edit Quiz
                    </>
                  ) : (
                    <>
                      <Plus className="h-5 w-5" />
                      Create New Quiz
                    </>
                  )}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                <div className="grid gap-3">
                  <Label htmlFor="question" className="text-sm font-semibold">Question *</Label>
                  <Textarea
                    id="question"
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    placeholder="Enter a clear and concise question..."
                    rows={3}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-sm font-semibold">Answer Options</Label>
                  
                  <div className="grid gap-3">
                    <div className="relative">
                      <Label htmlFor="optionA" className="text-sm font-medium text-green-700">Option A * (Required)</Label>
                      <Input
                        id="optionA"
                        value={formData.optionA}
                        onChange={(e) => setFormData({ ...formData, optionA: e.target.value })}
                        placeholder="Enter option A"
                        className="pl-8"
                      />
                      <span className="absolute left-3 top-8 text-xs font-bold text-green-600">A</span>
                    </div>

                    <div className="relative">
                      <Label htmlFor="optionB" className="text-sm font-medium text-green-700">Option B * (Required)</Label>
                      <Input
                        id="optionB"
                        value={formData.optionB}
                        onChange={(e) => setFormData({ ...formData, optionB: e.target.value })}
                        placeholder="Enter option B"
                        className="pl-8"
                      />
                      <span className="absolute left-3 top-8 text-xs font-bold text-green-600">B</span>
                    </div>

                    <div className="relative">
                      <Label htmlFor="optionC" className="text-sm font-medium text-gray-600">Option C (Optional)</Label>
                      <Input
                        id="optionC"
                        value={formData.optionC}
                        onChange={(e) => setFormData({ ...formData, optionC: e.target.value })}
                        placeholder="Enter option C (optional)"
                        className="pl-8"
                      />
                      <span className="absolute left-3 top-8 text-xs font-bold text-gray-500">C</span>
                    </div>

                    <div className="relative">
                      <Label htmlFor="optionD" className="text-sm font-medium text-gray-600">Option D (Optional)</Label>
                      <Input
                        id="optionD"
                        value={formData.optionD}
                        onChange={(e) => setFormData({ ...formData, optionD: e.target.value })}
                        placeholder="Enter option D (optional)"
                        className="pl-8"
                      />
                      <span className="absolute left-3 top-8 text-xs font-bold text-gray-500">D</span>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="correctAnswer" className="text-sm font-semibold">Correct Answer *</Label>
                  <Select value={formData.correctAnswer} onValueChange={(value: 'A' | 'B' | 'C' | 'D') => setFormData({ ...formData, correctAnswer: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select the correct answer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A - {formData.optionA || 'Option A'}</SelectItem>
                      <SelectItem value="B">B - {formData.optionB || 'Option B'}</SelectItem>
                      {formData.optionC && <SelectItem value="C">C - {formData.optionC}</SelectItem>}
                      {formData.optionD && <SelectItem value="D">D - {formData.optionD}</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="explanation" className="text-sm font-semibold">Explanation (Optional)</Label>
                  <Textarea
                    id="explanation"
                    value={formData.explanation}
                    onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                    placeholder="Provide a helpful explanation for the correct answer (recommended)"
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveQuiz} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : isEditing ? (
                    <>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Update Quiz
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Quiz
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Lesson Selector with Enhanced Design */}
      {lessons && lessons.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="lesson-select" className="text-sm font-medium">
                  Filter by Lesson:
                </Label>
              </div>
              <Select
                value={selectedLessonId?.toString() || "all"}
                onValueChange={(value) => setSelectedLessonId(value === "all" ? undefined : parseInt(value))}
              >
                <SelectTrigger className="w-full sm:w-[350px]">
                  <SelectValue placeholder="Select a lesson to manage quizzes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      All Course Quizzes
                    </div>
                  </SelectItem>
                  {lessons.map((lesson) => (
                    <SelectItem key={lesson.id} value={lesson.id.toString()}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        {lesson.title}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modern Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="quizzes" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Quizzes ({filteredQuizzes.length})
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quizzes" className="space-y-6">
          {/* Search and Filter Bar */}
          <Card className="border-0 shadow-sm bg-gray-50/50">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search quizzes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Difficulty</SelectItem>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Quiz Grid */}
          {filteredQuizzes.length === 0 ? (
            <Card className="border-0 shadow-md">
              <CardContent className="text-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <HelpCircle className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">No quizzes found</h3>
                    <p className="text-muted-foreground max-w-md">
                      {searchQuery || filterDifficulty !== 'all' 
                        ? "Try adjusting your search or filter criteria."
                        : "Get started by creating your first quiz for this lesson."
                      }
                    </p>
                  </div>
                  {(!searchQuery && filterDifficulty === 'all') && (
                    <Button onClick={handleAddQuiz} size="lg" className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Quiz
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {filteredQuizzes.map((quiz) => {
                const difficulty = getDifficultyLevel(quiz);
                return (
                  <Card key={quiz.id} className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge className={`text-xs ${getDifficultyColor(difficulty)}`}>
                              {difficulty}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              ~2 min
                            </Badge>
                          </div>
                          <CardTitle className="text-lg leading-tight line-clamp-2">
                            {quiz.question}
                          </CardTitle>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPreviewQuiz(quiz)}
                            title="Preview Quiz"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => duplicateQuiz(quiz)}
                            title="Duplicate Quiz"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditQuiz(quiz)}
                            title="Edit Quiz"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" title="Delete Quiz">
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Quiz</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this quiz? This action cannot be undone and will remove all associated student responses.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteQuiz(quiz.id!)}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  Delete Quiz
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        <div className="grid gap-2">
                          <Label className="text-sm font-medium text-muted-foreground">Answer Options:</Label>
                          <div className="grid gap-2">
                            <div className={`flex items-center gap-3 p-2 rounded-lg ${quiz.correctAnswer === 'A' ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                              <Badge 
                                variant={quiz.correctAnswer === 'A' ? "default" : "outline"} 
                                className="w-6 h-6 text-xs flex items-center justify-center"
                              >
                                A
                              </Badge>
                              <span className="text-sm flex-1">{quiz.optionA}</span>
                              {quiz.correctAnswer === 'A' && <div className="w-2 h-2 rounded-full bg-green-500"></div>}
                            </div>
                            <div className={`flex items-center gap-3 p-2 rounded-lg ${quiz.correctAnswer === 'B' ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                              <Badge 
                                variant={quiz.correctAnswer === 'B' ? "default" : "outline"} 
                                className="w-6 h-6 text-xs flex items-center justify-center"
                              >
                                B
                              </Badge>
                              <span className="text-sm flex-1">{quiz.optionB}</span>
                              {quiz.correctAnswer === 'B' && <div className="w-2 h-2 rounded-full bg-green-500"></div>}
                            </div>
                            {quiz.optionC && (
                              <div className={`flex items-center gap-3 p-2 rounded-lg ${quiz.correctAnswer === 'C' ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                                <Badge 
                                  variant={quiz.correctAnswer === 'C' ? "default" : "outline"} 
                                  className="w-6 h-6 text-xs flex items-center justify-center"
                                >
                                  C
                                </Badge>
                                <span className="text-sm flex-1">{quiz.optionC}</span>
                                {quiz.correctAnswer === 'C' && <div className="w-2 h-2 rounded-full bg-green-500"></div>}
                              </div>
                            )}
                            {quiz.optionD && (
                              <div className={`flex items-center gap-3 p-2 rounded-lg ${quiz.correctAnswer === 'D' ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                                <Badge 
                                  variant={quiz.correctAnswer === 'D' ? "default" : "outline"} 
                                  className="w-6 h-6 text-xs flex items-center justify-center"
                                >
                                  D
                                </Badge>
                                <span className="text-sm flex-1">{quiz.optionD}</span>
                                {quiz.correctAnswer === 'D' && <div className="w-2 h-2 rounded-full bg-green-500"></div>}
                              </div>
                            )}
                          </div>
                        </div>

                        {quiz.explanation && (
                          <div className="border-t pt-4">
                            <Label className="text-sm font-medium text-muted-foreground">Explanation:</Label>
                            <p className="text-sm text-gray-700 mt-1 leading-relaxed">{quiz.explanation}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-0 shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Quizzes</p>
                    <p className="text-2xl font-bold">{stats?.totalQuizzes || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Target className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Easy Quizzes</p>
                    <p className="text-2xl font-bold">{filteredQuizzes.filter(q => getDifficultyLevel(q) === 'Easy').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Medium Quizzes</p>
                    <p className="text-2xl font-bold">{filteredQuizzes.filter(q => getDifficultyLevel(q) === 'Medium').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Hard Quizzes</p>
                    <p className="text-2xl font-bold">{filteredQuizzes.filter(q => getDifficultyLevel(q) === 'Hard').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Difficulty Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['Easy', 'Medium', 'Hard'].map((difficulty) => {
                    const count = filteredQuizzes.filter(q => getDifficultyLevel(q) === difficulty).length;
                    const percentage = filteredQuizzes.length > 0 ? (count / filteredQuizzes.length) * 100 : 0;
                    const color = difficulty === 'Easy' ? 'bg-green-500' : difficulty === 'Medium' ? 'bg-yellow-500' : 'bg-red-500';
                    return (
                      <div key={difficulty} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{difficulty}</span>
                          <span className="text-muted-foreground">{count} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`${color} h-2 rounded-full transition-all duration-300`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {filteredQuizzes.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">No quizzes available for analysis</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Quiz Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-red-700">Most Complex Question</Label>
                  <p className="text-sm text-muted-foreground line-clamp-3 bg-red-50 p-3 rounded-lg">
                    {stats?.hardestQuiz || 'No quizzes available'}
                  </p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-green-700">Simplest Question</Label>
                  <p className="text-sm text-muted-foreground line-clamp-3 bg-green-50 p-3 rounded-lg">
                    {stats?.easiestQuiz || 'No quizzes available'}
                  </p>
                </div>
                <Separator />
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700">
                    💡 <strong>Tip:</strong> Aim for a balanced mix of difficulties. Ideal distribution: 40% Easy, 40% Medium, 20% Hard
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Quiz Settings</CardTitle>
              <p className="text-sm text-muted-foreground">Configure global quiz behavior and preferences</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Auto-save drafts</Label>
                    <p className="text-xs text-muted-foreground">Automatically save quiz drafts while editing</p>
                  </div>
                  <Button variant="outline" size="sm">Enable</Button>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Randomize options</Label>
                    <p className="text-xs text-muted-foreground">Shuffle answer options for each student</p>
                  </div>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Export quizzes</Label>
                    <p className="text-xs text-muted-foreground">Download quiz data in various formats</p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quiz Preview Dialog */}
      {previewQuiz && (
        <Dialog open={!!previewQuiz} onOpenChange={() => setPreviewQuiz(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Quiz Preview
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-3">{previewQuiz.question}</h3>
                <div className="space-y-2">
                  {[
                    { letter: 'A', text: previewQuiz.optionA },
                    { letter: 'B', text: previewQuiz.optionB },
                    previewQuiz.optionC && { letter: 'C', text: previewQuiz.optionC },
                    previewQuiz.optionD && { letter: 'D', text: previewQuiz.optionD }
                  ].filter(Boolean).map((option, index) => (
                    <div 
                      key={index}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        previewQuiz.correctAnswer === option!.letter 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        previewQuiz.correctAnswer === option!.letter 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {option!.letter}
                      </div>
                      <span>{option!.text}</span>
                      {previewQuiz.correctAnswer === option!.letter && (
                        <Badge variant="secondary" className="ml-auto">Correct</Badge>
                      )}
                    </div>
                  ))}
                </div>
                {previewQuiz.explanation && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Label className="text-sm font-medium text-blue-800">Explanation:</Label>
                    <p className="text-sm text-blue-700 mt-1">{previewQuiz.explanation}</p>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPreviewQuiz(null)}>
                Close Preview
              </Button>
              <Button onClick={() => {
                setPreviewQuiz(null);
                handleEditQuiz(previewQuiz);
              }}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Quiz
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
