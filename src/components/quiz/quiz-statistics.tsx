import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Users, Target, Award } from 'lucide-react';

interface QuizStatisticsProps {
  courseId: number;
  lessonId?: number;
}

interface QuizStats {
  totalQuizzes: number;
  totalAttempts: number;
  averageScore: number;
  passRate: number;  popularQuizzes: Array<{
    id: number;
    question: string;
    attempts: number;
    averageScore: number;
  }>;
  difficultyAnalysis: Array<{
    quizId: number;
    question: string;
    correctAnswerRate: number;
    difficulty: 'Easy' | 'Medium' | 'Hard';
  }>;
}

export function QuizStatistics({ courseId, lessonId }: QuizStatisticsProps) {
  const [stats, setStats] = useState<QuizStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, [courseId, lessonId]);

  const loadStatistics = async () => {
    setIsLoading(true);
    try {
      // Mock data for now - replace with actual API call
      const mockStats: QuizStats = {
        totalQuizzes: 12,
        totalAttempts: 256,
        averageScore: 78.5,
        passRate: 82.3,        popularQuizzes: [
          { id: 1, question: "What is the correct way to declare a variable in JavaScript?", attempts: 45, averageScore: 85.2 },
          { id: 2, question: "How do you center a div using CSS Flexbox?", attempts: 38, averageScore: 72.8 },
          { id: 3, question: "Which HTML tag is used for the largest heading?", attempts: 42, averageScore: 89.1 }
        ],
        difficultyAnalysis: [
          { quizId: 1, question: "What is a variable in programming?", correctAnswerRate: 92, difficulty: 'Easy' },
          { quizId: 2, question: "How do closures work in JavaScript?", correctAnswerRate: 65, difficulty: 'Medium' },
          { quizId: 3, question: "Explain the event loop in Node.js", correctAnswerRate: 41, difficulty: 'Hard' }
        ]
      };
      
      setStats(mockStats);
    } catch (error) {
      console.error('Error loading quiz statistics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Hard': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getDifficultyTextColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600';
      case 'Medium': return 'text-yellow-600';
      case 'Hard': return 'text-red-600';
      default: return 'text-gray-600';
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

  if (!stats) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No quiz statistics available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Quiz Analytics</h3>
        
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-blue-500 mb-2" />
                <div className="ml-3">
                  <p className="text-2xl font-bold">{stats.totalQuizzes}</p>
                  <p className="text-sm text-muted-foreground">Total Quizzes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-500 mb-2" />
                <div className="ml-3">
                  <p className="text-2xl font-bold">{stats.totalAttempts}</p>
                  <p className="text-sm text-muted-foreground">Total Attempts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-500 mb-2" />
                <div className="ml-3">
                  <p className="text-2xl font-bold">{stats.averageScore}%</p>
                  <p className="text-sm text-muted-foreground">Average Score</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Award className="h-8 w-8 text-yellow-500 mb-2" />
                <div className="ml-3">
                  <p className="text-2xl font-bold">{stats.passRate}%</p>
                  <p className="text-sm text-muted-foreground">Pass Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Popular Quizzes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Most Attempted Quizzes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.popularQuizzes.map((quiz, index) => (
                  <div key={quiz.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                        {index + 1}
                      </Badge>                      <div>
                        <p className="font-medium">{quiz.question}</p>
                        <p className="text-sm text-muted-foreground">{quiz.attempts} attempts</p>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {quiz.averageScore.toFixed(1)}% avg
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Difficulty Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Difficulty Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">                {stats.difficultyAnalysis.map((analysis) => (
                  <div key={analysis.quizId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{analysis.question}</span>
                      <Badge 
                        variant="outline" 
                        className={getDifficultyTextColor(analysis.difficulty)}
                      >
                        {analysis.difficulty}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={analysis.correctAnswerRate} 
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground min-w-[3rem]">
                        {analysis.correctAnswerRate}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Correct answer rate
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600 mb-2">
                  {stats.difficultyAnalysis.filter(q => q.difficulty === 'Easy').length}
                </div>
                <div className="text-sm text-muted-foreground">Easy Quizzes</div>
                <div className="text-xs text-green-600 mt-1">
                  Good for building confidence
                </div>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-yellow-600 mb-2">
                  {stats.difficultyAnalysis.filter(q => q.difficulty === 'Medium').length}
                </div>
                <div className="text-sm text-muted-foreground">Medium Quizzes</div>
                <div className="text-xs text-yellow-600 mt-1">
                  Perfect for skill development
                </div>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-red-600 mb-2">
                  {stats.difficultyAnalysis.filter(q => q.difficulty === 'Hard').length}
                </div>
                <div className="text-sm text-muted-foreground">Hard Quizzes</div>
                <div className="text-xs text-red-600 mt-1">
                  Challenge advanced learners
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
