import React from 'react';
import { ZoomInIcon, ZoomOutIcon } from 'lucide-react';
export const Timeline = () => {
  return <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
        <div className="text-sm">Timeline</div>
        <div className="flex items-center space-x-2">
          <button className="p-1 hover:bg-gray-700 rounded">
            <ZoomOutIcon className="h-4 w-4" />
          </button>
          <span className="text-sm">100%</span>
          <button className="p-1 hover:bg-gray-700 rounded">
            <ZoomInIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 relative overflow-hidden">
        {/* Time markers */}
        <div className="h-6 border-b border-gray-700 flex">
          {[...Array(10)].map((_, i) => <div key={i} className="flex-1 border-r border-gray-700 text-xs text-gray-400 px-1">
              {String(i * 5).padStart(2, '0')}s
            </div>)}
        </div>
        {/* Timeline content */}
        <div className="flex-1 relative">
          {/* Video track */}
          <div className="h-8 flex items-center px-2 border-b border-gray-700">
            <div className="w-16 text-xs">Video</div>
            <div className="flex-1 h-5 bg-blue-900 mx-2 rounded-sm"></div>
          </div>
          {/* Audio track */}
          <div className="h-8 flex items-center px-2 border-b border-gray-700">
            <div className="w-16 text-xs">Audio</div>
            <div className="flex-1 h-5 bg-green-900 mx-2 rounded-sm"></div>
          </div>
          {/* Subtitle track */}
          <div className="h-8 flex items-center px-2">
            <div className="w-16 text-xs">Subtitles</div>
            <div className="flex-1 relative h-5">
              {/* Subtitle markers */}
              <div className="absolute h-full w-16 bg-yellow-700 rounded-sm left-12"></div>
              <div className="absolute h-full w-16 bg-yellow-700 rounded-sm left-40"></div>
              <div className="absolute h-full w-20 bg-yellow-700 rounded-sm left-72"></div>
            </div>
          </div>
          {/* Playhead */}
          <div className="absolute top-0 bottom-0 w-px bg-red-500 left-1/4">
            <div className="w-3 h-3 bg-red-500 rounded-full -ml-1.5 -mt-1.5"></div>
          </div>
        </div>
      </div>
    </div>;
};