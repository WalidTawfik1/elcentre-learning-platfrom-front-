import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  MessageSquare, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X,
  Send,
  ChevronDown,
  ChevronUp,
  Pin,
  PinOff,
  Flag
} from "lucide-react";
import { QAService, Question, Answer } from "@/services/qa-service";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/components/ui/use-toast";
import { getImageUrl } from "@/config/api-config";
import { getInitials } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface QAComponentProps {
  lessonId: number;
  lessonTitle: string;
  targetQuestionId?: number; // For navigation from notifications
  targetAnswerId?: number; // For navigation from notifications
}

// Safe date formatting utility
const formatSafeDate = (dateString?: string): string => {
  if (!dateString) return 'Recently';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Recently';
  try {
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    return 'Recently';
  }
};

export function QAComponent({ 
  lessonId, 
  lessonTitle, 
  targetQuestionId, 
  targetAnswerId 
}: QAComponentProps) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionAnswers, setQuestionAnswers] = useState<{ [key: number]: Answer[] }>({});
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState("");
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<{ id: number; text: string } | null>(null);
  const [editingAnswer, setEditingAnswer] = useState<{ id: number; text: string } | null>(null);
  const [answerInputs, setAnswerInputs] = useState<{ [key: number]: string }>({});
  const [submittingAnswers, setSubmittingAnswers] = useState<Set<number>>(new Set());
  const [reportingItem, setReportingItem] = useState<{ type: 'question' | 'answer'; id: number } | null>(null);
  const [reportReason, setReportReason] = useState("");

  useEffect(() => {
    fetchQuestions();
  }, [lessonId]);

  // Handle navigation to specific question/answer
  useEffect(() => {
    if (targetQuestionId && questions.length > 0) {
      // Expand the target question
      setExpandedQuestions(prev => new Set([...prev, targetQuestionId]));
      
      // Scroll to the target question after a delay
      setTimeout(() => {
        const element = document.getElementById(`question-${targetQuestionId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Add visual highlight effect
          element.classList.add('ring-2', 'ring-eduBlue-500', 'bg-eduBlue-50');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-eduBlue-500', 'bg-eduBlue-50');
          }, 3000);
        }
      }, 500);
    }
  }, [targetQuestionId, questions]);

  // Handle navigation to specific answer
  useEffect(() => {
    if (targetAnswerId && Object.keys(questionAnswers).length > 0) {
      // Find which question contains the target answer
      for (const [questionId, answers] of Object.entries(questionAnswers)) {
        if (answers.some(answer => answer.id === targetAnswerId)) {
          const qId = parseInt(questionId);
          setExpandedQuestions(prev => new Set([...prev, qId]));
          
          // Scroll to the target answer after a delay
          setTimeout(() => {
            const element = document.getElementById(`answer-${targetAnswerId}`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              // Add visual highlight effect
              element.classList.add('ring-2', 'ring-eduBlue-500', 'bg-eduBlue-50');
              setTimeout(() => {
                element.classList.remove('ring-2', 'ring-eduBlue-500', 'bg-eduBlue-50');
              }, 3000);
            }
          }, 500);
          break;
        }
      }
    }
  }, [targetAnswerId, questionAnswers]);

  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      const fetchedQuestions = await QAService.getAllLessonQuestions(lessonId);
      setQuestions(fetchedQuestions);
      
      // Fetch answers for each question
      const answersMap: { [key: number]: Answer[] } = {};
      for (const question of fetchedQuestions) {
        try {
          const answers = await QAService.getAllQuestionAnswers(question.id);
          answersMap[question.id] = answers;
        } catch (error) {
          console.error(`Error fetching answers for question ${question.id}:`, error);
          answersMap[question.id] = []; // Set empty array if answers fail to load
        }
      }
      setQuestionAnswers(answersMap);
    } catch (error) {
      console.error("Error fetching Q&A data:", error);
      toast({
        title: "Error",
        description: "Failed to load Q&A data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitQuestion = async () => {
    if (!newQuestion.trim()) return;

    setIsSubmittingQuestion(true);
    try {
      const question = await QAService.addQuestion(newQuestion.trim(), lessonId);
      
      setQuestions(prev => {
        const updated = [question, ...prev];
        return updated;
      });
      
      setQuestionAnswers(prev => ({ ...prev, [question.id]: [] }));
      setNewQuestion("");
      toast({
        title: "Success",
        description: "Your question has been posted!",
      });
      
      // Fallback: Refresh data to ensure UI is in sync
      setTimeout(() => {
        fetchQuestions();
      }, 500);
    } catch (error) {
      console.error("Error submitting question:", error);
      toast({
        title: "Error",
        description: "Failed to post question. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingQuestion(false);
    }
  };

  const handleUpdateQuestion = async (questionId: number, newText: string) => {
    if (!newText.trim()) return;

    try {
      const updatedQuestion = await QAService.updateQuestion(questionId, newText.trim());
      setQuestions(prev => prev.map(q => q.id === questionId ? updatedQuestion : q));
      setEditingQuestion(null);
      toast({
        title: "Success",
        description: "Question updated successfully!",
      });
      
      // Fallback: Refresh data to ensure UI is in sync
      setTimeout(() => {
        fetchQuestions();
      }, 500);
    } catch (error) {
      console.error("Error updating question:", error);
      toast({
        title: "Error",
        description: "Failed to update question. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    try {
      await QAService.deleteQuestion(questionId);
      setQuestions(prev => prev.filter(q => q.id !== questionId));
      setQuestionAnswers(prev => {
        const newAnswers = { ...prev };
        delete newAnswers[questionId];
        return newAnswers;
      });
      toast({
        title: "Success",
        description: "Question deleted successfully!",
      });
    } catch (error) {
      console.error("Error deleting question:", error);
      toast({
        title: "Error",
        description: "Failed to delete question. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmitAnswer = async (questionId: number) => {
    const answerText = answerInputs[questionId];
    if (!answerText?.trim()) return;

    setSubmittingAnswers(prev => new Set([...prev, questionId]));
    try {
      const answer = await QAService.addAnswer(answerText.trim(), questionId);
      
      setQuestionAnswers(prev => {
        const updated = {
          ...prev,
          [questionId]: [...(prev[questionId] || []), answer]
        };
        return updated;
      });
      
      setAnswerInputs(prev => ({ ...prev, [questionId]: "" }));
      toast({
        title: "Success",
        description: "Your answer has been posted!",
      });
      
      // Fallback: Refresh data to ensure UI is in sync
      setTimeout(() => {
        fetchQuestions();
      }, 500);
    } catch (error) {
      console.error("Error submitting answer:", error);
      toast({
        title: "Error",
        description: "Failed to post answer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmittingAnswers(prev => {
        const newSet = new Set(prev);
        newSet.delete(questionId);
        return newSet;
      });
    }
  };

  const handleUpdateAnswer = async (answerId: number, newText: string) => {
    if (!newText.trim()) return;

    try {
      const updatedAnswer = await QAService.updateAnswer(answerId, newText.trim());
      
      // Find which question this answer belongs to and update it
      setQuestionAnswers(prev => {
        const newAnswers = { ...prev };
        
        // Find the question that contains this answer
        for (const [questionId, answers] of Object.entries(newAnswers)) {
          const answerIndex = answers.findIndex(a => a.id === answerId);
          if (answerIndex !== -1) {
            // Update the specific answer
            newAnswers[parseInt(questionId)] = [
              ...answers.slice(0, answerIndex),
              updatedAnswer,
              ...answers.slice(answerIndex + 1)
            ];
            break;
          }
        }
        
        return newAnswers;
      });
      
      setEditingAnswer(null);
      toast({
        title: "Success",
        description: "Answer updated successfully!",
      });
      
      // Fallback: Refresh data to ensure UI is in sync
      setTimeout(() => {
        fetchQuestions();
      }, 500);
    } catch (error) {
      console.error("Error updating answer:", error);
      toast({
        title: "Error",
        description: "Failed to update answer. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAnswer = async (answerId: number, questionId: number) => {
    try {
      await QAService.deleteAnswer(answerId);
      setQuestionAnswers(prev => ({
        ...prev,
        [questionId]: prev[questionId].filter(a => a.id !== answerId)
      }));
      toast({
        title: "Success",
        description: "Answer deleted successfully!",
      });
    } catch (error) {
      console.error("Error deleting answer:", error);
      toast({
        title: "Error",
        description: "Failed to delete answer. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePinQuestion = async (questionId: number, isPinned: boolean) => {
    try {
      await QAService.pinQuestion(questionId, isPinned);
      setQuestions(prev => prev.map(q => 
        q.id === questionId ? { ...q, isPinned } : q
      ));
      toast({
        title: "Success",
        description: isPinned ? "Question pinned successfully!" : "Question unpinned successfully!",
      });
    } catch (error) {
      console.error("Error pinning/unpinning question:", error);
      toast({
        title: "Error",
        description: "Failed to pin/unpin question. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReportQA = async () => {
    if (!reportingItem || !reportReason.trim()) return;

    try {
      if (reportingItem.type === 'question') {
        await QAService.reportQA(reportingItem.id, undefined, reportReason.trim());
      } else {
        await QAService.reportQA(undefined, reportingItem.id, reportReason.trim());
      }
      
      toast({
        title: "Success",
        description: `${reportingItem.type === 'question' ? 'Question' : 'Answer'} reported successfully!`,
      });
      
      setReportingItem(null);
      setReportReason("");
    } catch (error) {
      console.error("Error reporting Q&A:", error);
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Check if user is instructor (can pin questions)
  const isInstructor = user?.userType === 'Instructor';

  const toggleQuestionExpansion = (questionId: number) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const canEditOrDelete = (createdById: string) => {
    return user?.id === createdById;
  };

  const canDelete = (createdById: string) => {
    return user?.id === createdById || isInstructor;
  };

  const canReport = (isContentFromInstructor: boolean) => {
    // Students can't report instructor content, instructors can report any content
    return isInstructor || !isContentFromInstructor;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="h-5 w-5 text-eduBlue-500" />
        <h2 className="text-xl font-semibold">Q&A for "{lessonTitle}"</h2>
        <Badge variant="outline" className="ml-auto">
          {questions.length} question{questions.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Ask a question form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Ask a Question
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="What would you like to know about this lesson?"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            className="min-h-[100px]"
          />
          <Button 
            onClick={handleSubmitQuestion}
            disabled={!newQuestion.trim() || isSubmittingQuestion}
            className="bg-eduBlue-500 hover:bg-eduBlue-600"
          >
            {isSubmittingQuestion ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Posting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Post Question
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Questions list */}
      <div className="space-y-4">
        {questions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                No questions yet
              </h3>
              <p className="text-muted-foreground">
                Be the first to ask a question about this lesson!
              </p>
            </CardContent>
          </Card>
        ) : (
          questions
            .filter(question => question && question.id)
            .sort((a, b) => {
              // Priority sorting:
              // 1. Pinned questions by instructors (highest priority)
              // 2. Pinned questions by students 
              // 3. Unpinned questions (lowest priority)
              
              const aIsInstructorPinned = a.isPinned && a.isInstructor;
              const bIsInstructorPinned = b.isPinned && b.isInstructor;
              const aIsStudentPinned = a.isPinned && !a.isInstructor;
              const bIsStudentPinned = b.isPinned && !b.isInstructor;
              
              // If one is instructor pinned and the other is not
              if (aIsInstructorPinned && !bIsInstructorPinned) return -1;
              if (!aIsInstructorPinned && bIsInstructorPinned) return 1;
              
              // If both are instructor pinned or both are not instructor pinned
              if (aIsInstructorPinned === bIsInstructorPinned) {
                // Then check if one is student pinned and the other is not
                if (aIsStudentPinned && !bIsStudentPinned) return -1;
                if (!aIsStudentPinned && bIsStudentPinned) return 1;
                
                // If both have the same pin status, sort by creation date (newest first)
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
              }
              
              return 0;
            })
            .map((question) => {
            const isExpanded = expandedQuestions.has(question.id);
            const answers = questionAnswers[question.id] || [];
            const isTargetQuestion = targetQuestionId === question.id;
            
            return (
              <Card 
                key={question.id} 
                id={`question-${question.id}`}
                className={`transition-all duration-300 ${
                  isTargetQuestion ? 'ring-2 ring-eduBlue-500 bg-eduBlue-50' : ''
                } ${question.isPinned ? 'border-l-4 border-l-blue-500' : ''}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={question.creatorImage ? getImageUrl(question.creatorImage) : ""} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(question.createdByName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {question.isPinned && (
                            <Pin className="h-4 w-4 text-blue-500" />
                          )}
                          <span className="font-medium">{question.createdByName}</span>
                          {question.isInstructor && (
                            <Badge variant="secondary" className="text-xs">
                              Instructor
                            </Badge>
                          )}
                          <span className="text-sm text-muted-foreground">
                            {formatSafeDate(question.createdAt)}
                          </span>
                          {question.isEdited && question.editedAt && (
                            <span className="text-xs text-muted-foreground">
                              (edited {formatSafeDate(question.editedAt)})
                            </span>
                          )}
                        </div>
                        
                        {editingQuestion?.id === question.id ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editingQuestion.text}
                              onChange={(e) => setEditingQuestion({ ...editingQuestion, text: e.target.value })}
                              className="min-h-[60px]"
                            />
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                onClick={() => handleUpdateQuestion(question.id, editingQuestion.text)}
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Save
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => setEditingQuestion(null)}
                              >
                                <X className="h-3 w-3 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-700">{question.question}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {isInstructor && !editingQuestion && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePinQuestion(question.id, !question.isPinned)}
                          className={question.isPinned ? "text-blue-500 hover:text-blue-700" : ""}
                          title={question.isPinned ? "Unpin question" : "Pin question"}
                        >
                          {question.isPinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                        </Button>
                      )}
                      {canEditOrDelete(question.createdById) && !editingQuestion && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingQuestion({ id: question.id, text: question.question })}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                      {canDelete(question.createdById) && !editingQuestion && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Question</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this question? This action cannot be undone and will also delete all answers.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteQuestion(question.id)}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      {canReport(question.isInstructor) && user?.id !== question.createdById && !editingQuestion && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setReportingItem({ type: 'question', id: question.id })}
                          className="text-orange-500 hover:text-orange-700"
                          title="Report question"
                        >
                          <Flag className="h-3 w-3" />
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleQuestionExpansion(question.id)}
                        className="ml-2"
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        <span className="ml-1 text-sm">
                          {answers.length} answer{answers.length !== 1 ? 's' : ''}
                        </span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0">
                    <div className="border-t pt-4 space-y-4">
                      {/* Answer form */}
                      <div className="space-y-3">
                        <Textarea
                          placeholder="Write your answer..."
                          value={answerInputs[question.id] || ""}
                          onChange={(e) => setAnswerInputs(prev => ({ ...prev, [question.id]: e.target.value }))}
                          className="min-h-[80px]"
                        />
                        <Button 
                          size="sm"
                          onClick={() => handleSubmitAnswer(question.id)}
                          disabled={!answerInputs[question.id]?.trim() || submittingAnswers.has(question.id)}
                          className="bg-eduBlue-500 hover:bg-eduBlue-600"
                        >
                          {submittingAnswers.has(question.id) ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              Posting...
                            </>
                          ) : (
                            <>
                              <Send className="h-3 w-3 mr-2" />
                              Post Answer
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Answers list */}
                      {answers.length > 0 && (
                        <div className="space-y-3 mt-4">
                          <h4 className="font-medium text-sm text-muted-foreground">Answers:</h4>
                          {answers.filter(answer => answer && answer.id).map((answer) => {
                            const isTargetAnswer = targetAnswerId === answer.id;
                            
                            return (
                              <div 
                                key={answer.id} 
                                id={`answer-${answer.id}`}
                                className={`bg-muted/30 rounded-lg p-4 transition-all duration-300 ${
                                  isTargetAnswer ? 'ring-2 ring-eduBlue-500 bg-eduBlue-50' : ''
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={answer.creatorImage ? getImageUrl(answer.creatorImage) : ""} />
                                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                      {getInitials(answer.createdByName)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="font-medium text-sm">{answer.createdByName}</span>
                                      {answer.isInstructor && (
                                        <Badge variant="secondary" className="text-xs">
                                          Instructor
                                        </Badge>
                                      )}
                                      <span className="text-xs text-muted-foreground">
                                        {formatSafeDate(answer.createdAt)}
                                      </span>
                                      {answer.isEdited && answer.editedAt && (
                                        <span className="text-xs text-muted-foreground">
                                          (edited {formatSafeDate(answer.editedAt)})
                                        </span>
                                      )}
                                    </div>
                                    
                                    {editingAnswer?.id === answer.id ? (
                                      <div className="space-y-2">
                                        <Textarea
                                          value={editingAnswer.text}
                                          onChange={(e) => setEditingAnswer({ ...editingAnswer, text: e.target.value })}
                                          className="min-h-[60px]"
                                        />
                                        <div className="flex gap-2">
                                          <Button 
                                            size="sm" 
                                            onClick={() => handleUpdateAnswer(answer.id, editingAnswer.text)}
                                          >
                                            <Check className="h-3 w-3 mr-1" />
                                            Save
                                          </Button>
                                          <Button 
                                            size="sm" 
                                            variant="outline" 
                                            onClick={() => setEditingAnswer(null)}
                                          >
                                            <X className="h-3 w-3 mr-1" />
                                            Cancel
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="text-sm text-gray-700">{answer.answer}</p>
                                    )}
                                  </div>
                                  
                                  {canEditOrDelete(answer.createdById) && !editingAnswer && (
                                    <div className="flex gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setEditingAnswer({ id: answer.id, text: answer.answer })}
                                      >
                                        <Edit2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  )}
                                  {canDelete(answer.createdById) && !editingAnswer && (
                                    <div className="flex gap-1">
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Delete Answer</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Are you sure you want to delete this answer? This action cannot be undone.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                              onClick={() => handleDeleteAnswer(answer.id, question.id)}
                                              className="bg-red-500 hover:bg-red-600"
                                            >
                                              Delete
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </div>
                                  )}
                                  {canReport(answer.isInstructor) && user?.id !== answer.createdById && !editingAnswer && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setReportingItem({ type: 'answer', id: answer.id })}
                                      className="text-orange-500 hover:text-orange-700"
                                      title="Report answer"
                                    >
                                      <Flag className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Report Dialog */}
      <Dialog open={!!reportingItem} onOpenChange={(open) => !open && setReportingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report {reportingItem?.type === 'question' ? 'Question' : 'Answer'}</DialogTitle>
            <DialogDescription>
              Please provide a reason for reporting this {reportingItem?.type}. Our moderators will review your report.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Please describe why you are reporting this content..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReportingItem(null);
                setReportReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReportQA}
              disabled={!reportReason.trim()}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Flag className="h-4 w-4 mr-2" />
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
