// src/lib/config.ts
export const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      // Browser environment - use current origin
      return '';
    }
    
    if (process.env.VERCEL_URL) {
      // Vercel deployment
      return `https://${process.env.VERCEL_URL}`;
    }
  
    if (process.env.NEXT_PUBLIC_SITE_URL) {
      // Explicitly set site URL
      return process.env.NEXT_PUBLIC_SITE_URL;
    }
  
    // Default to localhost for development
    return 'http://localhost:3000';
  };
  
  export const baseUrl = getBaseUrl();