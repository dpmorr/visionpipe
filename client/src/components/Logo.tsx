import { Link } from "wouter";
import { SxProps, Theme } from '@mui/material';

interface LogoProps {
  height?: number;
  size?: number;
  withText?: boolean;
  sx?: SxProps<Theme>;
}

function Logo({ height = 54, size, withText = false, sx }: LogoProps) {
  const logoHeight = size || height;
  
  return (
    <Link href="/">
      <a className="flex items-center no-underline hover:opacity-80 transition-opacity">
        <div 
          className="relative flex items-center justify-center" 
          style={{ height: logoHeight, ...(sx as React.CSSProperties) }}
        >
          <img
            src="/assets/wastetraq_logo.png"
            alt="wastetraq Logo"
            style={{ 
              height: logoHeight * 0.8, 
              width: 'auto',
              objectFit: "contain"
            }}
            className="object-contain"
          />
          {withText && (
            <span 
              className="ml-2 font-semibold" 
              style={{ lineHeight: `${logoHeight}px` }}
            >
              wastetraq
            </span>
          )}
        </div>
      </a>
    </Link>
  );
}

export default Logo;