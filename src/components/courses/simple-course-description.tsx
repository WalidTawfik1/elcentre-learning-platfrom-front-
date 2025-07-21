import React from 'react';

interface SimpleCourseDescriptionProps {
  description: string;
  className?: string;
}

export const SimpleCourseDescription: React.FC<SimpleCourseDescriptionProps> = ({
  description,
  className = ""
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  
  // Set character limit for truncation (count HTML as well)
  const CHARACTER_LIMIT = 300;
  
  // Check if description needs truncation based on text content
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = description;
  const textContent = tempDiv.textContent || tempDiv.innerText || '';
  const shouldTruncate = textContent.length > CHARACTER_LIMIT;
  
  // Get displayed content based on state
  let displayedContent = description;
  if (shouldTruncate && !isExpanded) {
    // Create truncated HTML content
    const truncatedText = textContent.slice(0, CHARACTER_LIMIT) + "...";
    displayedContent = truncatedText;
  }

  if (!description || !description.trim()) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">About This Course</h2>
        <p className="text-muted-foreground">No description has been provided for this course yet.</p>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">About This Course</h2>
      <div 
        className={`text-muted-foreground prose max-w-none ${className}`}
        dangerouslySetInnerHTML={{ __html: displayedContent }}
        style={{
          wordBreak: 'break-word',
          overflowWrap: 'break-word'
        }}
      />
      {shouldTruncate && (
        <button
          className="text-eduBlue-500 hover:text-eduBlue-600 font-medium ml-2 bg-transparent border-none cursor-pointer underline mt-2"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
};
