import React, { useState } from 'react'
import {
  MicIcon,
  RefreshCwIcon,
  SearchIcon,
  StarIcon,
  ClockIcon,
  ZapIcon,
  PlusIcon,
  GlobeIcon,
} from 'lucide-react'
export const TranslationPanel = () => {
  const [sourceLanguage, setSourceLanguage] = useState('English')
  const [targetLanguage, setTargetLanguage] = useState('Arabic')
  const [savedPairs, setSavedPairs] = useState([
    { source: 'English', target: 'Arabic' },
    { source: 'English', target: 'Spanish' },
  ])
  const [recentPairs, setRecentPairs] = useState([
    { source: 'English', target: 'French' },
    { source: 'English', target: 'German' },
  ])
  const swapLanguages = () => {
    const temp = sourceLanguage
    setSourceLanguage(targetLanguage)
    setTargetLanguage(temp)
  }
  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="mb-6">
        <h4 className="text-sm font-medium mb-2">Translation Languages</h4>
        <div className="flex items-center space-x-2 mb-3">
          <div className="flex-1 relative">
            <div className="absolute left-2 top-1/2 -translate-y-1/2">
              <GlobeIcon className="h-4 w-4 text-gray-400" />
            </div>
            <select
              className="w-full bg-gray-700 rounded-md p-2 pl-8 text-sm"
              value={sourceLanguage}
              onChange={(e) => setSourceLanguage(e.target.value)}
            >
              <option value="Auto">Auto Detect</option>
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
              <option value="German">German</option>
              <option value="Arabic">Arabic</option>
              <option value="Chinese">Chinese</option>
              <option value="Japanese">Japanese</option>
              <option value="Russian">Russian</option>
              <option value="Portuguese">Portuguese</option>
              <option value="Hindi">Hindi</option>
              <option value="Korean">Korean</option>
              <option value="Italian">Italian</option>
            </select>
          </div>
          <button
            onClick={swapLanguages}
            className="p-2 hover:bg-gray-700 rounded-md transition-all hover:rotate-180"
          >
            <RefreshCwIcon className="h-5 w-5 text-blue-400" />
          </button>
          <div className="flex-1 relative">
            <div className="absolute left-2 top-1/2 -translate-y-1/2">
              <GlobeIcon className="h-4 w-4 text-gray-400" />
            </div>
            <select
              className="w-full bg-gray-700 rounded-md p-2 pl-8 text-sm"
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
            >
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
              <option value="German">German</option>
              <option value="Arabic">Arabic</option>
              <option value="Chinese">Chinese</option>
              <option value="Japanese">Japanese</option>
              <option value="Russian">Russian</option>
              <option value="Portuguese">Portuguese</option>
              <option value="Hindi">Hindi</option>
              <option value="Korean">Korean</option>
              <option value="Italian">Italian</option>
            </select>
          </div>
        </div>
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">Language Pairs</span>
            <button className="text-xs text-blue-400 hover:text-blue-300">
              View All
            </button>
          </div>
          <div className="space-y-2">
            {/* Saved pairs */}
            <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-thin">
              {savedPairs.map((pair, index) => (
                <button
                  key={`saved-${index}`}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-md text-xs whitespace-nowrap"
                  onClick={() => {
                    setSourceLanguage(pair.source)
                    setTargetLanguage(pair.target)
                  }}
                >
                  <StarIcon className="h-3 w-3 text-yellow-400" />
                  <span>
                    {pair.source} → {pair.target}
                  </span>
                </button>
              ))}
              <button className="flex items-center space-x-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-md text-xs whitespace-nowrap">
                <PlusIcon className="h-3 w-3" />
                <span>Save Current</span>
              </button>
            </div>
            {/* Recent pairs */}
            <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-thin">
              {recentPairs.map((pair, index) => (
                <button
                  key={`recent-${index}`}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-md text-xs whitespace-nowrap"
                  onClick={() => {
                    setSourceLanguage(pair.source)
                    setTargetLanguage(pair.target)
                  }}
                >
                  <ClockIcon className="h-3 w-3 text-blue-400" />
                  <span>
                    {pair.source} → {pair.target}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="mb-6">
        <h4 className="text-sm font-medium mb-2">Voice Settings</h4>
        <div className="mb-3">
          <label className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Voice Type</span>
          </label>
          <select className="w-full bg-gray-700 rounded-md p-2 text-sm">
            <option>Male (Adult)</option>
            <option>Female (Adult)</option>
            <option>Male (Young)</option>
            <option>Female (Young)</option>
            <option>Custom Voice Model</option>
          </select>
        </div>
        <div className="mb-3">
          <label className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Pitch</span>
            <span>50%</span>
          </label>
          <div className="flex items-center">
            <input
              type="range"
              min="0"
              max="100"
              defaultValue="50"
              className="w-full h-1 bg-gray-700 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
            />
          </div>
        </div>
        <div className="mb-3">
          <label className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Speed</span>
            <span>100%</span>
          </label>
          <div className="flex items-center">
            <input
              type="range"
              min="0"
              max="200"
              defaultValue="100"
              className="w-full h-1 bg-gray-700 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
            />
          </div>
        </div>
      </div>
      <div className="mb-6">
        <h4 className="text-sm font-medium mb-2">Lip-Sync Settings</h4>
        <div className="p-3 bg-gray-700 rounded-md mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm">Enable Lip-Sync</span>
            <div className="w-10 h-5 bg-blue-600 rounded-full relative cursor-pointer">
              <div className="absolute right-0.5 top-0.5 bg-white h-4 w-4 rounded-full"></div>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            AI-powered lip movement synchronization with translated audio
          </p>
        </div>
        <div className="mb-3">
          <label className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Sync Accuracy</span>
            <span>High</span>
          </label>
          <div className="flex items-center">
            <input
              type="range"
              min="0"
              max="100"
              defaultValue="75"
              className="w-full h-1 bg-gray-700 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
            />
          </div>
        </div>
      </div>
      <div className="mb-6">
        <h4 className="text-sm font-medium mb-2">Translation Quality</h4>
        <div className="flex space-x-2 mb-4">
          <button className="flex-1 py-2 px-3 bg-gray-700 hover:bg-gray-600 rounded-md text-sm text-center">
            Draft
          </button>
          <button className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-500 rounded-md text-sm text-center">
            Standard
          </button>
          <button className="flex-1 py-2 px-3 bg-gray-700 hover:bg-gray-600 rounded-md text-sm text-center">
            Premium
          </button>
        </div>
      </div>
      <div>
        <h4 className="text-sm font-medium mb-2">Vocabulary Customization</h4>
        <div className="p-3 bg-gray-700 rounded-md">
          <p className="text-xs text-gray-400 mb-2">
            Add domain-specific terms to improve translation quality
          </p>
          <button className="w-full flex items-center justify-center space-x-1 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm">
            <PlusIcon className="h-4 w-4" />
            <span>Add Custom Terms</span>
          </button>
        </div>
      </div>
      <div className="mt-6">
        <button className="w-full flex items-center justify-center space-x-2 py-3 bg-green-600 hover:bg-green-700 rounded-md">
          <ZapIcon className="h-5 w-5" />
          <span>Translate All Subtitles</span>
        </button>
      </div>
    </div>
  )
}
const PlusIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  )
}
