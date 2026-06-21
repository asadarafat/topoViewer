# Improve VS Code Style Value Editor

## Why

The browser harness Inspect panel must make style authoring approachable without
requiring users to remember YAML value formats. A single text input for every
style value is too error-prone because style keys have different value types:
enums, booleans, integers, numbers, colors, and free text.

## What Changes

- Style rows choose the value editor from style metadata.
- Enum values use a select/combobox.
- Boolean values use a true/false select.
- Integer and number values use numeric inputs.
- Color values use a color picker.
- Text and list-like values remain editable as text.
- Applied rows continue to stay visible and editable in Inspect.

## Out Of Scope

- Full schema generation for every possible style key.
- Visual docs page changes; this is currently harness/editor behavior.
