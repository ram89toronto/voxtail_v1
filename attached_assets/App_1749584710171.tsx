import React from 'react';
import { Header } from './components/Header';
import { VideoEditor } from './components/VideoEditor';
export function App() {
  return <div className="flex flex-col w-full min-h-screen bg-gray-900 text-white">
      <Header />
      <VideoEditor />
    </div>;
}