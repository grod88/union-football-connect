/**
 * OBSLayout Component
 * Transparent layout wrapper for OBS Browser Source pages
 * No header, footer, or navigation - just content
 */
import { cn } from '@/lib/utils';

interface OBSLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const OBSLayout = ({ children, className }: OBSLayoutProps) => {
  return (
    <div
      className={cn(
        'min-h-screen w-full',
        // Transparent background for OBS
        'bg-transparent',
        className
      )}
      style={{
        // Ensure complete transparency
        backgroundColor: 'transparent',
      }}
    >
      {children}
    </div>
  );
};

export default OBSLayout;
