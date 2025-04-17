// src/app/page.tsx
import ReelViewer from '@/components/ReelViewer/ReelViewer';
import { baseUrl } from '@/lib/config';

async function getInitialReels() {
  try {
    const res = await fetch(`${baseUrl}/api/reels`, {
      next: { revalidate: 60 }, // ISR every 60 seconds
    });
    
    if (!res.ok) {
      throw new Error('Failed to fetch reels');
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error fetching initial reels:', error);
    return { data: [] };
  }
}

export default async function Home() {
  const { data: initialReels } = await getInitialReels();

  return (
    <main className="flex flex-col min-h-screen">
      <header className="bg-gray-900 text-white p-4">
        <h1 className="text-2xl font-bold">Sports Legends Reels</h1>
      </header>
      
      <div className="flex-1">
        <ReelViewer initialReels={initialReels} />
      </div>
    </main>
  );
}