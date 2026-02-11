import { useRef, useCallback } from 'react';

/**
 * Hook to capture a DOM element (e.g., a Recharts chart) as a PNG base64 data URI.
 * Uses html2canvas for rendering.
 */
export function useChartCapture() {
  const ref = useRef<HTMLDivElement>(null);

  const captureChart = useCallback(async (): Promise<string | null> => {
    if (!ref.current) return null;

    try {
      // Dynamic import to avoid loading html2canvas in the main bundle
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(ref.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
      });
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Failed to capture chart:', error);
      return null;
    }
  }, []);

  return { ref, captureChart };
}
