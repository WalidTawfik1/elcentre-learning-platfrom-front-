import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  length = 6,
  value,
  onChange,
  disabled = false,
  className
}) => {
  const [otp, setOtp] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Update internal state when value prop changes
  useEffect(() => {
    const otpArray = value.split('').slice(0, length);
    const paddedOtp = [...otpArray, ...Array(length - otpArray.length).fill('')];
    setOtp(paddedOtp);
  }, [value, length]);

  // Update parent component when internal state changes
  useEffect(() => {
    const otpValue = otp.join('');
    if (otpValue !== value) {
      onChange(otpValue);
    }
  }, [otp, onChange, value]);

  const handleChange = (index: number, val: string) => {
    // Only allow numeric input
    if (val && !/^\d$/.test(val)) return;

    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);

    // Auto-focus next input
    if (val && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newOtp = [...otp];
      
      if (otp[index]) {
        // Clear current field
        newOtp[index] = '';
        setOtp(newOtp);
      } else if (index > 0) {
        // Move to previous field and clear it
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain');
    
    // Extract only numeric characters
    const numericOnly = pastedData.replace(/\D/g, '');
    
    if (numericOnly) {
      const newOtp = Array(length).fill('');
      const pastedChars = numericOnly.split('').slice(0, length);
      
      pastedChars.forEach((char, index) => {
        newOtp[index] = char;
      });
      
      setOtp(newOtp);
      
      // Focus the next empty field or the last field
      const nextIndex = Math.min(pastedChars.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  const handleFocus = (index: number) => {
    // Select all text when input is focused
    inputRefs.current[index]?.select();
  };

  return (
    <div className={cn("flex gap-1 sm:gap-2 justify-center", className)}>
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={() => handleFocus(index)}
          disabled={disabled}
          className={cn(
            // Base sizing - smaller on mobile, larger on desktop
            "w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14",
            // Text styling - responsive text sizes
            "text-center text-base sm:text-lg md:text-xl font-semibold",
            // Border and border radius
            "border-2 rounded-md sm:rounded-lg",
            // Focus states
            "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
            // Disabled states
            "disabled:opacity-50 disabled:cursor-not-allowed",
            // Transitions and hover effects
            "transition-all duration-200",
            "hover:border-gray-400 active:scale-95",
            // Dynamic border and background based on content
            digit ? "border-primary bg-primary/5 shadow-sm" : "border-gray-300",
            // Better mobile touch targets
            "touch-manipulation"
          )}
          aria-label={`Digit ${index + 1} of ${length}`}
          autoComplete="one-time-code"
        />
      ))}
    </div>
  );
};
