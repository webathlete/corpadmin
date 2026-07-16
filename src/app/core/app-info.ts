import { isDevMode } from '@angular/core';
import { AppInfo, DEFAULT_APP_INFO } from '../layout/layout.config';
import { BUILD_INFO } from './version';

// Real application "About" metadata, assembled from the build-time
// BUILD_INFO (see scripts/generate-version.mjs) plus the runtime
// environment. Bound to <app-info-drawer [info]="appInfo">.

const buildDate = new Date(BUILD_INFO.buildDate);
const formattedBuildDate = isNaN(buildDate.getTime())
  ? BUILD_INFO.buildDate
  : buildDate.toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

export const APP_INFO: AppInfo = {
  ...DEFAULT_APP_INFO,
  version: BUILD_INFO.version,
  channel: isDevMode() ? 'Dev build' : 'Stable',
  rows: [
    { label: 'Version',          value: BUILD_INFO.version,                          icon: 'sell' },
    { label: 'Build',            value: BUILD_INFO.buildNumber,                      icon: 'tag' },
    { label: 'Build date',       value: formattedBuildDate,                          icon: 'event' },
    { label: 'Environment',      value: isDevMode() ? 'Development' : 'Production',  icon: 'dns' },
    { label: 'Angular',          value: BUILD_INFO.angular,                          icon: 'code' },
    { label: 'Angular Material', value: BUILD_INFO.material,                         icon: 'widgets' },
    { label: 'Commit',           value: BUILD_INFO.commit,                           icon: 'commit' },
    { label: 'Branch',           value: BUILD_INFO.branch,                           icon: 'account_tree' },
  ],
};
