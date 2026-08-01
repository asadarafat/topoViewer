import SvgIcon, { type SvgIconProps } from '@mui/material/SvgIcon';

export { default as StudioObjectDrawerIcon } from '@mui/icons-material/VerticalSplitOutlined';
export { default as StudioServiceIcon } from '@mui/icons-material/DnsOutlined';
export { default as StudioParentChildIcon } from '@mui/icons-material/AccountTreeOutlined';
export { default as StudioLinkIcon } from '@mui/icons-material/TrendingFlatOutlined';
export { default as StudioRegionIcon } from '@mui/icons-material/SelectAllOutlined';
export { default as StudioShapeIcon } from '@mui/icons-material/ShapeLineOutlined';
export { default as StudioPathIcon } from '@mui/icons-material/TimelineOutlined';
export { default as StudioDirectionalLinkIcon } from '@mui/icons-material/RepeatOutlined';
export { default as StudioCalloutIcon } from '@mui/icons-material/ChatBubbleOutlineOutlined';
export { default as StudioTextIcon } from '@mui/icons-material/TextFieldsOutlined';
export { default as StudioPresetIcon } from '@mui/icons-material/BookmarkBorderOutlined';

export function StudioRouterIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="10 10 100 100">
      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="7.5"
      >
        <path d="M71.7 19.7V48h28" />
        <path d="m91.2 38.5 7.5 7.6c1.3 1.3 1.3 3.1 0 4.3L91.1 58" />
        <path d="M20 47.8h28.4v-28" />
        <path d="m38.8 28.3 7.6-7.5c1.3-1.3 3.1-1.3 4.3 0l7.7 7.6" />
        <path d="M48 100.3V72H20" />
        <path d="m28.5 81.5-7.5-7.6c-1.3-1.3-1.3-3.1 0-4.3l7.6-7.7" />
        <path d="M100 71.9H71.6v28" />
        <path d="m81.2 91.4-7.6 7.5c-1.3 1.3-3.1 1.3-4.3 0l-7.7-7.6" />
      </g>
    </SvgIcon>
  );
}

export function StudioControllerIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="10 10 100 100">
      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="7"
        transform="translate(60 60) scale(1.1) translate(-60 -60)"
      >
        <path d="M82.8 60c0 12.6-10.2 22.8-22.8 22.8S37.2 72.6 37.2 60 47.4 37.2 60 37.2c6.3 0 12 2.6 16.2 6.7 4 4.2 6.6 9.9 6.6 16.1Z" />
        <path d="m92.4 27.8 6.7 7.2c1.2 1.2 1.2 2.9 0 4.1l-6.7 7.7M59.8 37.2h38.1" />
        <path d="m27.6 92.2-6.7-7.2c-1.2-1.2-1.2-2.9 0-4.1l6.7-7.7M60.2 82.8H22.1" />
      </g>
    </SvgIcon>
  );
}

export function StudioParallelLinkIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path
        d="M2 12C6 1 18 1 22 12M2 12h20M2 12c4 11 16 11 20 0"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <circle cx="2" cy="12" fill="currentColor" r="1.5" />
      <circle cx="22" cy="12" fill="currentColor" r="1.5" />
    </SvgIcon>
  );
}

export function StudioParentLinkPipeIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path
        data-icon-part="carrier"
        d="M6.5 4h7M6.5 20h7M6.5 4C5.1 4 4 7.6 4 12s1.1 8 2.5 8"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <ellipse
        cx="13.5"
        cy="12"
        data-icon-part="carrier"
        fill="none"
        rx="2.5"
        ry="8"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        data-icon-part="child-link"
        d="M0.5 12h23m-3.5-3 3.5 3-3.5 3"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </SvgIcon>
  );
}
