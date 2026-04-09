import { useState, useRef, useCallback, useEffect } from "react";
import { X, Square, Maximize2, Minimize2 } from "lucide-react";

interface ResizableWindowProps {
  title: React.ReactNode;
  id: string;
  children: React.ReactNode;
  visible: boolean;
  onClose: (id: string) => void;
  onToggleMinimize?: (isMinimized: boolean) => void;
  defaultPosition: { x: number; y: number };
  defaultSize: { width: number; height: number };
  minWidth?: number;
  minHeight?: number;
  lockAspectRatio?: boolean;
}

export const ResizableWindow = ({
  title,
  id,
  children,
  visible,
  onClose,
  onToggleMinimize,
  defaultPosition,
  defaultSize,
  minWidth = 250,
  minHeight = 200,
  lockAspectRatio = false,
}: ResizableWindowProps) => {
  const [position, setPosition] = useState(defaultPosition);
  const [size, setSize] = useState(defaultSize);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const windowRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ width: 0, height: 0, x: 0, y: 0 });
  const aspectRatio = useRef(defaultSize.width / defaultSize.height);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.window-controls')) return;
    setIsDragging(true);
    dragStart.current = { 
      x: e.clientX - position.x, 
      y: e.clientY - position.y 
    };
  }, [position]);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    resizeStart.current = { 
      width: size.width, 
      height: size.height, 
      x: e.clientX, 
      y: e.clientY 
    };
  }, [size]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = Math.max(0, e.clientX - dragStart.current.x);
        const newY = Math.max(0, e.clientY - dragStart.current.y);
        setPosition({ x: newX, y: newY });
      }
      if (isResizing) {
        const deltaX = e.clientX - resizeStart.current.x;
        const deltaY = e.clientY - resizeStart.current.y;
        
        let newWidth = Math.max(minWidth, resizeStart.current.width + deltaX);
        let newHeight = Math.max(minHeight, resizeStart.current.height + deltaY);
        
        if (lockAspectRatio) {
          // Maintain aspect ratio based on which dimension changed more
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            newHeight = newWidth / aspectRatio.current;
          } else {
            newWidth = newHeight * aspectRatio.current;
          }
          newWidth = Math.max(minWidth, newWidth);
          newHeight = Math.max(minHeight, newHeight);
        }
        
        setSize({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, minWidth, minHeight, lockAspectRatio]);

  const handleReset = () => {
    setSize(defaultSize);
    setPosition(defaultPosition);
    setIsMinimized(false);
  };

  const toggleMinimize = () => {
    const newState = !isMinimized;
    setIsMinimized(newState);
    onToggleMinimize?.(newState);
  };

  if (!visible) return null;

  return (
    <div
      ref={windowRef}
      className="resizable-window"
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: size.width,
        height: isMinimized ? 48 : size.height,
        zIndex: isDragging || isResizing ? 200 : 100,
        transition: isMinimized ? 'height 0.2s ease-out' : undefined,
      }}
    >
      {/* Window Container */}
      <div className="h-full w-full flex flex-col bg-card rounded-xl shadow-lg border border-border overflow-hidden">
        {/* Header - Draggable */}
        <div
          onMouseDown={handleMouseDown}
          className="window-header flex items-center justify-between px-4 py-2.5 bg-muted/50 border-b border-border cursor-move select-none"
        >
          <span className="font-semibold text-primary text-sm">{title}</span>
          <div className="window-controls flex items-center gap-1">
            <button
              onClick={handleReset}
              className="p-1.5 rounded-md hover:bg-muted transition-colors"
              title="Reset size and position"
            >
              <Square className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            <button
              onClick={toggleMinimize}
              className="p-1.5 rounded-md hover:bg-muted transition-colors"
              title={isMinimized ? "Expand" : "Minimize"}
            >
              {isMinimized ? (
                <Maximize2 className="w-3.5 h-3.5 text-muted-foreground" />
              ) : (
                <Minimize2 className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </button>
            <button
              onClick={() => onClose(id)}
              className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors"
              title="Close"
            >
              <X className="w-3.5 h-3.5 text-destructive" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div 
          className="flex-1 overflow-hidden"
          style={{
            display: isMinimized ? 'none' : 'block',
          }}
        >
          {children}
        </div>

        {/* Resize Handle */}
        <div
          onMouseDown={handleResizeMouseDown}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize group"
          style={{ 
            touchAction: 'none',
            display: isMinimized ? 'none' : 'block',
          }}
        >
          <svg
            className="w-full h-full text-muted-foreground/40 group-hover:text-primary transition-colors"
            viewBox="0 0 16 16"
          >
            <path
              d="M14 14L14 8M14 14L8 14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};