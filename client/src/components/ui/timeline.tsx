import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface TimelineTrack {
  id: string;
  type: 'video' | 'audio' | 'subtitle';
  name: string;
  color: string;
  clips: TimelineClip[];
}

interface TimelineClip {
  id: string;
  start: number;
  end: number;
  name: string;
  color?: string;
}

interface TimelineProps {
  tracks: TimelineTrack[];
  duration: number;
  currentTime: number;
  onTimeChange: (time: number) => void;
  className?: string;
}

export function Timeline({ tracks, duration, currentTime, onTimeChange, className }: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const timeToPixel = (time: number) => {
    const containerWidth = containerRef.current?.clientWidth || 800;
    return (time / duration) * containerWidth;
  };

  const pixelToTime = (pixel: number) => {
    const containerWidth = containerRef.current?.clientWidth || 800;
    return (pixel / containerWidth) * duration;
  };

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = pixelToTime(x);
    onTimeChange(Math.max(0, Math.min(time, duration)));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const generateTimeMarkers = () => {
    const markers = [];
    const intervalSeconds = Math.ceil(duration / 10);
    
    for (let i = 0; i <= duration; i += intervalSeconds) {
      markers.push(i);
    }
    
    return markers;
  };

  return (
    <div className={cn('bg-gray-900 rounded-lg p-4', className)}>
      {/* Timeline Ruler */}
      <div ref={containerRef} className="relative mb-4 cursor-pointer" onClick={handleTimelineClick}>
        <div className="h-8 bg-gray-800 rounded relative overflow-hidden">
          {/* Time markers */}
          <div className="absolute top-0 left-0 w-full h-4 flex justify-between text-xs text-gray-400 font-mono px-1">
            {generateTimeMarkers().map((time, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="w-px h-2 bg-gray-600"></div>
                <span className="mt-1">{formatTime(time)}</span>
              </div>
            ))}
          </div>
          
          {/* Playhead */}
          <div 
            className="absolute top-0 w-0.5 h-full bg-white z-10 pointer-events-none"
            style={{ left: `${timeToPixel(currentTime)}px` }}
          >
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Tracks */}
      <div className="space-y-2">
        {tracks.map((track) => (
          <div key={track.id} className="space-y-2">
            {/* Track Header */}
            <div className="flex items-center space-x-2">
              <div className={cn('w-4 h-4 rounded', track.color)}></div>
              <span className="text-sm text-gray-300">{track.name}</span>
            </div>
            
            {/* Track Content */}
            <div className="h-12 bg-gray-800 rounded relative overflow-hidden">
              {track.clips.map((clip) => (
                <div
                  key={clip.id}
                  className="absolute top-0 h-full rounded-sm flex items-center px-2 text-xs text-white font-medium truncate cursor-pointer hover:brightness-110 transition-all"
                  style={{
                    left: `${timeToPixel(clip.start)}px`,
                    width: `${timeToPixel(clip.end - clip.start)}px`,
                    backgroundColor: clip.color || track.color,
                  }}
                  title={clip.name}
                >
                  {track.type === 'audio' && (
                    <div className="w-full h-6 flex items-end space-x-px">
                      {/* Audio waveform visualization */}
                      {Array.from({ length: 20 }, (_, i) => (
                        <div
                          key={i}
                          className="w-1 bg-white/50 rounded-full"
                          style={{ height: `${20 + Math.random() * 60}%` }}
                        />
                      ))}
                    </div>
                  )}
                  {track.type === 'video' && (
                    <span>{clip.name}</span>
                  )}
                  {track.type === 'subtitle' && (
                    <div className="w-full h-full bg-yellow-500/80 rounded-sm"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Export Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-700 mt-4">
        <div className="flex items-center space-x-4">
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
            <span>Export Video</span>
          </button>
          <select className="p-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm">
            <option>1080p MP4</option>
            <option>720p MP4</option>
            <option>4K MP4</option>
            <option>GIF</option>
          </select>
        </div>
        <div className="text-sm text-gray-400">
          Duration: {formatTime(duration)} | Size: ~245MB
        </div>
      </div>
    </div>
  );
}
