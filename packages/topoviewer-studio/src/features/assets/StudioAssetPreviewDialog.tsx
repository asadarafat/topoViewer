import { useEffect, useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { StudioAssetContent, StudioHost } from '../../contracts/host';
import type { StudioAsset } from '../../contracts/project';
import { validateStudioAssetContent } from '../../security/assetSecurity';
import {
  StudioButton,
  StudioCircularProgress,
  StudioDialog,
  StudioDialogActions,
  StudioDialogContent,
  StudioDialogTitle
} from '../../ui/controls';
import { studioSpace } from '../../ui/muiSpacing';

interface StudioAssetPreviewDialogProps {
  asset: StudioAsset;
  host: StudioHost;
  onClose(): void;
  projectId: string;
}

function validatedAsset(
  contents: StudioAssetContent[],
  metadata: StudioAsset
): StudioAssetContent {
  const content = contents.find((item) => item.name === metadata.path);
  if (!content) {
    throw new Error(`Asset "${metadata.path}" is not available from this project host.`);
  }
  const validated = validateStudioAssetContent(content);
  if (
    validated.mediaType !== metadata.mediaType ||
    validated.bytes.byteLength !== metadata.size
  ) {
    throw new Error(`Asset "${metadata.path}" does not match its project metadata.`);
  }
  return validated;
}

export default function StudioAssetPreviewDialog({
  asset,
  host,
  onClose,
  projectId
}: StudioAssetPreviewDialogProps) {
  const [content, setContent] = useState<StudioAssetContent>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setContent(undefined);
    setError(undefined);
    setLoading(true);
    void host.readProjectAssets({ id: projectId }).then((result) => {
      if (!active) return;
      setLoading(false);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      try {
        setContent(validatedAsset(result.value, asset));
      } catch (assetError) {
        setError(assetError instanceof Error ? assetError.message : String(assetError));
      }
    });
    return () => {
      active = false;
    };
  }, [asset, host, projectId]);

  const previewUrl = useMemo(
    () =>
      content
        ? URL.createObjectURL(
            new Blob([Uint8Array.from(content.bytes)], { type: content.mediaType })
          )
        : undefined,
    [content]
  );

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl]
  );

  return (
    <StudioDialog
      aria-labelledby="studio-asset-preview-title"
      fullWidth
      maxWidth="sm"
      onClose={onClose}
      open
    >
      <StudioDialogTitle id="studio-asset-preview-title">
        {asset.path}
      </StudioDialogTitle>
      <StudioDialogContent>
        {loading ? (
          <Stack
            direction="row"
            spacing={studioSpace.space8}
            sx={{ alignItems: 'center', minHeight: 180, justifyContent: 'center' }}
          >
            <StudioCircularProgress />
            <Typography variant="body2">Reading project asset...</Typography>
          </Stack>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : previewUrl ? (
          <Stack spacing={studioSpace.space10}>
            <Box
              alt={asset.path}
              component="img"
              src={previewUrl}
              sx={{
                bgcolor: 'background.default',
                border: 1,
                borderColor: 'divider',
                maxHeight: 360,
                maxWidth: '100%',
                objectFit: 'contain',
                p: studioSpace.space12,
                width: '100%'
              }}
            />
            <Typography color="text.secondary" variant="caption">
              {asset.mediaType} · {asset.size.toLocaleString()} bytes
            </Typography>
          </Stack>
        ) : null}
      </StudioDialogContent>
      <StudioDialogActions>
        <StudioButton onClick={onClose}>Close</StudioButton>
      </StudioDialogActions>
    </StudioDialog>
  );
}
