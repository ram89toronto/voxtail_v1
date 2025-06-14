import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface SpeechModel {
  id: string;
  language_code: string;
  language_name: string;
  model_name: string;
  model_size: string;
  file_size_mb: number;
  is_downloaded: boolean;
  is_active: boolean;
  accuracy?: number;
  created_at: string;
}

export function useSpeechModels() {
  return useQuery<SpeechModel[]>({
    queryKey: ['/api/speech/models'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useDownloadedModels() {
  return useQuery<SpeechModel[]>({
    queryKey: ['/api/speech/models/downloaded'],
    staleTime: 5 * 60 * 1000,
  });
}

export function useDownloadModel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (modelId: string) => {
      const response = await fetch(`/api/speech/models/${modelId}/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to download model');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/speech/models'] });
      queryClient.invalidateQueries({ queryKey: ['/api/speech/models/downloaded'] });
    }
  });
}

export function useTranscribeProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      projectId, 
      language = 'en-US', 
      enableSpeakerDiarization = false 
    }: {
      projectId: string;
      language?: string;
      enableSpeakerDiarization?: boolean;
    }) => {
      const response = await fetch(`/api/projects/${projectId}/transcribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ language, enableSpeakerDiarization })
      });
      if (!response.ok) {
        throw new Error('Failed to start transcription');
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects', variables.projectId, 'segments'] });
    }
  });
}