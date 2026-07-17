import Accordion, { type AccordionProps } from '@mui/material/Accordion';
import AccordionDetails, { type AccordionDetailsProps } from '@mui/material/AccordionDetails';
import AccordionSummary, { type AccordionSummaryProps } from '@mui/material/AccordionSummary';
import Alert, { type AlertProps } from '@mui/material/Alert';
import Autocomplete, { type AutocompleteProps } from '@mui/material/Autocomplete';
import Button, { type ButtonProps } from '@mui/material/Button';
import ButtonBase, { type ButtonBaseProps } from '@mui/material/ButtonBase';
import Box from '@mui/material/Box';
import Checkbox, { type CheckboxProps } from '@mui/material/Checkbox';
import Dialog, { type DialogProps } from '@mui/material/Dialog';
import DialogActions, { type DialogActionsProps } from '@mui/material/DialogActions';
import DialogContent, { type DialogContentProps } from '@mui/material/DialogContent';
import DialogTitle, { type DialogTitleProps } from '@mui/material/DialogTitle';
import FormControl, { type FormControlProps } from '@mui/material/FormControl';
import FormControlLabel, { type FormControlLabelProps } from '@mui/material/FormControlLabel';
import FormHelperText, { type FormHelperTextProps } from '@mui/material/FormHelperText';
import FormLabel, { type FormLabelProps } from '@mui/material/FormLabel';
import IconButton, { type IconButtonProps } from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import InputBase from '@mui/material/InputBase';
import InputLabel, { type InputLabelProps } from '@mui/material/InputLabel';
import Divider, { type DividerProps } from '@mui/material/Divider';
import ListItemIcon, { type ListItemIconProps } from '@mui/material/ListItemIcon';
import ListItemButton, { type ListItemButtonProps } from '@mui/material/ListItemButton';
import ListItemText, { type ListItemTextProps } from '@mui/material/ListItemText';
import Menu, { type MenuProps } from '@mui/material/Menu';
import MenuItem, { type MenuItemProps } from '@mui/material/MenuItem';
import Popover, { type PopoverProps } from '@mui/material/Popover';
import Radio, { type RadioProps } from '@mui/material/Radio';
import CircularProgress, { type CircularProgressProps } from '@mui/material/CircularProgress';
import LinearProgress, { type LinearProgressProps } from '@mui/material/LinearProgress';
import Select, { type SelectProps } from '@mui/material/Select';
import Switch, { type SwitchProps } from '@mui/material/Switch';
import Tab, { type TabProps } from '@mui/material/Tab';
import Tabs, { type TabsProps } from '@mui/material/Tabs';
import TextField, { type TextFieldProps } from '@mui/material/TextField';
import ToggleButton, { type ToggleButtonProps } from '@mui/material/ToggleButton';
import ToggleButtonGroup, { type ToggleButtonGroupProps } from '@mui/material/ToggleButtonGroup';
import Tooltip, { type TooltipProps } from '@mui/material/Tooltip';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import { forwardRef, type AnchorHTMLAttributes, type ChangeEvent, type ElementType, type RefObject, type ReactNode, useEffect, useRef } from 'react';

export const StudioButton = forwardRef<HTMLButtonElement, ButtonProps>(function StudioButton(props, ref) {
  return <Button {...props} ref={ref} />;
});

export const StudioButtonBase = forwardRef<HTMLButtonElement, ButtonBaseProps>(function StudioButtonBase(props, ref) {
  return <ButtonBase {...props} ref={ref} />;
});

type StudioIconButtonProps = IconButtonProps &
  Pick<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'rel' | 'target'> & {
    component?: ElementType;
    title?: string;
  };

