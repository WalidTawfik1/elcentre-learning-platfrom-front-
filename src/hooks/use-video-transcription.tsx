import { useState, useCallback } from 'react';

interface UseVideoTranscriptionOptions {
  language?: string;
}

interface TranscriptResult {
  text: string;
  confidence?: number;
  error?: string;
}

export function useVideoTranscription({ 
  language = 'auto' // Auto-detect language by default, but can be set to 'ar' for Arabic
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
    const effectiveLanguage = overrideLanguage || language;
    (`Starting AssemblyAI transcription with language: ${effectiveLanguage}`);
    
    // Validate the video URL
    if (!videoUrl || !videoUrl.startsWith('http')) {
      throw new Error(`Invalid video URL for transcription: ${videoUrl}`);
    }
    
    // Map common language codes to AssemblyAI supported codes
    const getLanguageCode = (lang: string) => {
      const languageMap: { [key: string]: string } = {
        'auto': null,   // Let AssemblyAI auto-detect by not setting language_code
        'ar': 'ar',     // Arabic
        'en': 'en_us',  // English (US format)
        'es': 'es',     // Spanish
        'fr': 'fr',     // French
        'de': 'de',     // German
        'it': 'it',     // Italian
        'pt': 'pt',     // Portuguese
        'hi': 'hi',     // Hindi
        'ja': 'ja',     // Japanese
        'ko': 'ko',     // Korean
        'zh': 'zh',     // Chinese
      };
      return languageMap[lang] || null;
    };

    const languageCode = getLanguageCode(effectiveLanguage);
    (`Mapped language code: ${languageCode}`);

    // Configure request body with only supported parameters
    const requestBody: any = {
      audio_url: videoUrl,
      punctuate: true,
      format_text: true,
    };

    // Add language-specific configuration
    if (languageCode) {
      requestBody.language_code = languageCode;
      
      // For Arabic, add specific optimizations using supported parameters
      if (languageCode === 'ar') {
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

    // Step 2: Poll for completion
    let transcriptResult = null;
    let attempts = 0;
    const maxAttempts = languageCode === 'ar' ? 180 : 120; // 6 minutes for Arabic, 4 minutes for others

    (`Starting transcription polling for ${languageCode || 'auto-detect'} language. Max attempts: ${maxAttempts}`);

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
        (`Transcription completed successfully for ${languageCode} language after ${attempts + 1} attempts`);
        break;
      } else if (statusData.status === 'error') {
        throw new Error(`Transcription failed: ${statusData.error || 'Unknown error'}`);
      }
      
      // Log progress for Arabic transcription (typically takes longer)
      if (languageCode === 'ar' && attempts % 10 === 0) {
        (`Arabic transcription in progress... attempt ${attempts + 1}/${maxAttempts}`);
      }
      
      // Wait 2 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
    }

    if (!transcriptResult) {
      const timeoutMessage = languageCode === 'ar' 
        ? 'Arabic transcription timeout - Arabic processing typically takes longer. Try with shorter video segments or ensure high-quality audio for better results.'
        : 'Transcription timeout - video might be too long or processing is taking longer than expected. For Arabic content, try using shorter video segments or ensure clear audio quality.';
      throw new Error(timeoutMessage);
    }

    const result = {
      text: transcriptResult.text || '',
      confidence: transcriptResult.confidence
    };

    (`Transcription completed for ${languageCode || 'auto-detect'} language. Text length: ${result.text.length}`);

    setTranscript(result.text);
    return result;
  }, [language]);

  const transcribeVideo = useCallback(async (videoUrl: string, overrideLanguage?: string): Promise<TranscriptResult | null> => {
    if (!videoUrl) {
      setError('No video URL provided');
      return null;
    }

    // Use override language if provided, otherwise use the hook's language setting
    const effectiveLanguage = overrideLanguage || language;
    (`Transcribing video with language: ${effectiveLanguage}`);

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
  }, [language, transcribeWithAssemblyAI]);

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