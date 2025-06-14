import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface WaveformProps {
  isRecording?: boolean;
  className?: string;
  height?: number;
  bars?: number;
}

export function Waveform({ isRecording = false, className, height = 64, bars = 20 }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [audioData, setAudioData] = useState<number[]>([]);

  useEffect(() => {
    if (!isRecording) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setAudioData([]);
      return;
    }

    const generateMockData = () => {
      const data = Array.from({ length: bars }, () => Math.random() * 0.8 + 0.1);
      setAudioData(data);
      
      animationRef.current = requestAnimationFrame(generateMockData);
    };

    generateMockData();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRecording, bars]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height: canvasHeight } = canvas;
    ctx.clearRect(0, 0, width, canvasHeight);

    if (audioData.length === 0) return;

    const barWidth = width / bars;
    const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
    gradient.addColorStop(0, '#3b82f6');
    gradient.addColorStop(1, '#8b5cf6');

    audioData.forEach((value, index) => {
      const barHeight = value * canvasHeight;
      const x = index * barWidth;
      const y = (canvasHeight - barHeight) / 2;

      ctx.fillStyle = gradient;
      ctx.fillRect(x + barWidth * 0.1, y, barWidth * 0.8, barHeight);
    });
  }, [audioData, bars]);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={height}
      className={cn('w-full rounded', className)}
    />
  );
}
