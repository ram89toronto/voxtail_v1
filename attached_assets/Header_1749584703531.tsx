import React from 'react';
import { FileVideoIcon, SaveIcon, SettingsIcon, HelpCircleIcon } from 'lucide-react';
export const Header = () => {
  return <header className="flex items-center justify-between px-6 py-4 bg-gray-800 border-b border-gray-700">
      <div className="flex items-center space-x-2">
        <FileVideoIcon className="h-6 w-6 text-blue-400" />
        <h1 className="text-xl font-bold">TranslatioSync</h1>
      </div>
      <div className="flex items-center space-x-4">
        <button className="flex items-center space-x-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-md">
          <FileVideoIcon className="h-4 w-4" />
          <span>Import</span>
        </button>
        <button className="flex items-center space-x-1 px-3 py-1 bg-green-600 hover:bg-green-700 rounded-md">
          <SaveIcon className="h-4 w-4" />
          <span>Export</span>
        </button>
        <button className="p-2 hover:bg-gray-700 rounded-full">
          <SettingsIcon className="h-5 w-5" />
        </button>
        <button className="p-2 hover:bg-gray-700 rounded-full">
          <HelpCircleIcon className="h-5 w-5" />
        </button>
      </div>
    </header>;
};