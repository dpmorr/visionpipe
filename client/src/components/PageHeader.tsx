import { ReactNode } from 'react';
import { Box, Typography, Stack, useTheme } from '@mui/material';

interface CustomPageHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  extra?: ReactNode[] | ReactNode;
}

export default function CustomPageHeader({
  title,
  subtitle,
  eyebrow,
  extra,
}: CustomPageHeaderProps) {
  const theme = useTheme();
  const eyebrowText = eyebrow ?? '◢ ' + title.toUpperCase();

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        mb: 3,
        p: { xs: 2.5, md: 3 },
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        background:
          'linear-gradient(135deg, hsl(240, 10%, 7%) 0%, hsl(240, 10%, 5%) 100%)',
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(ellipse 60% 100% at 95% 0%, hsla(271, 91%, 65%, 0.16) 0%, transparent 60%), radial-gradient(ellipse 30% 70% at 0% 100%, hsla(292, 84%, 73%, 0.10) 0%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: 'space-between',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="overline"
            sx={{
              display: 'block',
              color: 'primary.light',
              fontFamily: 'JetBrains Mono, ui-monospace, monospace',
              fontSize: '0.7rem',
              letterSpacing: '0.14em',
              mb: 0.75,
              lineHeight: 1.2,
            }}
          >
            {eyebrowText}
          </Typography>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 700,
              letterSpacing: '-0.02em',
              mb: subtitle ? 0.5 : 0,
              color: 'text.primary',
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="body2"
              sx={{ color: 'text.secondary', maxWidth: 720 }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
        {extra && (
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ flexShrink: 0 }}
          >
            {Array.isArray(extra)
              ? extra.map((node, i) => <Box key={i}>{node}</Box>)
              : extra}
          </Stack>
        )}
      </Box>
    </Box>
  );
}
