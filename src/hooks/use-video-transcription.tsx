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
  language = 'en' 
}: UseVideoTranscriptionOptions = {}) {
  const [transcript, setTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const transcribeVideo = useCallback(async (videoUrl: string): Promise<TranscriptResult | null> => {
    if (!videoUrl) {
      setError('No video URL provided');
      return null;
    }

    setIsTranscribing(true);
    setError(null);
    setProgress(0);
    setTranscript('');
    
    try {
      const apiKey = import.meta.env.VITE_ASSEMBLYAI_API_KEY;
      
      if (!apiKey) {
        throw new Error('AssemblyAI API key not configured');
      }

      // Step 1: Submit transcription request to AssemblyAI
      const response = await fetch('https://api.assemblyai.com/v2/transcript', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio_url: videoUrl,
          language_code: language,
          punctuate: true,
          format_text: true,
          speaker_labels: false, // Disable speaker detection for faster processing
          auto_chapters: false,  // Disable chapters for faster processing
          auto_highlights: false, // Disable highlights for faster processing
        })
      });

      if (!response.ok) {
        throw new Error(`AssemblyAI API error: ${response.status} ${response.statusText}`);
      }

      const transcriptData = await response.json();
      
      if (!transcriptData.id) {
        throw new Error('Failed to submit transcription request');
      }

      // Step 2: Poll for completion
      let transcript = null;
      let attempts = 0;
      const maxAttempts = 180; // 6 minutes timeout (polling every 2 seconds)

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
          transcript = statusData;
          setProgress(100);
          break;
        } else if (statusData.status === 'error') {
          throw new Error(`Transcription failed: ${statusData.error || 'Unknown error'}`);
        }
        
        // Wait 2 seconds before checking again
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
      }

      if (!transcript) {
        throw new Error('Transcription timeout - video might be too long or processing is taking longer than expected');
      }

      const result = {
        text: transcript.text || '',
        confidence: transcript.confidence
      };

      setTranscript(result.text);
      return result;

    } catch (error: any) {
      console.error('Video transcription error:', error);
      const errorMessage = error.message || 'Failed to transcribe video';
      setError(errorMessage);
      return { text: '', error: errorMessage };
    } finally {
      setIsTranscribing(false);
      setProgress(0);
    }
  }, [language]);

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
    clearTranscript
  };
}
