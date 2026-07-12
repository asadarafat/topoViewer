import Accordion, { type AccordionProps } from '@mui/material/Accordion';
import AccordionDetails, { type AccordionDetailsProps } from '@mui/material/AccordionDetails';
import AccordionSummary, { type AccordionSummaryProps } from '@mui/material/AccordionSummary';
import Alert, { type AlertProps } from '@mui/material/Alert';
import Button, { type ButtonProps } from '@mui/material/Button';
import ButtonBase, { type ButtonBaseProps } from '@mui/material/ButtonBase';
import Checkbox, { type CheckboxProps } from '@mui/material/Checkbox';
import Dialog, { type DialogProps } from '@mui/material/Dialog';
import DialogActions, { type DialogActionsProps } from '@mui/material/DialogActions';
import DialogContent, { type DialogContentProps } from '@mui/material/DialogContent';
import DialogTitle, { type DialogTitleProps } from '@mui/material/DialogTitle';
import FormControlLabel, { type FormControlLabelProps } from '@mui/material/FormControlLabel';
import IconButton, { type IconButtonProps } from '@mui/material/IconButton';
import Menu, { type MenuProps } from '@mui/material/Menu';
import MenuItem, { type MenuItemProps } from '@mui/material/MenuItem';
import Popover, { type PopoverProps } from '@mui/material/Popover';
import Radio, { type RadioProps } from '@mui/material/Radio';
import CircularProgress, { type CircularProgressProps } from '@mui/material/CircularProgress';
import LinearProgress, { type LinearProgressProps } from '@mui/material/LinearProgress';
import Select, { type SelectChangeEvent, type SelectProps } from '@mui/material/Select';
import Switch, { type SwitchProps } from '@mui/material/Switch';
import Tab, { type TabProps } from '@mui/material/Tab';
import Tabs, { type TabsProps } from '@mui/material/Tabs';
import TextField, { type TextFieldProps } from '@mui/material/TextField';
import ToggleButton, { type ToggleButtonProps } from '@mui/material/ToggleButton';
import ToggleButtonGroup, { type ToggleButtonGroupProps } from '@mui/material/ToggleButtonGroup';
import Tooltip, { type TooltipProps } from '@mui/material/Tooltip';
import {
  forwardRef,
  type AnchorHTMLAttributes,
  type ChangeEvent,
  type ElementType,
  type KeyboardEvent,
  type ReactNode,
  useRef
} from 'react';

export const StudioButton = forwardRef<HTMLButtonElement, ButtonProps>(function StudioButton(props, ref) {
  const color = props.className?.includes('danger') ? 'error' : props.color;
  const variant = props.className?.includes('primary') || props.className?.includes('danger-button')
    ? 'contained'
    : props.variant || 'outlined';
  return <Button {...props} color={color} ref={ref} variant={variant} />;
});

export const StudioButtonBase = forwardRef<HTMLButtonElement, ButtonBaseProps>(function StudioButtonBase(props, ref) {
  return <ButtonBase {...props} ref={ref} />;
});

type StudioIconButtonProps = IconButtonProps
  & Pick<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'rel' | 'target'>
  & { component?: ElementType; title?: string };

export const StudioIconButton = forwardRef<HTMLButtonElement, StudioIconButtonProps>(function StudioIconButton({ title, ...props }, ref) {
  const button = <IconButton {...props as IconButtonProps} data-studio-tooltip={title} ref={ref} />;
  if (!title) return button;
  if (props.disabled) {
    return (
      <Tooltip describeChild slotProps={{ popper: { disablePortal: true } }} title={title}>
        <span className="studio-icon-button-tooltip-anchor">{button}</span>
      </Tooltip>
    );
  }
  return <Tooltip describeChild slotProps={{ popper: { disablePortal: true } }} title={title}>{button}</Tooltip>;
});

export function StudioTextField({
  'aria-describedby': ariaDescribedBy,
  'aria-errormessage': ariaErrorMessage,
  'aria-label': ariaLabel,
  inputMode,
  onKeyDown,
  slotProps,
  ...props
}: TextFieldProps) {
  const htmlInput = typeof slotProps?.htmlInput === 'object' ? slotProps.htmlInput : {};
  return (
    <TextField
      fullWidth
      size="small"
      variant="outlined"
      {...props}
      slotProps={{
        ...slotProps,
        htmlInput: {
          ...htmlInput,
          'aria-describedby': ariaDescribedBy,
          'aria-errormessage': ariaErrorMessage,
          'aria-label': ariaLabel,
          inputMode,
          onKeyDown
        }
      }}
    />
  );
}

export const StudioTextarea = forwardRef<HTMLTextAreaElement, TextFieldProps>(
  function StudioTextarea({
    'aria-describedby': ariaDescribedBy,
    'aria-errormessage': ariaErrorMessage,
    'aria-label': ariaLabel,
    slotProps,
    spellCheck,
    ...props
  }, ref) {
    const htmlInput = typeof slotProps?.htmlInput === 'object' ? slotProps.htmlInput : {};
    return (
      <TextField
        fullWidth
        multiline
        size="small"
        variant="outlined"
        {...props}
        slotProps={{
          ...slotProps,
          htmlInput: {
            ...htmlInput,
            'aria-describedby': ariaDescribedBy,
            'aria-errormessage': ariaErrorMessage,
            'aria-label': ariaLabel,
            ref,
            spellCheck
          }
        }}
      />
    );
  }
);

