import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useSpeechModels, useDownloadedModels, useDownloadModel } from '@/hooks/useSpeechModels';
import { Download, Check, HardDrive, Loader2 } from 'lucide-react';

export function ModelManager() {
  const { toast } = useToast();
  const { data: allModels = [], isLoading: loadingAll } = useSpeechModels();
  const { data: downloadedModels = [], refetch: refetchDownloaded } = useDownloadedModels();
  const downloadModel = useDownloadModel();
  const [downloadingModels, setDownloadingModels] = useState<Set<string>>(new Set());

  const handleDownload = async (modelId: string, languageName: string) => {
    try {
      setDownloadingModels(prev => new Set(prev).add(modelId));
      
      await downloadModel.mutateAsync(modelId);
      
      toast({
        title: "Download Started",
        description: `Downloading ${languageName} model...`,
      });
      
      // Refetch downloaded models after a delay
      setTimeout(() => {
        refetchDownloaded();
      }, 2000);
      
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to start model download. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDownloadingModels(prev => {
        const newSet = new Set(prev);
        newSet.delete(modelId);
        return newSet;
      });
    }
  };

  const isModelDownloaded = (modelId: string) => {
    return downloadedModels.some(model => model.id === modelId);
  };

  const isModelDownloading = (modelId: string) => {
    return downloadingModels.has(modelId);
  };

  if (loadingAll) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Models...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="w-5 h-5" />
          Speech Recognition Models
        </CardTitle>
        <p className="text-sm text-gray-400">
          Download language models for offline speech recognition
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {allModels.map((model) => {
            const isDownloaded = isModelDownloaded(model.id);
            const isDownloading = isModelDownloading(model.id);
            
            return (
              <div
                key={model.id}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-700 bg-gray-800/50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium">{model.language_name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {model.model_size}
                    </Badge>
                    {isDownloaded && (
                      <Badge variant="default" className="text-xs bg-green-600">
                        <Check className="w-3 h-3 mr-1" />
                        Downloaded
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>Size: {model.file_size_mb}MB</span>
                    {model.accuracy && (
                      <span>Accuracy: {(model.accuracy * 100).toFixed(1)}%</span>
                    )}
                    <span>Code: {model.language_code}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {isDownloading && (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Downloading...</span>
                    </div>
                  )}
                  
                  {!isDownloaded && !isDownloading && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(model.id, model.language_name)}
                      disabled={downloadModel.isPending}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  )}
                  
                  {isDownloaded && (
                    <Badge variant="secondary" className="bg-green-600/20 text-green-400">
                      Ready
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {downloadedModels.length > 0 && (
          <div className="mt-6 p-4 rounded-lg bg-blue-600/10 border border-blue-600/20">
            <p className="text-sm text-blue-400">
              ✓ {downloadedModels.length} model{downloadedModels.length !== 1 ? 's' : ''} ready for transcription
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}