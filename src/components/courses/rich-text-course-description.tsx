import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Bold, 
  Italic, 
  Underline, 
  Type, 
  Minus, 
  Plus, 
  RotateCcw,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface RichTextCourseDescriptionProps {
  description: string;
}

interface TextFormat {
  fontSize: number;
  fontFamily: string;
  isBold: boolean;
  isItalic: boolean;
  isUnderlined: boolean;
  textAlign: 'left' | 'center' | 'right' | 'justify';
}

const FONT_FAMILIES = [
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Times New Roman, serif', label: 'Times New Roman' },
  { value: 'Verdana, sans-serif', label: 'Verdana' },
  { value: 'Helvetica, sans-serif', label: 'Helvetica' },
  { value: 'Courier New, monospace', label: 'Courier New' },
];

const FONT_SIZES = [
  { value: 12, label: '12px' },
  { value: 14, label: '14px' },
  { value: 16, label: '16px (Default)' },
  { value: 18, label: '18px' },
  { value: 20, label: '20px' },
  { value: 24, label: '24px' },
];

export function RichTextCourseDescription({ description }: RichTextCourseDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFormatControls, setShowFormatControls] = useState(false);
  const [textFormat, setTextFormat] = useState<TextFormat>({
    fontSize: 16,
    fontFamily: 'Arial, sans-serif',
    isBold: false,
    isItalic: false,
    isUnderlined: false,
    textAlign: 'left',
  });

  const contentRef = useRef<HTMLDivElement>(null);
  
  // Set character limit for truncation
  const CHARACTER_LIMIT = 300;
  
  // Check if description needs truncation
  const shouldTruncate = description.length > CHARACTER_LIMIT;
  
  // Get displayed text based on state
  const displayedText = shouldTruncate && !isExpanded 
    ? description.slice(0, CHARACTER_LIMIT) + "..."
    : description;

  // Load saved preferences from localStorage
  useEffect(() => {
    const savedFormat = localStorage.getItem('course-description-text-format');
    if (savedFormat) {
      try {
        const parsed = JSON.parse(savedFormat);
        setTextFormat(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Error loading text format preferences:', error);
      }
    }
  }, []);

  // Save preferences to localStorage when format changes
  useEffect(() => {
    localStorage.setItem('course-description-text-format', JSON.stringify(textFormat));
  }, [textFormat]);

  const handleFormatChange = (key: keyof TextFormat, value: any) => {
    setTextFormat(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const toggleFormat = (key: 'isBold' | 'isItalic' | 'isUnderlined') => {
    setTextFormat(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const adjustFontSize = (change: number) => {
    setTextFormat(prev => ({
      ...prev,
      fontSize: Math.max(10, Math.min(32, prev.fontSize + change))
    }));
  };

  const resetFormat = () => {
    setTextFormat({
      fontSize: 16,
      fontFamily: 'Arial, sans-serif',
      isBold: false,
      isItalic: false,
      isUnderlined: false,
      textAlign: 'left',
    });
  };

  const getContentStyle = (): React.CSSProperties => ({
    fontSize: `${textFormat.fontSize}px`,
    fontFamily: textFormat.fontFamily,
    fontWeight: textFormat.isBold ? 'bold' : 'normal',
    fontStyle: textFormat.isItalic ? 'italic' : 'normal',
    textDecoration: textFormat.isUnderlined ? 'underline' : 'none',
    textAlign: textFormat.textAlign,
    lineHeight: 1.6,
    color: 'inherit',
  });

  if (!description || !description.trim()) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">About This Course</h2>
        <p className="text-muted-foreground">No description has been provided for this course yet.</p>
      </div>
    );
  }

  return (
    <div className="mb-8 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">About This Course</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFormatControls(!showFormatControls)}
          className="gap-2"
        >
          <Type className="h-4 w-4" />
          Format
          {showFormatControls ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </Button>
      </div>

      {/* Text Formatting Controls */}
      {showFormatControls && (
        <Card className="border-muted">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Font Family */}
              <div className="flex items-center gap-2">
                <Type className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={textFormat.fontFamily}
                  onValueChange={(value) => handleFormatChange('fontFamily', value)}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_FAMILIES.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        <span style={{ fontFamily: font.value }}>{font.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator orientation="vertical" className="h-6" />

              {/* Font Size Controls */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => adjustFontSize(-2)}
                  disabled={textFormat.fontSize <= 10}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                
                <Select
                  value={textFormat.fontSize.toString()}
                  onValueChange={(value) => handleFormatChange('fontSize', parseInt(value))}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_SIZES.map((size) => (
                      <SelectItem key={size.value} value={size.value.toString()}>
                        {size.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => adjustFontSize(2)}
                  disabled={textFormat.fontSize >= 32}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              <Separator orientation="vertical" className="h-6" />

              {/* Text Style Controls */}
              <div className="flex items-center gap-1">
                <Button
                  variant={textFormat.isBold ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleFormat('isBold')}
                >
                  <Bold className="h-3 w-3" />
                </Button>
                
                <Button
                  variant={textFormat.isItalic ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleFormat('isItalic')}
                >
                  <Italic className="h-3 w-3" />
                </Button>
                
                <Button
                  variant={textFormat.isUnderlined ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleFormat('isUnderlined')}
                >
                  <Underline className="h-3 w-3" />
                </Button>
              </div>

              <Separator orientation="vertical" className="h-6" />

              {/* Text Alignment */}
              <div className="flex items-center gap-1">
                <Button
                  variant={textFormat.textAlign === 'left' ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFormatChange('textAlign', 'left')}
                >
                  <AlignLeft className="h-3 w-3" />
                </Button>
                
                <Button
                  variant={textFormat.textAlign === 'center' ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFormatChange('textAlign', 'center')}
                >
                  <AlignCenter className="h-3 w-3" />
                </Button>
                
                <Button
                  variant={textFormat.textAlign === 'right' ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFormatChange('textAlign', 'right')}
                >
                  <AlignRight className="h-3 w-3" />
                </Button>
                
                <Button
                  variant={textFormat.textAlign === 'justify' ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFormatChange('textAlign', 'justify')}
                >
                  <AlignJustify className="h-3 w-3" />
                </Button>
              </div>

              <Separator orientation="vertical" className="h-6" />

              {/* Reset Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={resetFormat}
                className="gap-2"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Course Description Content */}
      <div
        ref={contentRef}
        className="text-muted-foreground whitespace-pre-wrap leading-relaxed"
        style={getContentStyle()}
      >
        {displayedText}
        {shouldTruncate && (
          <Button
            variant="link"
            className="p-0 h-auto text-eduBlue-500 hover:text-eduBlue-600 font-medium ml-2"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Show less" : "Show more"}
          </Button>
        )}
      </div>
    </div>
  );
}
