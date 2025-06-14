import React, { useState } from 'react';
import { VideoPlayer } from './VideoPlayer';
import { SubtitleEditor } from './SubtitleEditor';
import { Timeline } from './Timeline';
import { TranslationPanel } from './TranslationPanel';
import { ChevronRightIcon, ChevronLeftIcon } from 'lucide-react';
export const VideoEditor = () => {
  const [collapsed, setCollapsed] = useState(false);
  return <div className="flex flex-1 overflow-hidden">
      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex flex-1 min-h-0">
          {/* Video preview area */}
          <div className="flex-1 p-4">
            <VideoPlayer />
          </div>
          {/* Subtitle editor */}
          <div className="w-1/2 border-l border-gray-700 overflow-y-auto">
            <SubtitleEditor />
          </div>
        </div>
        {/* Timeline */}
        <div className="h-32 border-t border-gray-700">
          <Timeline />
        </div>
      </div>
      {/* Translation panel - collapsible */}
      <div className={`${collapsed ? 'w-12' : 'w-80'} border-l border-gray-700 bg-gray-800 transition-all duration-300 flex flex-col`}>
        {collapsed ? <button onClick={() => setCollapsed(false)} className="flex items-center justify-center h-12 hover:bg-gray-700">
            <ChevronLeftIcon className="h-5 w-5" />
          </button> : <>
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="font-medium">Translation Settings</h3>
              <button onClick={() => setCollapsed(true)}>
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
            <TranslationPanel />
          </>}
      </div>
    </div>;
};