export const StudioIconButton = forwardRef<HTMLButtonElement, StudioIconButtonProps>(function StudioIconButton({ sx, title, ...props }, ref) {
  const button = (
    <IconButton
      {...(props as IconButtonProps)}
      data-studio-tooltip={title}
      ref={ref}
      sx={[
        {
          '&.Mui-focusVisible': {
            outline: '2px solid currentColor',
            outlineOffset: 2
          }
        },
        ...(Array.isArray(sx) ? sx : [sx])
      ]}
    />
  );
  if (!title) return button;
  if (props.disabled) {
    return (
      <Tooltip
        describeChild
        slotProps={{
          popper: { disablePortal: true },
          transition: { timeout: 0 }
        }}
        title={title}
      >
        <Box component="span" sx={{ display: 'inline-flex' }}>
          {button}
        </Box>
      </Tooltip>
    );
  }
  return (
    <Tooltip
      describeChild
      slotProps={{
        popper: { disablePortal: true },
        transition: { timeout: 0 }
      }}
      title={title}
    >
      {button}
    </Tooltip>
  );
});

export function StudioTextField({ 'aria-describedby': ariaDescribedBy, 'aria-errormessage': ariaErrorMessage, 'aria-label': ariaLabel, inputMode, onKeyDown, slotProps, ...props }: TextFieldProps) {
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

type StudioSearchFieldProps = Omit<TextFieldProps, 'type'> & {
  clearLabel: string;
  onClear(): void;
  value: string;
};

export function StudioSearchField({ className, clearLabel, onClear, onKeyDown, slotProps, value, ...props }: StudioSearchFieldProps) {
  const input = typeof slotProps?.input === 'object' ? slotProps.input : {};
  const htmlInput = typeof slotProps?.htmlInput === 'object' ? slotProps.htmlInput : {};
  return (
    <StudioTextField
      {...props}
      className={className}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || event.key !== 'Escape' || !value) return;
        event.preventDefault();
        onClear();
      }}
      slotProps={{
        ...slotProps,
        htmlInput: {
          ...htmlInput,
          role: 'searchbox'
        },
        input: {
          ...input,
          endAdornment: value ? (
            <InputAdornment position="end">
              <StudioIconButton aria-label={clearLabel} edge="end" onClick={onClear} onMouseDown={(event) => event.preventDefault()} title={clearLabel} type="button">
                <ClearIcon fontSize="small" />
              </StudioIconButton>
            </InputAdornment>
          ) : undefined,
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon aria-hidden="true" fontSize="small" />
            </InputAdornment>
          )
        }
      }}
      type="text"
      value={value}
    />
  );
}

export const StudioTextarea = forwardRef<HTMLTextAreaElement, TextFieldProps>(function StudioTextarea(
  { 'aria-describedby': ariaDescribedBy, 'aria-errormessage': ariaErrorMessage, 'aria-label': ariaLabel, slotProps, spellCheck, ...props },
  ref
) {
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
});

type StudioSelectProps = Omit<SelectProps<string>, 'native'>;

export function StudioSelect({ MenuProps, ...props }: StudioSelectProps) {
  const renderValue =
    props.renderValue ||
    ((selected: unknown) => (
      <Box
        component="span"
        sx={{
          display: 'block',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
        title={String(selected || '')}
      >
        {String(selected || '')}
      </Box>
    ));
  return <Select fullWidth MenuProps={{ transitionDuration: 0, ...MenuProps }} renderValue={renderValue} size="small" {...props} />;
}

export function StudioOption(props: MenuItemProps) {
  return <MenuItem {...props} />;
}

type StudioMultiAutocompleteProps = Omit<AutocompleteProps<string, true, false, false>, 'multiple' | 'renderInput' | 'size'> & {
  ariaLabel: string;
  placeholder?: string;
};

export function StudioMultiAutocomplete({ ariaLabel, placeholder, ...props }: StudioMultiAutocompleteProps) {
  return (
    <Autocomplete<string, true, false, false>
      limitTags={1}
      multiple
      size="small"
      {...props}
      slotProps={{ chip: { variant: 'outlined' } }}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={placeholder}
          slotProps={{
            ...params.slotProps,
            htmlInput: {
              ...params.slotProps.htmlInput,
              'aria-label': ariaLabel
            }
          }}
        />
      )}
    />
  );
}

