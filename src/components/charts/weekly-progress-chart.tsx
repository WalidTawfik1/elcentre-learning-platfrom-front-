import { useMemo } from "react";

interface CompletedLesson {
  lessonId: number;
  enrollmentId: number;
  completedDate: string;
}

interface WeeklyProgressChartProps {
  completedLessons: CompletedLesson[];
  className?: string;
}

export default function WeeklyProgressChart({ completedLessons, className }: WeeklyProgressChartProps) {
  // Calculate the data for the last 7 days
  const chartData = useMemo(() => {
    const today = new Date();
    const weekData = [];
    
    // Get the last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      // Count lessons completed on this date
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      const lessonsCount = completedLessons.filter(lesson => {
        const completedDate = new Date(lesson.completedDate);
        return completedDate >= dayStart && completedDate <= dayEnd;
      }).length;
      
      weekData.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        count: lessonsCount,
        date: date.toISOString().split('T')[0],
        isToday: date.toDateString() === today.toDateString()
      });
    }
    
    return weekData;
  }, [completedLessons]);
  
  // Calculate total lessons for the week
  const totalLessons = chartData.reduce((sum, day) => sum + day.count, 0);
  
  // Find the maximum count for scaling the bars
  const maxCount = Math.max(...chartData.map(day => day.count), 1);
  
  return (
    <div className={`bg-white rounded-xl shadow-md border border-gray-100 p-6 ${className}`}>
      {/* Header Section */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-1">
            Weekly Progress
          </h3>
          <p className="text-sm text-gray-500">
            Lessons completed this week
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-100 px-3 py-2 rounded-md">
          <span className="text-lg font-bold text-blue-600">{totalLessons}</span>
          <span className="text-sm text-blue-500 ml-1">total</span>
        </div>
      </div>
      
      {/* Chart Section */}
      <div className="flex items-end justify-between gap-3 h-32">
        {chartData.map((day) => {
          // Calculate bar height as percentage of max count
          const heightPercentage = maxCount > 0 && day.count > 0 ? (day.count / maxCount) * 100 : 0;
          const minHeight = 8; // Minimum height for empty bars
          const actualHeight = day.count > 0 ? Math.max(heightPercentage, 20) : minHeight;
          
          return (
            <div key={day.day} className="flex flex-col items-center flex-1">
              {/* Bar Container */}
              <div className="w-full flex items-end justify-center h-24 mb-3">
                <div className="relative w-8 bg-gray-200 rounded-md overflow-hidden">
                  {/* Background bar */}
                  <div className="w-full h-24 bg-gray-200 rounded-md"></div>
                  
                  {/* Progress fill */}
                  <div 
                    className={`absolute bottom-0 left-0 w-full transition-all duration-500 ease-out rounded-md ${
                      day.count > 0
                        ? day.isToday
                          ? 'bg-blue-500'
                          : 'bg-blue-400'
                        : 'bg-gray-200'
                    }`}
                    style={{
                      height: `${actualHeight}%`,
                      borderRadius: day.count > 0 ? '6px 6px 6px 6px' : '6px'
                    }}
                  />
                  
                  {/* Hover effect */}
                  <div className="absolute inset-0 hover:bg-black hover:bg-opacity-5 rounded-md transition-colors duration-200 cursor-pointer" 
                       title={`${day.count} lesson${day.count !== 1 ? 's' : ''} completed on ${day.day}${day.isToday ? ' (Today)' : ''}`}>
                  </div>
                </div>
              </div>
              
              {/* Day Label */}
              <div className={`text-sm font-medium ${
                day.isToday ? 'text-blue-600' : 'text-gray-600'
              }`}>
                {day.day}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
