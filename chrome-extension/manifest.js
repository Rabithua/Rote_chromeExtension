import fs from 'node:fs';

const packageJson = JSON.parse(fs.readFileSync('../package.json', 'utf8'));

const isFirefox = process.env.__FIREFOX__ === 'true';
/**
 * After changing, please reload the extension at `chrome://extensions`
 * @type {chrome.runtime.ManifestV3}
 */
const sidePanelConfig = {
  side_panel: {
    default_path: 'sidepanel/index.html',
  },
  permissions: !isFirefox ? ['sidePanel'] : [],
};

const manifest = Object.assign(
  {
    manifest_version: 3,
    default_locale: 'en',
    /**
     * if you want to support multiple languages, you can use the following reference
     * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Internationalization
     */
    name: 'Rote',
    version: packageJson.version,
    description: 'Rote is a simple and easy-to-use note app.',
    permissions: ['storage', "contextMenus"].concat(sidePanelConfig.permissions),
    options_page: 'options/index.html',
    background: {
      service_worker: 'background.iife.js',
      type: 'module',
    },
    action: {
      default_popup: 'popup/index.html',
      default_icon: 'LOGO-34.png',
    },
    chrome_url_overrides: {
      newtab: 'newtab/index.html',
    },
    icons: {
      128: 'LOGO-128.png',
    },
    content_scripts: [
      // {
      //   matches: ['http://*/*', 'https://*/*', '<all_urls>'],
      //   js: ['content/index.iife.js'],
      // },
      // {
      //   matches: ['http://*/*', 'https://*/*', '<all_urls>'],
      //   js: ['content-ui/index.iife.js'],
      // },
      // {
      //   matches: ['http://*/*', 'https://*/*', '<all_urls>'],
      //   css: ['content.css'], // public folder
      // },
    ],
    devtools_page: 'devtools/index.html',
    web_accessible_resources: [
      {
        resources: ['*.js', '*.css', '*.svg', 'LOGO-128.png', 'LOGO-34.png'],
        matches: ['*://*/*'],
      },
    ],
  },
  !isFirefox && { side_panel: { ...sidePanelConfig.side_panel } },
);

export default manifest;
