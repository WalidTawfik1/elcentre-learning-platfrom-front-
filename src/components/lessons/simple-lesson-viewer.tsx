import React from 'react';

interface SimpleLessonViewerProps {
  content: string;
  className?: string;
}

export const SimpleLessonViewer: React.FC<SimpleLessonViewerProps> = ({
  content,
  className = ""
}) => {
  if (!content || !content.trim()) {
    return (
      <div className={`text-muted-foreground ${className}`}>
        No content available for this lesson.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div 
        className={`prose max-w-none leading-relaxed ${className}`}
        dangerouslySetInnerHTML={{ __html: content }}
        style={{
          wordBreak: 'break-word',
          overflowWrap: 'break-word'
        }}
      />
    </div>
  );
};
