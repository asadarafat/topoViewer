import type { ComponentProps } from 'react';
import { ExternalChangeDialog } from './ExternalChangeDialog';
import { NormalizationReviewDialog } from './NormalizationReviewDialog';
import { StyleCandidateResolutionDialog } from './StyleCandidateResolutionDialog';

export { ProjectMenu } from './ProjectMenu';

interface ProjectDialogsProps {
  externalChange?: ComponentProps<typeof ExternalChangeDialog>;
  normalizationReview?: ComponentProps<typeof NormalizationReviewDialog>;
  styleResolution?: ComponentProps<typeof StyleCandidateResolutionDialog>;
}

export default function ProjectDialogs({ externalChange, normalizationReview, styleResolution }: ProjectDialogsProps) {
  return (
    <>
      {externalChange ? <ExternalChangeDialog {...externalChange} /> : null}
      {styleResolution ? <StyleCandidateResolutionDialog {...styleResolution} /> : null}
      {normalizationReview ? <NormalizationReviewDialog {...normalizationReview} /> : null}
    </>
  );
}
