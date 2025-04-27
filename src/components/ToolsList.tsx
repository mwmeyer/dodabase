"use client";

import { useState, useEffect } from "react";
import { Tool, ToolType } from "@/lib/tools";

interface ToolsListProps {
  initialTools: Tool[];
}

export function ToolsList({ initialTools }: ToolsListProps) {
  const [selectedType, setSelectedType] = useState<ToolType | null>(null);
  const [selectedLicense, setSelectedLicense] = useState<string | null>(null);
  const [showConsultingCard, setShowConsultingCard] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [scrollPosition, setScrollPosition] = useState<number>(0);
  const [tools] = useState<Tool[]>(initialTools);
  
  // Track scroll position for header effects
  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const allLicenses = Array.from(new Set(tools.map(tool => tool.license)));

  // Filter tools based on type and license only
  const filteredTools = tools.filter(tool => {
    // Type filter
    const matchesType = selectedType === null || tool.type === selectedType;
    
    // License filter
    const matchesLicense = selectedLicense === null || tool.license === selectedLicense;
    
    return matchesType && matchesLicense;
  });

  // Set tool type filter
  const setToolType = (type: ToolType | null) => {
    setSelectedType(type);
  };

  // Set license filter
  const setLicense = (license: string | null) => {
    setSelectedLicense(license);
  };

  return (
    <div className="min-h-screen bg-white text-black font-mono relative pb-32 pt-20">
      {/* Innovative compact header with expandable filters */}
      <header className={`fixed top-0 left-0 right-0 bg-white z-10 transition-all duration-300 ${scrollPosition > 50 ? 'shadow-md' : 'border-b border-gray-200'}`}>
        <div className="max-w-5xl mx-auto">
          {/* Main header bar */}
          <div className="py-3 px-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-black">
                  Dodabase
                </h1>
                <p className="text-xs text-gray-700 mt-1 pr-4 max-w-xl">
                  A directory of free and open source AI code assistants.
                </p>
              </div>
              
              {/* Filter toggle and active filter indicators */}
              <div className="flex items-center space-x-2">
                {selectedType && (
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                    {selectedType}
                  </span>
                )}
                {selectedLicense && (
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                    {selectedLicense}
                  </span>
                )}
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                  aria-label="Toggle filters"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          {/* Expandable filter section */}
          <div className={`overflow-hidden transition-all duration-300 px-6 ${showFilters ? 'max-h-60 py-3 border-t border-gray-200' : 'max-h-0'}`}>
            <div className="grid md:grid-cols-2 gap-4">
              {/* Category filters */}
              <div>
                <h3 className="text-xs font-bold mb-2">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => setToolType("extension")} 
                    className={`px-2 py-1 text-xs rounded-full ${selectedType === "extension" ? 'bg-black text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                  >
                    Extensions
                  </button>
                  <button 
                    onClick={() => setToolType("cli")} 
                    className={`px-2 py-1 text-xs rounded-full ${selectedType === "cli" ? 'bg-black text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                  >
                    CLI
                  </button>
                  <button 
                    onClick={() => setToolType("generator")} 
                    className={`px-2 py-1 text-xs rounded-full ${selectedType === "generator" ? 'bg-black text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                  >
                    Generators
                  </button>
                  <button 
                    onClick={() => setToolType("library")} 
                    className={`px-2 py-1 text-xs rounded-full ${selectedType === "library" ? 'bg-black text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                  >
                    Libraries
                  </button>
                  <button 
                    onClick={() => setToolType(null)} 
                    className={`px-2 py-1 text-xs rounded-full ${selectedType === null ? 'bg-black text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                  >
                    All
                  </button>
                </div>
              </div>
              
              {/* License filter */}
              <div>
                <h3 className="text-xs font-bold mb-2">License</h3>
                <div className="flex flex-wrap gap-2">
                  {allLicenses.map((license, index) => (
                    <button
                      key={`${license}-${index}`}
                      onClick={() => setLicense(selectedLicense === license ? null : license)}
                      className={`px-2 py-1 text-xs rounded-full ${selectedLicense === license 
                        ? 'bg-black text-white' 
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                    >
                      {license}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <main className="px-6 py-4">
        <div className="space-y-4">
          {filteredTools.map(tool => (
            <a 
              key={tool.name} 
              href={tool.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block border-b border-gray-200 py-6 px-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-xl font-bold text-black">{tool.name}</h2>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                    {tool.type}
                  </span>
                  <span className="text-xs text-gray-500">
                    {tool.license}
                  </span>
                </div>
              </div>
              <p className="text-sm mb-3">{tool.description}</p>
              <div className="flex justify-end items-center text-xs mt-2">
                <span className="text-gray-500 truncate max-w-xs">
                  {tool.url}
                </span>
              </div>
            </a>
          ))}
        </div>
        
        {filteredTools.length === 0 && (
          <div className="empty-state">
            <p>No matching tools found. Clear filters and try again.</p>
          </div>
        )}
      </main>
      
      {/* Innovative Floating Action Button with expandable card */}
      <div className="fixed bottom-6 right-6 z-20">
        <button 
          onClick={() => setShowConsultingCard(!showConsultingCard)}
          className="w-14 h-14 bg-black text-white rounded-full shadow-lg flex items-center justify-center focus:outline-none hover:bg-gray-800 transition-all"
          aria-label="Get consulting help"
        >
          {showConsultingCard ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </button>
        
        {/* Expandable Consulting Card */}
        <div 
          className={`absolute bottom-16 right-0 w-72 md:w-80 bg-white border border-gray-200 rounded-lg shadow-xl p-4 transform transition-all duration-300 ${showConsultingCard ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
        >
          <div className="text-center mb-3">
            <h3 className="text-base font-bold mb-2">Expert Consulting Services</h3>
            <p className="text-sm text-gray-600 mb-3">Need help implementing these tools in your workflow?</p>
            <ul className="text-xs text-left text-gray-600 mb-4 space-y-1">
              <li className="flex items-start">
                <span className="mr-1">•</span>
                <span>Custom integration of local LLMs</span>
              </li>
              <li className="flex items-start">
                <span className="mr-1">•</span>
                <span>Developer workflow optimization</span>
              </li>
              <li className="flex items-start">
                <span className="mr-1">•</span>
                <span>FOSS AI tool selection & setup</span>
              </li>
            </ul>
            <a 
              href="mailto:contact@dodabase.com?subject=FOSS AI Code Assistant Consulting Inquiry" 
              className="inline-block w-full px-4 py-2 bg-black text-white text-sm font-medium rounded hover:bg-gray-800 transition-colors"
            >
              Contact us at contact@dodabase.com
            </a>
          </div>
        </div>
      </div>
      
      <footer className="py-6 px-6 text-center text-xs text-gray-500">
        <p>Dodabase - {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