type StudioSelectProps = Omit<SelectProps<string>, 'native' | 'onChange'> & {
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
};

export function StudioSelect({ onChange, ...props }: StudioSelectProps) {
  return (
    <Select
      fullWidth
      native
      size="small"
      {...props}
      onChange={onChange ? (event: SelectChangeEvent<string>) => onChange(event as unknown as ChangeEvent<HTMLSelectElement>) : undefined}
    />
  );
}

export function StudioCheckbox({ 'aria-label': ariaLabel, slotProps, ...props }: CheckboxProps) {
  const input = typeof slotProps?.input === 'object' ? slotProps.input : {};
  return <Checkbox size="small" {...props} slotProps={{ ...slotProps, input: { ...input, 'aria-label': ariaLabel } }} />;
}

export function StudioSwitch(props: SwitchProps) {
  return <Switch size="small" {...props} />;
}

export function StudioRadio(props: RadioProps) {
  return <Radio size="small" {...props} />;
}

export function StudioLabeledControl(props: FormControlLabelProps) {
  return <FormControlLabel {...props} />;
}

export function StudioDialog(props: DialogProps) {
  return <Dialog fullWidth maxWidth="sm" {...props} />;
}

export function StudioDialogTitle(props: DialogTitleProps) {
  return <DialogTitle {...props} />;
}

export function StudioDialogContent(props: DialogContentProps) {
  return <DialogContent dividers {...props} />;
}

export function StudioDialogActions(props: DialogActionsProps) {
  return <DialogActions {...props} />;
}

export function StudioMenu(props: MenuProps) {
  return <Menu {...props} />;
}

export function StudioMenuItem(props: MenuItemProps) {
  return <MenuItem {...props} />;
}

export function StudioPopover(props: PopoverProps) {
  return <Popover {...props} />;
}

export function StudioAlert(props: AlertProps) {
  return <Alert variant="outlined" {...props} />;
}

export function StudioCircularProgress(props: CircularProgressProps) {
  return <CircularProgress size={20} thickness={5} {...props} />;
}

export function StudioLinearProgress(props: LinearProgressProps) {
  return <LinearProgress {...props} />;
}

export function StudioTabs(props: TabsProps) {
  function moveFocus(event: KeyboardEvent<HTMLDivElement>) {
    props.onKeyDown?.(event);
    if (event.defaultPrevented || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const target = event.target instanceof HTMLElement ? event.target : undefined;
    if (target?.getAttribute('role') !== 'tab') return;
    const tabs = [...event.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]:not([disabled])')];
    const current = tabs.indexOf(target);
    if (current < 0 || !tabs.length) return;
    event.preventDefault();
    const next = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? tabs.length - 1
        : (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    tabs[next].focus();
  }

  return <Tabs variant="fullWidth" {...props} onKeyDown={moveFocus} />;
}

export function StudioTab(props: TabProps) {
  return <Tab {...props} />;
}

export function StudioAccordion(props: AccordionProps) {
  return <Accordion disableGutters elevation={0} {...props} />;
}

export function StudioAccordionSummary(props: AccordionSummaryProps) {
  return <AccordionSummary {...props} />;
}

export function StudioAccordionDetails(props: AccordionDetailsProps) {
  return <AccordionDetails {...props} />;
}

export function StudioToggleButton(props: ToggleButtonProps) {
  return <ToggleButton size="small" {...props} />;
}

export function StudioToggleButtonGroup(props: ToggleButtonGroupProps) {
  return <ToggleButtonGroup exclusive size="small" {...props} />;
}

export function StudioTooltip(props: TooltipProps) {
  const popper = typeof props.slotProps?.popper === 'object' ? props.slotProps.popper : {};
  return (
    <Tooltip
      arrow
      enterDelay={450}
      {...props}
      slotProps={{ ...props.slotProps, popper: { ...popper, disablePortal: true } }}
    />
  );
}

export function StudioHiddenFileInput({
  accept,
  ariaLabel,
  onChange
}: {
  accept?: string;
  ariaLabel: string;
  onChange(event: ChangeEvent<HTMLInputElement>): void;
}) {
  return <input accept={accept} aria-label={ariaLabel} className="studio-visually-hidden" onChange={onChange} tabIndex={-1} type="file" />;
}

export function StudioFileButton({
  accept,
  ariaLabel,
  children,
  onChange
}: {
  accept?: string;
  ariaLabel: string;
  children: ReactNode;
  onChange(event: ChangeEvent<HTMLInputElement>): void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <Button onClick={() => inputRef.current?.click()} size="small" type="button" variant="outlined">{children}</Button>
      <input
        accept={accept}
        aria-label={ariaLabel}
        className="studio-visually-hidden"
        onChange={onChange}
        ref={inputRef}
        tabIndex={-1}
        type="file"
      />
    </>
  );
}

export function StudioNativeColorInput({
  ariaLabel,
  onChange,
  value
}: {
  ariaLabel: string;
  onChange(value: string): void;
  value: string;
}) {
  return (
    <input
      type="color"
      aria-label={ariaLabel}
      className="studio-native-color-input"
      onChange={(event) => onChange(event.target.value)}
      value={value}
    />
  );
}

export type { ReactNode };
