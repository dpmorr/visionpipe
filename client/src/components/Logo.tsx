import { Link } from "wouter";
import { Box, SxProps, Theme } from '@mui/material';

interface LogoProps {
  height?: number;
  size?: number;
  withText?: boolean;
  variant?: 'full' | 'mark';
  sx?: SxProps<Theme>;
}

function LogoMark({ size }: { size: number }) {
  return (
    <Box
      component="span"
      sx={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: `${Math.max(6, size * 0.22)}px`,
        background: 'linear-gradient(135deg, hsl(271, 91%, 65%) 0%, hsl(292, 84%, 73%) 100%)',
        boxShadow: '0 0 0 1px hsla(271, 91%, 65%, 0.4), 0 6px 20px hsla(271, 91%, 65%, 0.35)',
        flexShrink: 0,
      }}
    >
      <svg
        width={size * 0.62}
        height={size * 0.62}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M3 12 L9 4 H15 L21 12 L15 20 H9 Z"
          stroke="white"
          strokeWidth="1.8"
          strokeLinejoin="round"
          fill="rgba(255,255,255,0.08)"
        />
        <circle cx="12" cy="12" r="3" fill="white" />
      </svg>
    </Box>
  );
}

function Logo({ height = 40, size, withText = true, variant = 'full', sx }: LogoProps) {
  const logoHeight = size || height;
  const showText = withText && variant === 'full';

  return (
    <Link href="/">
      <a
        className="flex items-center no-underline transition-opacity hover:opacity-90"
        style={{ gap: Math.round(logoHeight * 0.28) }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', ...(sx as any) }}>
          <LogoMark size={logoHeight} />
          {showText && (
            <Box
              component="span"
              sx={{
                ml: `${Math.round(logoHeight * 0.32)}px`,
                fontFamily: 'Inter, sans-serif',
                fontSize: `${Math.round(logoHeight * 0.45)}px`,
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: 'hsl(240, 5%, 96%)',
                lineHeight: 1,
                whiteSpace: 'nowrap',
              }}
            >
              vision<span style={{ color: 'hsl(292, 84%, 73%)' }}>pipe</span>
            </Box>
          )}
        </Box>
      </a>
    </Link>
  );
}

export default Logo;