export function StudioListItemButton(props: ListItemButtonProps) {
  return <ListItemButton {...props} />;
}

export function StudioFormControl(props: FormControlProps) {
  return <FormControl fullWidth size="small" {...props} />;
}

export function StudioFormLabel(props: FormLabelProps) {
  return <FormLabel {...props} />;
}

export function StudioFormHelperText(props: FormHelperTextProps) {
  return <FormHelperText {...props} />;
}

export function StudioInputLabel(props: InputLabelProps) {
  return <InputLabel {...props} />;
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

type StudioDialogProps = DialogProps & {
  initialFocusRef?: RefObject<HTMLElement | null>;
};

function useInitialFocus(open: boolean, initialFocusRef?: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open || !initialFocusRef) return undefined;
    const timeout = setTimeout(() => initialFocusRef.current?.focus(), 0);
    return () => clearTimeout(timeout);
  }, [initialFocusRef, open]);
}

export function StudioDialog({ initialFocusRef, open, ...props }: StudioDialogProps) {
  useInitialFocus(open, initialFocusRef);

  return <Dialog fullWidth maxWidth="sm" open={open} transitionDuration={0} {...props} />;
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
  return <Menu transitionDuration={0} {...props} />;
}

type StudioMenuItemProps = MenuItemProps &
  Pick<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'rel' | 'target'> & {
    component?: ElementType;
  };

export function StudioMenuItem(props: StudioMenuItemProps) {
  return <MenuItem {...(props as MenuItemProps)} />;
}

export function StudioMenuDivider(props: DividerProps) {
  return <Divider {...props} />;
}

export function StudioMenuItemIcon(props: ListItemIconProps) {
  return <ListItemIcon {...props} />;
}

export function StudioMenuItemText(props: ListItemTextProps) {
  return <ListItemText {...props} />;
}

type StudioPopoverProps = PopoverProps & {
  initialFocusRef?: RefObject<HTMLElement | null>;
};

export function StudioPopover({ initialFocusRef, open, ...props }: StudioPopoverProps) {
  useInitialFocus(open, initialFocusRef);
  return <Popover open={open} transitionDuration={0} {...props} />;
}

export function StudioAlert(props: AlertProps) {
  return <Alert {...props} />;
}

export function StudioCircularProgress(props: CircularProgressProps) {
  return <CircularProgress aria-label="Loading" size={20} thickness={5} {...props} />;
}

export function StudioLinearProgress(props: LinearProgressProps) {
  return <LinearProgress {...props} />;
}

export function StudioTabs(props: TabsProps) {
  return <Tabs {...props} />;
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
      slotProps={{
        ...props.slotProps,
        popper: { ...popper, disablePortal: true }
      }}
    />
  );
}

export function StudioHiddenFileInput({ accept, ariaLabel, onChange }: { accept?: string; ariaLabel: string; onChange(event: ChangeEvent<HTMLInputElement>): void }) {
  return <InputBase className="studio-visually-hidden" inputProps={{ accept, 'aria-label': ariaLabel, tabIndex: -1 }} onChange={onChange} type="file" />;
}

export function StudioFileButton({ accept, ariaLabel, children, onChange }: { accept?: string; ariaLabel: string; children: ReactNode; onChange(event: ChangeEvent<HTMLInputElement>): void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <Button onClick={() => inputRef.current?.click()} size="small" type="button" variant="outlined">
        {children}
      </Button>
      <InputBase className="studio-visually-hidden" inputProps={{ accept, 'aria-label': ariaLabel, tabIndex: -1 }} inputRef={inputRef} onChange={onChange} type="file" />
    </>
  );
}

export type { ReactNode };
