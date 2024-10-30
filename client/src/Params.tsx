// Params.tsx
import React from 'react';
import { Slider, Typography, Box } from '@mui/material';

interface SlidersProps {
  forceCenterStrength: number;
  setForceCenterStrength: (value: number) => void;
  forceManyBodyStrength: number;
  setForceManyBodyStrength: (value: number) => void;
  linkStrengthFactor: number;
  setLinkStrengthFactor: (value: number) => void;
}

const Sliders: React.FC<SlidersProps> = ({
  forceCenterStrength,
  setForceCenterStrength,
  forceManyBodyStrength,
  setForceManyBodyStrength,
  linkStrengthFactor,
  setLinkStrengthFactor,
}) => {
  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <Box>
        <Typography gutterBottom>
          Force Center Strength: {forceCenterStrength}
        </Typography>
        <Slider
          value={forceCenterStrength}
          onChange={(e, val) => setForceCenterStrength(val as number)}
          min={0}
          max={1}
          step={0.01}
          aria-labelledby="force-center-strength-slider"
        />
      </Box>
      <Box>
        <Typography gutterBottom>
          Force Many Body Strength: {forceManyBodyStrength}
        </Typography>
        <Slider
          value={forceManyBodyStrength}
          onChange={(e, val) => setForceManyBodyStrength(val as number)}
          min={-10000}
          max={0}
          step={100}
          aria-labelledby="force-many-body-strength-slider"
        />
      </Box>
      <Box>
        <Typography gutterBottom>
          Link Strength Factor: {linkStrengthFactor}
        </Typography>
        <Slider
          value={linkStrengthFactor}
          onChange={(e, val) => setLinkStrengthFactor(val as number)}
          min={0}
          max={1}
          step={0.01}
          aria-labelledby="link-strength-factor-slider"
        />
      </Box>
    </Box>
  );
};

export default Sliders;