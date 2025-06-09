import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Clock, Trophy } from 'lucide-react';
import { Quiz, StudentQuizProgress, QuizScore } from '@/types/api';
import { QuizService } from '@/services/quiz-service';
import { toast } from '@/components/ui/use-toast';

interface QuizTakingProps {
  lessonId: number;
  courseId?: number;
  onQuizComplete?: (score: QuizScore) => void;
}

export function QuizTaking({ lessonId, courseId, onQuizComplete }: QuizTakingProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [localAnswers, setLocalAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D'>>({});
  const [answeredQuizzes, setAnsweredQuizzes] = useState<StudentQuizProgress[]>([]);
  const [score, setScore] = useState<QuizScore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);  const [quizCompleted, setQuizCompleted] = useState(false);
  
  // Debug state to show API responses
  const [debugInfo, setDebugInfo] = useState<any>(null);
  useEffect(() => {
    loadQuizzes();
  }, [lessonId, courseId]);

  // Load saved answers from localStorage on component mount
  useEffect(() => {
    const savedAnswers = localStorage.getItem(`quiz-answers-${lessonId}`);
    if (savedAnswers) {
      setLocalAnswers(JSON.parse(savedAnswers));
    }
  }, [lessonId]);  // Save answers to localStorage whenever they change
  useEffect(() => {
    if (Object.keys(localAnswers).length > 0) {
      localStorage.setItem(`quiz-answers-${lessonId}`, JSON.stringify(localAnswers));
    }
  }, [localAnswers, lessonId]);
  const loadQuizzes = async () => {
    setIsLoading(true);
    try {
      // Load quizzes for this lesson
      const quizData = await QuizService.getQuizzesByLessonId(lessonId, courseId);
      setQuizzes(quizData);

      // Load existing answers
      const answered = await QuizService.getStudentQuizzesByLesson(lessonId);
      setAnsweredQuizzes(answered);

      // Load current score
      const currentScore = await QuizService.getTotalScore(lessonId);
      setScore(currentScore);
      
      // Store debug information
      setDebugInfo({
        lessonId,
        courseId,
        quizCount: quizData.length,
        answeredCount: answered.length,
        currentScore,
        allQuizzes: quizData
      });

      // Check if all quizzes are completed
      if (quizData.length > 0 && answered.length >= quizData.length) {
        setQuizCompleted(true);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load quizzes. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };  const handleAnswerChange = (quizId: number, answer: 'A' | 'B' | 'C' | 'D') => {
    setLocalAnswers(prev => ({
      ...prev,
      [quizId]: answer
    }));
  };

  const handleSubmitAllAnswers = async () => {
    if (Object.keys(localAnswers).length === 0) {
      toast({
        title: 'No Answers',
        description: 'Please answer at least one question before submitting.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    const submittedAnswers: StudentQuizProgress[] = [];
    
    try {      // Submit each answer
      for (const [quizIdStr, answer] of Object.entries(localAnswers)) {
        const quizId = parseInt(quizIdStr);
        const quiz = quizzes.find(q => q.id === quizId);
          if (quiz) {
          const result = await QuizService.submitQuizAnswer(quizId, answer);
          
          // Check if the answer is correct by comparing the selected answer with the correct answer
          const isCorrect = answer === quiz.correctAnswer;
          
          submittedAnswers.push({
            quizId,
            quizTitle: quiz.question,
            selectedAnswer: answer,
            correctAnswer: quiz.correctAnswer,
            isCorrect,
            answeredAt: result.takenAt || new Date().toISOString()
          });
        }
      }

      // Update state with all submitted answers
      setAnsweredQuizzes(submittedAnswers);
      setQuizCompleted(true);
      
      // Get final score
      const finalScore = await QuizService.getTotalScore(lessonId);
      setScore(finalScore);
      
      // Clear local storage
      localStorage.removeItem(`quiz-answers-${lessonId}`);
      
      // Show success message
      toast({
        title: 'Quiz Submitted!',
        description: `You answered ${submittedAnswers.length} questions. Results are now available.`,
      });
      
      if (onQuizComplete) {
        onQuizComplete(finalScore);
      }    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit quiz answers. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuizIndex > 0) {
      setCurrentQuizIndex(prev => prev - 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuizIndex < quizzes.length - 1) {
      setCurrentQuizIndex(prev => prev + 1);
    }
  };
  // Note: Quiz retaking has been disabled on the backend
  const getAnswerLabel = (option: 'A' | 'B' | 'C' | 'D', text: string | undefined) => {
    if (!text) return null;
    return `${option}. ${text}`;
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

  if (quizzes.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No quizzes available for this lesson.</p>
          
          {/* Debug information */}
          {debugInfo && (
            <div className="mt-4 p-4 bg-gray-50 border rounded text-left text-xs">
              <h4 className="font-bold mb-2">Debug Information:</h4>
              <div className="space-y-1">
                <p><strong>Lesson ID:</strong> {debugInfo.lessonId}</p>
                <p><strong>Course ID:</strong> {debugInfo.courseId}</p>
                <p><strong>Quiz Count:</strong> {debugInfo.quizCount}</p>
                <p><strong>Answered Count:</strong> {debugInfo.answeredCount}</p>
                <p><strong>Score:</strong> {debugInfo.currentScore ? JSON.stringify(debugInfo.currentScore, null, 2) : 'None'}</p>
                <p><strong>Raw Quizzes:</strong> {JSON.stringify(debugInfo.allQuizzes, null, 2)}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );  }

  if (quizCompleted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Quiz Completed!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="text-4xl font-bold text-blue-600">
              {score?.percentage || 0}%
            </div>
            <p className="text-muted-foreground">
              You scored {score?.correctAnswers || 0} out of {score?.totalQuizzes || 0} questions correctly
            </p>
            
            <Progress value={score?.percentage || 0} className="w-full" />
              <div className="flex justify-center">
              <Badge variant={score && score.percentage >= 70 ? "default" : "secondary"}>
                {score && score.percentage >= 70 ? "Passed" : "Needs Improvement"}
              </Badge>
            </div>            {/* Quiz completion notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900">Quiz Completed</span>
              </div>
              <p className="text-sm text-blue-800">
                This quiz has been completed and submitted. Quiz results are final and cannot be changed.
              </p>
            </div>{/* Show detailed review of answers */}
            <div className="mt-8 space-y-6 text-left">
              <div className="text-center">
                <h4 className="text-lg font-semibold mb-4">📝 Quiz Review</h4>
                
                {/* Performance Summary */}
                <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {answeredQuizzes.filter(a => a.isCorrect).length}
                    </div>
                    <div className="text-sm text-gray-600">Correct</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {answeredQuizzes.filter(a => !a.isCorrect).length}
                    </div>
                    <div className="text-sm text-gray-600">Incorrect</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {answeredQuizzes.length}
                    </div>
                    <div className="text-sm text-gray-600">Total</div>
                  </div>
                </div>
              </div>

              {answeredQuizzes.map((answer, index) => {
                const quiz = quizzes.find(q => q.id === answer.quizId);
                if (!quiz) return null;

                return (
                  <div key={answer.quizId} className="border rounded-lg p-6 space-y-4">
                    {/* Question Header */}
                    <div className="flex items-start justify-between">
                      <h5 className="font-medium text-lg">Question {index + 1}</h5>
                      <div className="flex items-center gap-2">
                        {answer.isCorrect ? (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Correct
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            Incorrect
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Question Text */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="font-medium text-gray-900">{quiz.question}</p>
                    </div>

                    {/* Answer Options */}
                    <div className="space-y-2">
                      {[
                        { letter: 'A', text: quiz.optionA },
                        { letter: 'B', text: quiz.optionB },
                        { letter: 'C', text: quiz.optionC },
                        { letter: 'D', text: quiz.optionD }
                      ].filter(option => option.text).map(option => {
                        const isCorrect = option.letter === quiz.correctAnswer;
                        const isSelected = option.letter === answer.selectedAnswer;
                        
                        let bgColor = 'bg-white border-gray-200';
                        let textColor = 'text-gray-700';
                        
                        if (isCorrect) {
                          bgColor = 'bg-green-50 border-green-200';
                          textColor = 'text-green-800';
                        } else if (isSelected && !isCorrect) {
                          bgColor = 'bg-red-50 border-red-200';
                          textColor = 'text-red-800';
                        }

                        return (
                          <div key={option.letter} className={`p-3 border rounded-lg ${bgColor}`}>
                            <div className="flex items-center gap-3">
                              <Badge 
                                variant={isCorrect ? "default" : isSelected ? "destructive" : "outline"}
                                className="w-6 h-6 text-xs flex items-center justify-center"
                              >
                                {option.letter}
                              </Badge>
                              <span className={`flex-1 ${textColor}`}>
                                {option.text}
                              </span>
                              {isCorrect && (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              )}
                              {isSelected && !isCorrect && (
                                <XCircle className="h-4 w-4 text-red-600" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Your Answer vs Correct Answer */}
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Your Answer:</span>
                        <Badge variant={answer.isCorrect ? "default" : "destructive"}>
                          {answer.selectedAnswer}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Correct Answer:</span>
                        <Badge variant="default" className="bg-green-600">
                          {quiz.correctAnswer}
                        </Badge>
                      </div>
                    </div>

                    {/* Explanation */}
                    {quiz.explanation && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center mt-0.5">
                            <span className="text-white text-xs font-bold">!</span>
                          </div>
                          <div>
                            <h6 className="font-medium text-blue-900 mb-1">Explanation:</h6>
                            <p className="text-blue-800 text-sm leading-relaxed">{quiz.explanation}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>                );
              })}            </div>
          </div>
        </CardContent>
      </Card>
    );
  }  const currentQuiz = quizzes[currentQuizIndex];
  const answeredCount = Object.keys(localAnswers).length;
  const questionsProgress = ((currentQuizIndex + 1) / quizzes.length) * 100;
  const currentAnswer = localAnswers[currentQuiz?.id] || null;

  return (
    <Card>
      <CardHeader>        <div className="flex items-center justify-between">
          <CardTitle>
            Quiz Progress
          </CardTitle>
          <Badge variant="outline">
            Question {currentQuizIndex + 1} of {quizzes.length}
          </Badge>
        </div>        <div className="space-y-2">
          <Progress value={questionsProgress} className="w-full" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Progress: {currentQuizIndex + 1}/{quizzes.length} questions</span>
            <span>Answered: {answeredCount}/{quizzes.length}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2 text-blue-900">
            Question {currentQuizIndex + 1}
          </h3>
          <p className="text-blue-800">{currentQuiz.question}</p>
        </div>
        
        <RadioGroup 
          value={currentAnswer || ''} 
          onValueChange={(value) => handleAnswerChange(currentQuiz.id, value as 'A' | 'B' | 'C' | 'D')}
        >
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="A" id="option-a" />
              <Label htmlFor="option-a" className="flex-1 cursor-pointer">
                {getAnswerLabel('A', currentQuiz.optionA)}
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="B" id="option-b" />
              <Label htmlFor="option-b" className="flex-1 cursor-pointer">
                {getAnswerLabel('B', currentQuiz.optionB)}
              </Label>
            </div>
            
            {currentQuiz.optionC && (
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="C" id="option-c" />
                <Label htmlFor="option-c" className="flex-1 cursor-pointer">
                  {getAnswerLabel('C', currentQuiz.optionC)}
                </Label>
              </div>
            )}
            
            {currentQuiz.optionD && (
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="D" id="option-d" />
                <Label htmlFor="option-d" className="flex-1 cursor-pointer">
                  {getAnswerLabel('D', currentQuiz.optionD)}
                </Label>
              </div>
            )}
          </div>
        </RadioGroup>

        {/* Answer status indicator */}
        {currentAnswer && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-800">
                Answer saved: Option {currentAnswer}
              </span>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div className="flex gap-2">
          <Button 
            onClick={handlePreviousQuestion}
            disabled={currentQuizIndex === 0}
            variant="outline"
            size="sm"
          >
            ← Previous
          </Button>
          <Button 
            onClick={handleNextQuestion}
            disabled={currentQuizIndex === quizzes.length - 1}
            variant="outline"
            size="sm"
          >
            Next →
          </Button>
        </div>
        
        <Button 
          onClick={handleSubmitAllAnswers}
          disabled={isSubmitting || answeredCount === 0}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSubmitting ? 'Submitting...' : `Submit Quiz (${answeredCount}/${quizzes.length})`}
        </Button>
      </CardFooter>
    </Card>
  );
}
