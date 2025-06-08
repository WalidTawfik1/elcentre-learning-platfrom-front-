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
  onQuizComplete?: (score: QuizScore) => void;
}

export function QuizTaking({ lessonId, onQuizComplete }: QuizTakingProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [answeredQuizzes, setAnsweredQuizzes] = useState<StudentQuizProgress[]>([]);
  const [score, setScore] = useState<QuizScore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);

  useEffect(() => {
    loadQuizzes();
  }, [lessonId]);
  const loadQuizzes = async () => {
    setIsLoading(true);
    try {
      // Load quizzes for this lesson
      const quizData = await QuizService.getQuizzesByLessonId(lessonId);
      setQuizzes(quizData);

      // Load existing answers
      const answered = await QuizService.getStudentQuizzesByLesson(lessonId);
      setAnsweredQuizzes(answered);

      // Load current score
      const currentScore = await QuizService.getTotalScore(lessonId);
      setScore(currentScore);

      // Check if all quizzes are completed
      if (quizData.length > 0 && answered.length >= quizData.length) {
        setQuizCompleted(true);
      }
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

  const handleAnswerSubmit = async () => {
    if (!selectedAnswer || currentQuizIndex >= quizzes.length) return;

    setIsSubmitting(true);
    try {
      const currentQuiz = quizzes[currentQuizIndex];
      const result = await QuizService.submitQuizAnswer(currentQuiz.id, selectedAnswer);
        // Update answered quizzes
      const newAnswer: StudentQuizProgress = {
        quizId: currentQuiz.id,
        quizTitle: currentQuiz.question,
        selectedAnswer,
        correctAnswer: currentQuiz.correctAnswer,
        isCorrect: result.isCorrect,
        answeredAt: result.answeredAt
      };
      
      setAnsweredQuizzes(prev => [...prev, newAnswer]);

      // Show result feedback
      if (result.isCorrect) {
        toast({
          title: 'Correct!',
          description: 'Well done! That\'s the right answer.',
        });
      } else {
        toast({
          title: 'Incorrect',
          description: `The correct answer was ${currentQuiz.correctAnswer}.`,
          variant: 'destructive'
        });
      }

      // Move to next quiz or complete
      if (currentQuizIndex < quizzes.length - 1) {
        setCurrentQuizIndex(prev => prev + 1);
        setSelectedAnswer(null);
      } else {
        // All quizzes completed
        setQuizCompleted(true);
        const finalScore = await QuizService.getTotalScore(lessonId);
        setScore(finalScore);
        
        if (onQuizComplete) {
          onQuizComplete(finalScore);
        }
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit answer. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAnswerLabel = (option: 'A' | 'B' | 'C' | 'D', text: string | undefined) => {
    if (!text) return null;
    return `${option}. ${text}`;
  };

  const isQuizAnswered = (quizId: number) => {
    return answeredQuizzes.some(answered => answered.quizId === quizId);
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
        </CardContent>
      </Card>
    );
  }

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
            </div>

            {/* Show review of answers */}
            <div className="mt-6 space-y-3">
              <h4 className="font-semibold">Review Your Answers:</h4>
              {answeredQuizzes.map((answer, index) => (
                <div key={answer.quizId} className="flex items-center justify-between p-3 border rounded">
                  <span className="text-sm">Question {index + 1}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Your answer: {answer.selectedAnswer}</Badge>
                    <Badge variant="outline">Correct: {answer.correctAnswer}</Badge>
                    {answer.isCorrect ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentQuiz = quizzes[currentQuizIndex];
  const progress = ((currentQuizIndex + answeredQuizzes.length) / quizzes.length) * 100;

  return (
    <Card>
      <CardHeader>        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {currentQuiz.question}
          </CardTitle>
          <Badge variant="outline">
            Question {currentQuizIndex + 1} of {quizzes.length}
          </Badge>
        </div>
        <Progress value={progress} className="w-full" />
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">{currentQuiz.question}</h3>
          
          <RadioGroup value={selectedAnswer || ''} onValueChange={(value) => setSelectedAnswer(value as 'A' | 'B' | 'C' | 'D')}>
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
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          onClick={handleAnswerSubmit}
          disabled={!selectedAnswer || isSubmitting || isQuizAnswered(currentQuiz.id)}
          className="w-full"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Answer'}
        </Button>
      </CardFooter>
    </Card>
  );
}
