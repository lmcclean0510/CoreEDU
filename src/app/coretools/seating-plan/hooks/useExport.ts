
import { useCallback, useState } from 'react';
import { useToast } from '@/hooks/shared/use-toast';

export const useExport = (containerRef: React.RefObject<HTMLElement>) => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = useCallback(async (isGridVisible: boolean, isWhiteBackground: boolean, setIsGridVisible: (visible: boolean) => void) => {
    const nodeToCapture = containerRef.current;
    if (!nodeToCapture) {
        toast({
            title: 'Export Error',
            description: 'Could not find the classroom layout to export.',
            variant: 'destructive',
        });
        return;
    }

    setIsExporting(true);

    const wasGridVisible = isGridVisible;
    if (wasGridVisible) {
        setIsGridVisible(false);
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    try {
        // Dynamic import for html-to-image
        const htmlToImage = await import('html-to-image');
        const dataUrl = await htmlToImage.toPng(nodeToCapture, {
            pixelRatio: 3,
            backgroundColor: isWhiteBackground ? '#ffffff' : 'hsl(var(--background))',
        });
        const link = document.createElement('a');
        link.download = 'seating-plan.png';
        link.href = dataUrl;
        link.click();
    } catch (err) {
        console.error('Export failed:', err);
        toast({
            title: 'Export Failed',
            description: 'Could not generate the image. Please try again.',
            variant: 'destructive',
        });
    } finally {
        if (wasGridVisible) {
            setIsGridVisible(true);
        }
        setIsExporting(false);
    }
}, [containerRef, toast]);

  return { isExporting, handleExport };
};
