## Design

### Template And Workspace Model

Browser harness fixtures are source templates loaded from `/fixtures`.
User changes are saved as browser-local workspace state:

- template edits persist under a key scoped to the template fixture ID;
- custom topologies are tracked in a browser-local fixture index;
- the last active template or saved topology is restored after browser refresh.

### Controls

The browser harness exposes template/workspace controls beside the template
selector:

- `New topology` creates a blank custom topology with a default layer;
- `Save` explicitly saves the current topology and stylesheet YAML;
- `Revert template` clears saved edits for template fixtures and reloads the
  original fixture files;
- `Remove saved` deletes a custom topology and returns to the default template.

Automatic save remains in place so refresh persistence is reliable even if the
user does not click `Save` before reloading. The explicit Save control provides
clear user intent and feedback.

### YAML Copy

The Monaco editor gets a top-right transparent icon button. It copies the active
editor value, using `navigator.clipboard.writeText` when allowed and falling
back to a temporary textarea when browser permissions reject clipboard writes.

### Boundaries

This is browser-harness behavior. The VS Code extension host does not gain a
browser-local storage model; its persistence should remain tied to VS Code file
contents and webview state.
