import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  Palette
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  id?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Enter content...",
  rows = 10,
  required = false,
  id
}) => {
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false
  });
  const [activeAlignment, setActiveAlignment] = useState('left');
  const [fontSize, setFontSize] = useState('16');
  const [fontColor, setFontColor] = useState('#000000');
  
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Sync content to editor when value changes
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  // Apply formatting using document.execCommand for contentEditable
  const applyCommand = (command: string) => {
    if (!editorRef.current) return;

    // Focus the editor first
    editorRef.current.focus();

    // Apply the formatting command
    if (command === 'bold') {
      document.execCommand('bold', false);
      setActiveFormats(prev => ({ ...prev, bold: !prev.bold }));
    } else if (command === 'italic') {
      document.execCommand('italic', false);
      setActiveFormats(prev => ({ ...prev, italic: !prev.italic }));
    } else if (command === 'underline') {
      document.execCommand('underline', false);
      setActiveFormats(prev => ({ ...prev, underline: !prev.underline }));
    }

    // Update content
    updateContent();
    checkActiveFormats();
  };

  const applyAlignment = (alignment: string) => {
    if (!editorRef.current) return;

    // Focus the editor first
    editorRef.current.focus();

    // Apply alignment commands
    switch (alignment) {
      case 'left':
        document.execCommand('justifyLeft', false);
        break;
      case 'center':
        document.execCommand('justifyCenter', false);
        break;
      case 'right':
        document.execCommand('justifyRight', false);
        break;
      case 'justify':
        document.execCommand('justifyFull', false);
        break;
    }
    
    setActiveAlignment(alignment);
    updateContent();
  };

  const applyFontSize = (size: string) => {
    if (!editorRef.current) return;

    editorRef.current.focus();
    
    // Use execCommand for font size
    const selection = document.getSelection();
    if (selection && !selection.isCollapsed) {
      document.execCommand('fontSize', false, '7');
      
      // Update the newly created font tags
      setTimeout(() => {
        const fontTags = editorRef.current?.querySelectorAll('font[size="7"]');
        fontTags?.forEach(tag => {
          if (tag instanceof HTMLElement) {
            tag.style.fontSize = `${size}px`;
            tag.removeAttribute('size');
          }
        });
        updateContent();
      }, 10);
    }
    
    setFontSize(size);
  };

  const applyFontColor = (color: string) => {
    if (!editorRef.current) return;

    editorRef.current.focus();
    
    const selection = document.getSelection();
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      // Apply font color to selected text
      document.execCommand('foreColor', false, color);
      updateContent();
    }
    
    setFontColor(color);
  };

  // Check active formatting
  const checkActiveFormats = () => {
    const selection = document.getSelection();
    if (selection && selection.rangeCount > 0) {
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline')
      });
    }
  };

  const updateContent = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
    }
  };

  const handleInput = () => {
    updateContent();
    checkActiveFormats();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle Ctrl+B, Ctrl+I, Ctrl+U shortcuts for UI state only
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          applyCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          applyCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          applyCommand('underline');
          break;
      }
    }
  };

  // Add event listener for selection changes
  useEffect(() => {
    const handleSelectionChange = () => {
      checkActiveFormats();
    };
    
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  const renderToolbar = () => (
    <div className="flex flex-wrap items-center gap-3 border-b p-3 bg-muted/20">
      {/* Text Style Buttons for Selected Text */}
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant={activeFormats.bold ? "default" : "outline"}
          size="sm"
          onClick={() => applyCommand('bold')}
          className="p-2"
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={activeFormats.italic ? "default" : "outline"}
          size="sm"
          onClick={() => applyCommand('italic')}
          className="p-2"
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={activeFormats.underline ? "default" : "outline"}
          size="sm"
          onClick={() => applyCommand('underline')}
          className="p-2"
          title="Underline (Ctrl+U)"
        >
          <Underline className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Text Alignment */}
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant={activeAlignment === 'left' ? "default" : "outline"}
          size="sm"
          onClick={() => applyAlignment('left')}
          className="p-2"
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={activeAlignment === 'center' ? "default" : "outline"}
          size="sm"
          onClick={() => applyAlignment('center')}
          className="p-2"
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={activeAlignment === 'right' ? "default" : "outline"}
          size="sm"
          onClick={() => applyAlignment('right')}
          className="p-2"
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={activeAlignment === 'justify' ? "default" : "outline"}
          size="sm"
          onClick={() => applyAlignment('justify')}
          className="p-2"
          title="Justify"
        >
          <AlignJustify className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Font Size */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Size:</span>
        <Select value={fontSize} onValueChange={applyFontSize}>
          <SelectTrigger className="w-20 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="12">12px</SelectItem>
            <SelectItem value="14">14px</SelectItem>
            <SelectItem value="16">16px</SelectItem>
            <SelectItem value="18">18px</SelectItem>
            <SelectItem value="20">20px</SelectItem>
            <SelectItem value="24">24px</SelectItem>
            <SelectItem value="28">28px</SelectItem>
            <SelectItem value="32">32px</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Font Color */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Color:</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="p-2"
              title="Choose Color"
            >
              <div className="flex items-center gap-1">
                <div 
                  className="w-4 h-4 rounded-sm border border-gray-300"
                  style={{ backgroundColor: fontColor }}
                />
                <Palette className="h-3 w-3" />
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3">
            <div className="space-y-3">
              <div className="text-sm font-medium">Text Color</div>
              <div className="grid grid-cols-8 gap-2">
                {[
                  '#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF', '#FF0000', '#FF6600',
                  '#FFCC00', '#FFFF00', '#CCFF00', '#66FF00', '#00FF00', '#00FF66', '#00FFCC', '#00FFFF',
                  '#00CCFF', '#0066FF', '#0000FF', '#6600FF', '#CC00FF', '#FF00FF', '#FF00CC', '#FF0066',
                  '#800000', '#804000', '#808000', '#408000', '#008000', '#008040', '#008080', '#004080',
                  '#000080', '#400080', '#800080', '#800040', '#400000', '#402000', '#404000', '#204000'
                ].map((color) => (
                  <button
                    key={color}
                    className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => applyFontColor(color)}
                    title={color}
                  />
                ))}
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium">Custom Color</div>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={fontColor}
                    onChange={(e) => setFontColor(e.target.value)}
                    className="w-12 h-8 p-1 border rounded"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => applyFontColor(fontColor)}
                    className="px-3"
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );

  return (
    <div className="space-y-3 border rounded-lg bg-background">
      {renderToolbar()}
      
      {/* Rich Text Editor */}
      <div className="p-3">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          style={{ minHeight: `${rows * 1.5}em` }}
          className="w-full p-4 border border-input rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent prose max-w-none bg-background overflow-y-auto"
          data-placeholder={placeholder}
          suppressContentEditableWarning={true}
          dir="ltr"
        />
      </div>
    </div>
  );
};
