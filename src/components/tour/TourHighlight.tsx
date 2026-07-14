import { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface TourHighlightProps {
  targetSelector?: string;
  isActive: boolean;
  children: React.ReactNode;
  position?: 'center' | 'top' | 'bottom';
  onNext?: () => void;
  onPrev?: () => void;
  onClose?: () => void;
}

interface HighlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function TourHighlight({ 
  targetSelector, 
  isActive, 
  children,
  position = 'center',
  onNext,
  onPrev,
  onClose
}: TourHighlightProps) {
  const [highlightRect, setHighlightRect] = useState<HighlightRect | null>(null);
  const [mounted, setMounted] = useState(false);
  const observerRef = useRef<MutationObserver | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Focus trap and keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    // Store previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onClose?.();
          break;
        case 'ArrowRight':
          e.preventDefault();
          onNext?.();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onPrev?.();
          break;
        case 'Tab':
          // Focus trap - keep focus within tour
          if (containerRef.current) {
            const focusableElements = containerRef.current.querySelectorAll(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            const firstFocusable = focusableElements[0] as HTMLElement;
            const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

            if (e.shiftKey) {
              if (document.activeElement === firstFocusable) {
                e.preventDefault();
                lastFocusable?.focus();
              }
            } else {
              if (document.activeElement === lastFocusable) {
                e.preventDefault();
                firstFocusable?.focus();
              }
            }
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Focus first focusable element in tour
    setTimeout(() => {
      if (containerRef.current) {
        const firstFocusable = containerRef.current.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) as HTMLElement;
        firstFocusable?.focus();
      }
    }, 100);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore focus when tour closes
      previousActiveElement.current?.focus();
    };
  }, [isActive, onNext, onPrev, onClose]);

  // Update highlight position
  const updateHighlight = useCallback(() => {
    if (!targetSelector) {
      setHighlightRect(null);
      return;
    }

    const element = document.querySelector(targetSelector);
    if (element) {
      const rect = element.getBoundingClientRect();
      const padding = 8;
      setHighlightRect({
        top: rect.top - padding + window.scrollY,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2
      });

      // Scroll element into view if needed
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      setHighlightRect(null);
    }
  }, [targetSelector]);

  useEffect(() => {
    if (!isActive) {
      setHighlightRect(null);
      return;
    }

    // Delay to allow navigation to complete
    const timeout = setTimeout(updateHighlight, 300);

    // Observe DOM changes to update highlight
    observerRef.current = new MutationObserver(() => {
      setTimeout(updateHighlight, 50);
    });
    observerRef.current.observe(document.body, { 
      childList: true, 
      subtree: true,
      attributes: true 
    });

    window.addEventListener('resize', updateHighlight);
    window.addEventListener('scroll', updateHighlight);

    return () => {
      clearTimeout(timeout);
      observerRef.current?.disconnect();
      window.removeEventListener('resize', updateHighlight);
      window.removeEventListener('scroll', updateHighlight);
    };
  }, [targetSelector, isActive, updateHighlight]);

  if (!isActive || !mounted) return null;

  const getContentPosition = (): React.CSSProperties => {
    if (!highlightRect) {
      return { 
        position: 'fixed', 
        left: '50%', 
        top: '50%', 
        transform: 'translate(-50%, -50%)',
        zIndex: 10003
      };
    }

    const viewportHeight = window.innerHeight;
    const highlightCenter = highlightRect.top - window.scrollY + highlightRect.height / 2;
    const spaceBelow = viewportHeight - (highlightRect.top - window.scrollY + highlightRect.height);
    const spaceAbove = highlightRect.top - window.scrollY;

    if (spaceBelow > 280) {
      return {
        position: 'fixed',
        left: '50%',
        top: `${Math.min(highlightRect.top - window.scrollY + highlightRect.height + 16, viewportHeight - 320)}px`,
        transform: 'translateX(-50%)',
        zIndex: 10003
      };
    } else if (spaceAbove > 280) {
      return {
        position: 'fixed',
        left: '50%',
        top: `${Math.max(highlightRect.top - window.scrollY - 280, 16)}px`,
        transform: 'translateX(-50%)',
        zIndex: 10003
      };
    }

    return {
      position: 'fixed',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 10003
    };
  };

  const content = (
    <div 
      ref={containerRef}
      className="tour-overlay" 
      style={{ position: 'fixed', inset: 0, zIndex: 10000 }}
      role="dialog"
      aria-modal="true"
      aria-label="Product tour"
    >
      {/* Overlay background - click to close */}
      <div 
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity duration-300"
        style={{ zIndex: 10001 }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Highlight cutout */}
      {highlightRect && (
        <>
          {/* Clear window around highlighted element */}
          <div
            className="fixed rounded-xl transition-all duration-300 ease-out"
            style={{
              top: highlightRect.top - window.scrollY,
              left: highlightRect.left,
              width: highlightRect.width,
              height: highlightRect.height,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75)',
              zIndex: 10002,
              pointerEvents: 'none'
            }}
            aria-hidden="true"
          />
          {/* Animated ring around element */}
          <div
            className="fixed pointer-events-none rounded-xl border-2 border-primary transition-all duration-300 ease-out"
            style={{
              top: highlightRect.top - window.scrollY,
              left: highlightRect.left,
              width: highlightRect.width,
              height: highlightRect.height,
              zIndex: 10002,
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }}
            aria-hidden="true"
          />
        </>
      )}

      {/* Tour content card */}
      <div 
        className="flex items-center justify-center transition-all duration-300"
        style={getContentPosition()}
      >
        {children}
      </div>

      {/* Screen reader announcement */}
      <div className="sr-only" aria-live="polite">
        Use arrow keys to navigate. Press Escape to close the tour.
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
