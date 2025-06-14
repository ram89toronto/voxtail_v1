import React, { useState } from 'react';
import { ClockIcon, EditIcon, TrashIcon, PlusIcon, SearchIcon, GlobeIcon, CheckCircleIcon, AlertCircleIcon, LoaderIcon } from 'lucide-react';
export const SubtitleEditor = () => {
  const [searchQuery, setSearchQuery] = useState('');
  // Sample subtitle data with translation status
  const subtitles = [{
    id: 1,
    start: '00:00:05,200',
    end: '00:00:08,800',
    text: "Today we're going to explore the amazing world of AI translation.",
    translations: [{
      language: 'Arabic',
      text: 'اليوم سنستكشف عالم الترجمة الذكية المذهل.',
      status: 'completed'
    }, {
      language: 'Spanish',
      text: 'Hoy vamos a explorar el asombroso mundo de la traducción con IA.',
      status: 'completed'
    }]
  }, {
    id: 2,
    start: '00:00:09,100',
    end: '00:00:12,500',
    text: 'This technology can help bridge language barriers around the world.',
    translations: [{
      language: 'Arabic',
      text: 'هذه التقنية تساعد في تجاوز حواجز اللغة حول العالم.',
      status: 'completed'
    }, {
      language: 'Spanish',
      text: 'Esta tecnología puede ayudar a superar barreras lingüísticas en todo el mundo.',
      status: 'in-progress'
    }]
  }, {
    id: 3,
    start: '00:00:13,000',
    end: '00:00:17,300',
    text: 'Let me show you how our new lip-sync feature works for Arabic translation.',
    translations: [{
      language: 'Arabic',
      text: 'دعني أريك كيف تعمل ميزة مزامنة الشفاه الجديدة للترجمة العربية.',
      status: 'completed'
    }, {
      language: 'Spanish',
      text: '',
      status: 'pending'
    }]
  }];
  // Filter subtitles based on search query
  const filteredSubtitles = subtitles.filter(subtitle => searchQuery === '' || subtitle.text.toLowerCase().includes(searchQuery.toLowerCase()) || subtitle.translations.some(t => t.text.toLowerCase().includes(searchQuery.toLowerCase())));
  const getStatusIcon = status => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4 text-green-400" />;
      case 'in-progress':
        return <LoaderIcon className="h-4 w-4 text-blue-400 animate-spin" />;
      case 'pending':
        return <AlertCircleIcon className="h-4 w-4 text-gray-400" />;
      default:
        return null;
    }
  };
  return <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h2 className="font-medium">Subtitles</h2>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <SearchIcon className="h-4 w-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search subtitles" className="py-1 pl-8 pr-3 bg-gray-700 rounded-md text-sm w-40" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          <button className="p-1 hover:bg-gray-700 rounded">
            <PlusIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filteredSubtitles.length === 0 ? <div className="p-8 text-center text-gray-400">
            <SearchIcon className="h-8 w-8 mx-auto mb-2" />
            <p>No subtitles match your search</p>
          </div> : filteredSubtitles.map(subtitle => <div key={subtitle.id} className="p-4 border-b border-gray-700 hover:bg-gray-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <ClockIcon className="h-3 w-3" />
                  <span>
                    {subtitle.start} → {subtitle.end}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <button className="p-1 hover:bg-gray-700 rounded">
                    <EditIcon className="h-4 w-4" />
                  </button>
                  <button className="p-1 hover:bg-gray-700 rounded text-red-400">
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {/* Original text */}
              <div className="flex items-start mb-2">
                <div className="flex items-center mt-1 mr-2">
                  <GlobeIcon className="h-4 w-4 text-blue-400" />
                </div>
                <p className="flex-1">{subtitle.text}</p>
              </div>
              {/* Translations */}
              {subtitle.translations.map((translation, idx) => <div key={idx} className="ml-6 mt-2 flex items-start">
                  <div className="flex items-center mt-1 mr-2">
                    {getStatusIcon(translation.status)}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-400 mb-1">
                      {translation.language}
                    </div>
                    {translation.text ? <p className="text-sm text-gray-300">
                        {translation.text}
                      </p> : <div className="text-sm text-gray-500 italic">
                        Translation pending
                      </div>}
                  </div>
                </div>)}
              <div className="ml-6 mt-2">
                <button className="text-xs text-blue-400 hover:text-blue-300 flex items-center">
                  <PlusIcon className="h-3 w-3 mr-1" />
                  Add another language
                </button>
              </div>
            </div>)}
      </div>
    </div>;
};