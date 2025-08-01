import { useState, useCallback } from 'react';
import { getAssemblyAILanguageCode } from '@/config/languages';

interface UseVideoTranscriptionOptions {
  courseLanguage?: string; // Use course language instead of generic language
}

interface TranscriptResult {
  text: string;
  confidence?: number;
  error?: string;
}

export function useVideoTranscription({ 
  courseLanguage = 'auto' // Use auto-detection if no course language provided
}: UseVideoTranscriptionOptions = {}) {
  const [transcript, setTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // Helper function to detect if content is likely Arabic
  const detectArabicContent = useCallback((text: string): boolean => {
    if (!text) return false;
    // Check for Arabic Unicode range (U+0600 to U+06FF)
    const arabicRegex = /[\u0600-\u06FF]/;
    const hasArabicChars = arabicRegex.test(text);
    const totalCharCount = text.replace(/\s/g, '').length;
    
    // If there's any Arabic character and at least 3 total characters, consider it Arabic
    return hasArabicChars && totalCharCount >= 3;
  }, []);



  // AssemblyAI transcription
  const transcribeWithAssemblyAI = useCallback(async (videoUrl: string, apiKey: string, overrideLanguage?: string): Promise<TranscriptResult> => {
    const effectiveLanguage = overrideLanguage || courseLanguage;
    
    // Use the language configuration to get Assembly AI language code
    const languageCode = getAssemblyAILanguageCode(effectiveLanguage);
    
    // If the language is not supported by AssemblyAI, fall back to auto-detection or English
    const finalLanguageCode = languageCode || (effectiveLanguage === 'auto' ? null : 'en_us');
  
    
    // Validate the video URL
    if (!videoUrl || !videoUrl.startsWith('http')) {
      throw new Error(`Invalid video URL for transcription: ${videoUrl}`);
    }

    // Configure request body with only supported parameters
    const requestBody: any = {
      audio_url: videoUrl,
      punctuate: true,
      format_text: true,
    };

    // Add language-specific configuration
    if (finalLanguageCode) {
      requestBody.language_code = finalLanguageCode;
      
      // For Arabic, add specific optimizations using supported parameters
      if (finalLanguageCode === 'ar') {
        // Use word_boost with English words only (Arabic characters not supported)
        requestBody.word_boost = [
          'API', 'Arabic', 'programming', 'course', 'lesson', 'tutorial', 'website', 'application'
        ];
        // Add boost parameter for better recognition
        requestBody.boost_param = 'high';
      }
    } else {
      // Enable automatic language detection when no specific language is set
      requestBody.language_detection = true;
    }
    
    const response = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      let errorDetails = '';
      try {
        const errorBody = await response.text();
        console.error('AssemblyAI error response:', errorBody);
        
        // Try to parse the error response as JSON for better error details
        try {
          const errorJson = JSON.parse(errorBody);
          errorDetails = errorJson.error || errorJson.message || errorBody;
        } catch (parseError) {
          errorDetails = errorBody;
        }
      } catch (e) {
        errorDetails = response.statusText;
      }
      throw new Error(`AssemblyAI API error: ${response.status} - ${errorDetails}`);
    }

    const transcriptData = await response.json();
    
    if (!transcriptData.id) {
      throw new Error('Failed to submit transcription request');
    }

    // Step 2: Poll for completion with dynamic intervals
    let transcriptResult = null;
    let attempts = 0;
    const maxAttempts = finalLanguageCode === 'ar' ? 90 : 60; // Reduced: 3 minutes for Arabic, 2 minutes for others


    while (attempts < maxAttempts) {
      setProgress(Math.min(95, (attempts / maxAttempts) * 100));
      
      const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptData.id}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        }
      });

      if (!statusResponse.ok) {
        throw new Error(`Error checking transcription status: ${statusResponse.status}`);
      }

      const statusData = await statusResponse.json();
      
      if (statusData.status === 'completed') {
        transcriptResult = statusData;
        setProgress(100);
        break;
      } else if (statusData.status === 'error') {
        throw new Error(`Transcription failed: ${statusData.error || 'Unknown error'}`);
      }
      
      // Log progress for Arabic transcription (typically takes longer)
      if (finalLanguageCode === 'ar' && attempts % 5 === 0) {
      }
      
      // Dynamic polling interval: start fast, then slow down
      let waitTime;
      if (attempts < 10) {
        waitTime = 1000; // 1 second for first 10 attempts (first 10 seconds)
      } else if (attempts < 30) {
        waitTime = 2000; // 2 seconds for next 20 attempts (next 40 seconds)
      } else {
        waitTime = 3000; // 3 seconds for remaining attempts
      }
      
      await new Promise(resolve => setTimeout(resolve, waitTime));
      attempts++;
    }

    if (!transcriptResult) {
      const timeoutMessage = finalLanguageCode === 'ar' 
        ? 'Arabic transcription timeout after 3 minutes - try with shorter video segments or ensure high-quality audio.'
        : 'Transcription timeout after 2 minutes - video might be too long or processing is taking longer than expected.';
      throw new Error(timeoutMessage);
    }

    const result = {
      text: transcriptResult.text || '',
      confidence: transcriptResult.confidence
    };


    setTranscript(result.text);
    return result;
  }, [courseLanguage]);

  const transcribeVideo = useCallback(async (videoUrl: string, overrideLanguage?: string): Promise<TranscriptResult | null> => {
    if (!videoUrl) {
      setError('No video URL provided');
      return null;
    }

    // Use override language if provided, otherwise use the hook's courseLanguage setting
    const effectiveLanguage = overrideLanguage || courseLanguage;

    setIsTranscribing(true);
    setError(null);
    setProgress(0);
    setTranscript('');
    
    try {
      // Use AssemblyAI for transcription
      const assemblyaiApiKey = import.meta.env.VITE_ASSEMBLYAI_API_KEY;
      
      if (!assemblyaiApiKey) {
        throw new Error('No AssemblyAI API key configured. Please add VITE_ASSEMBLYAI_API_KEY to your environment variables.');
      }
      
      return await transcribeWithAssemblyAI(videoUrl, assemblyaiApiKey, effectiveLanguage);

    } catch (error: any) {
      console.error('Video transcription error:', error);
      const errorMessage = error.message || 'Failed to transcribe video';
      setError(errorMessage);
      return { text: '', error: errorMessage };
    } finally {
      setIsTranscribing(false);
      setProgress(0);
    }
  }, [courseLanguage, transcribeWithAssemblyAI]);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
    setProgress(0);
  }, []);

  return {
    transcript,
    isTranscribing,
    error,
    progress,
    transcribeVideo,
    clearTranscript,
    detectArabicContent
  };
}