import { DirectoryStudioHost } from 'topoviewer-studio/directory-host';
import {
  DesktopDirectoryPort,
  type DesktopNativeClient,
  type NativeProjectReference
} from './desktopDirectoryPort';

export interface DesktopStudioHostOptions {
  client: DesktopNativeClient;
  mapperPath?: string;
  project: NativeProjectReference;
  stylesheetPath?: string;
  topologyPath?: string;
}

export class DesktopStudioHost extends DirectoryStudioHost {
  constructor(options: DesktopStudioHostOptions) {
    super({
      displayName: 'Desktop directory',
      hostKind: 'desktop',
      mapperPath: options.mapperPath,
      port: new DesktopDirectoryPort({
        client: options.client,
        project: options.project
      }),
      stylesheetPath: options.stylesheetPath || 'stylesheet.yaml',
      topologyPath: options.topologyPath || 'topology.yaml'
    });
  }
}
