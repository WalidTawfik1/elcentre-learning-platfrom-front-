import React from 'react';

interface RichTextViewerProps {
  content: string;
  className?: string;
}

export const RichTextViewer: React.FC<RichTextViewerProps> = ({
  content,
  className = ""
}) => {
  if (!content || !content.trim()) {
    return (
      <div className={`text-muted-foreground ${className}`}>
        No content available.
      </div>
    );
  }

  return (
    <div 
      className={`whitespace-pre-wrap ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};
