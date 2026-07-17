import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { StudioNormalizationReview } from '../../session';
import { StudioButton, StudioDialog, StudioDialogActions, StudioDialogContent, StudioDialogTitle } from '../../ui/controls';
import { studioSpace } from '../../ui/muiSpacing';

interface NormalizationReviewDialogProps {
  onCancel(): void;
  onConfirm(): boolean;
  review?: StudioNormalizationReview;
}

export function NormalizationReviewDialog({ onCancel, onConfirm, review }: NormalizationReviewDialogProps) {
  return (
    <StudioDialog aria-labelledby="studio-normalization-review-title" fullWidth maxWidth="md" onClose={onCancel} open={Boolean(review)}>
      <StudioDialogTitle id="studio-normalization-review-title">Review {review?.document || 'document'} normalization</StudioDialogTitle>
      <StudioDialogContent>
        <Stack spacing={studioSpace.space16}>
          <Typography variant="body2">{review?.reason}</Typography>
          <Box
            aria-label="Normalization diff"
            sx={{
              bgcolor: 'background.default',
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              maxHeight: 360,
              overflow: 'auto',
              p: studioSpace.space12
            }}
          >
            {(review?.diff.beforeLines || []).map((line, index) => (
              <Typography color="error.light" component="code" key={`removed-${index}`} sx={{ display: 'block' }} variant="caption">
                -{line}
              </Typography>
            ))}
            {(review?.diff.afterLines || []).map((line, index) => (
              <Typography color="success.light" component="code" key={`added-${index}`} sx={{ display: 'block' }} variant="caption">
                +{line}
              </Typography>
            ))}
          </Box>
        </Stack>
      </StudioDialogContent>
      <StudioDialogActions>
        <StudioButton onClick={onCancel}>Cancel</StudioButton>
        <StudioButton onClick={onConfirm} variant="contained">
          Confirm normalization
        </StudioButton>
      </StudioDialogActions>
    </StudioDialog>
  );
}
