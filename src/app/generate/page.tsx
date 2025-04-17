// src/app/generate/page.tsx
'use client';

import GenerateForm from '@/components/GenerateForm/GenerateForm';

export default function GeneratePage() {
  return (
    <div className="container mx-auto p-4 max-w-md">
      <GenerateForm />
      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-bold mb-2">How it works:</h3>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Enter a sports celebrity name</li>
          <li>AI generates a script about their career</li>
          <li>System creates voiceover and compiles highlights</li>
          <li>Your reel will appear in the main feed</li>
        </ol>
      </div>
    </div>
  );
}