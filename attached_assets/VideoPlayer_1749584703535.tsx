import React from 'react';
import { PlayIcon, PauseIcon, SkipBackIcon, SkipForwardIcon, VolumeIcon } from 'lucide-react';
export const VideoPlayer = () => {
  return <div className="h-full flex flex-col">
      <div className="flex-1 bg-black relative rounded-lg overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <div className="bg-blue-600 p-3 inline-block rounded-full mb-4">
            <FileUploadIcon className="h-8 w-8" />
          </div>
          <p className="text-lg">Drag & drop your video here</p>
          <p className="text-sm text-gray-400">or click to browse files</p>
        </div>
        {/* Video overlay controls - shown on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end">
          <div className="w-full p-4">
            <div className="w-full bg-gray-600 h-1 rounded-full overflow-hidden">
              <div className="bg-blue-500 h-full w-0"></div>
            </div>
          </div>
        </div>
      </div>
      <div className="h-16 mt-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button className="p-2 hover:bg-gray-800 rounded-full">
            <SkipBackIcon className="h-5 w-5" />
          </button>
          <button className="p-3 bg-blue-600 hover:bg-blue-700 rounded-full">
            <PlayIcon className="h-5 w-5" />
          </button>
          <button className="p-2 hover:bg-gray-800 rounded-full">
            <SkipForwardIcon className="h-5 w-5" />
          </button>
          <div className="flex items-center space-x-1">
            <VolumeIcon className="h-4 w-4" />
            <div className="w-20 bg-gray-600 h-1 rounded-full overflow-hidden">
              <div className="bg-white h-full w-3/4"></div>
            </div>
          </div>
        </div>
        <div className="text-sm">
          <span className="text-blue-400">00:00</span>
          <span className="mx-1">/</span>
          <span>00:00</span>
        </div>
      </div>
    </div>;
};
const FileUploadIcon = ({
  className
}: {
  className?: string;
}) => {
  return <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>;
};