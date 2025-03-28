/**
 * React Native Email Link
 *
 * This file supports both iOS and Android.
 */

import { ActionSheetIOS, Linking } from 'react-native';

class EmailException {
  constructor(message) {
    this.message = message;
    this.name = 'EmailException';
  }
}

const prefixes = {
  'apple-mail': 'message://',
  gmail: 'googlegmail://',
  inbox: 'inbox-gmail://',
  spark: 'readdle-spark://',
  airmail: 'airmail://',
  outlook: 'ms-outlook://'
};

const titles = {
  'apple-mail': 'Mail',
  gmail: 'Gmail',
  inbox: 'Inbox',
  spark: 'Spark',
  airmail: 'Airmail',
  outlook: 'Outlook'
};

/**
 * Allowed params for each app url
 *  - apple-mail: https://ios.gadgethacks.com/news/always-updated-list-ios-app-url-scheme-names-0184033/
 *  - gmail: https://stackoverflow.com/questions/32114455/open-gmail-app-from-my-app 
 *  - inbox: https://stackoverflow.com/questions/29655978/is-there-an-ios-mail-scheme-url-for-googles-inbox
 *  - spark: https://helpspot.readdle.com/spark/index.php?pg=kb.page&id=791
 *  - airmail: https://help.airmailapp.com/en-us/article/airmail-ios-url-scheme-1q060gy/
 *  - outlook: https://stackoverflow.com/questions/32369198/i-just-want-to-open-ms-outlook-app-and-see-mailto-screen-using-url-scheme-at-ios
 */
const uriParams = {
  'apple-mail': {
    cc: 'cc',
    bcc: 'bcc',
    subject: 'subject',
    body: 'body'
  },
  gmail: {
    path: 'co',
    to: 'to',
    cc: 'cc',
    bcc: 'bcc',
    subject: 'subject',
    body: 'body'
  },
  inbox: {
    path: 'co',
    to: 'to',
    cc: 'cc',
    bcc: 'bcc',
    subject: 'subject',
    body: 'body'
  },
  spark: {
    path: 'compose',
    to: 'recipient',
    cc: 'cc',
    bcc: 'bcc',
    subject: 'subject',
    body: 'body'
  },
  airmail: {
    path: 'compose',
    to: 'to',
    cc: 'cc',
    bcc: 'bcc',
    subject: 'subject',
    body: 'htmlBody',
  },
  outlook: {
    path: 'compose',
    to: 'to',
    cc: 'cc',
    bcc: 'bcc',
    subject: 'subject',
    body: 'body'
  },

}

/**
 * Returns param to open app compose screen and pre-fill 'to', 'subject' and 'body',
 * @param {string} app
 * @param {{
 *     to: string,
 *     cc: string,
 *     bcc: string,
 *     subject: string,
 *     body: string,
 * }} options 
 */
function getUrlParams(app, options) {
  const appParms = uriParams[app];
  if (!appParms) { return '' };

  const path = app === 'apple-mail' ? (options['to'] || '') : appParms['path'];
  const urlParams = Object.keys(appParms).reduce((params, currentParam) => {
    if (options[currentParam]) {
      params.push(`${appParms[currentParam]}=${options[currentParam]}`);
    }
    return params;
  }, []);

  return `${path}?${urlParams.join('&')}`;
}

/**
 * Check if a given mail app is installed.
 *
 * @param {string} app
 * @returns {Promise<boolean>}
 */
export function isAppInstalled(app) {
  return new Promise(resolve => {
    if (!(app in prefixes)) {
      return resolve(false);
    }

    Linking.canOpenURL(prefixes[app])
      .then(isSupported => {
        resolve(isSupported);
      })
      .catch(() => resolve(false));
  });
}

/**
 * Ask the user to choose one of the available mail apps.
 * @param title
 * @param message
 * @param cancelLabel
 * @param removeText
 * @returns {Promise<String|null>}
 */
export function askAppChoice(
  title = 'Open mail app',
  message = 'Which app would you like to open?',
  cancelLabel = 'Cancel',
  removeText = false
) {
  return new Promise(async resolve => {
    let availableApps = [];
    for (let app in prefixes) {
      let avail = await isAppInstalled(app);
      if (avail) {
        availableApps.push(app);
      }
    }

    if (availableApps.length < 2) {
      return resolve(availableApps[0] || null);
    }

    let options = availableApps.map(app => titles[app]);
    options.push(cancelLabel);

    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: options,
        cancelButtonIndex: options.length - 1,
        ...(removeText ? {} : { title, message })
      },
      buttonIndex => {
        if (buttonIndex === options.length - 1) {
          return resolve(null);
        }
        return resolve(availableApps[buttonIndex]);
      }
    );

    return;
  });
}

/**
 * Returns the name of the app provided in the options object of the app selected by the user.
 * @param {{
 *     app: string | undefined | null,
 * }} options 
 */
async function getApp(options) {
  if (options && typeof options !== 'object') {
    throw new EmailException(
      'First parameter must be an object of options.'
    );
  }

  if (
    'app' in options &&
    options.app &&
    Object.keys(prefixes).indexOf(options.app) < 0
  ) {
    throw new EmailException(
      'Option `app` should be undefined, null, or one of the following: "' +
        Object.keys(prefixes).join('", "') +
        '".'
    );
  }

  let { app = null } = options;

  if (!app) {
    const { title, message, cancelLabel, removeText } = options;
    app = await askAppChoice(title, message, cancelLabel, removeText);
  }

  if (!app) {
    throw new EmailException('No email app found');
  }

  return app;
}

/**
 * Open an email app, or let the user choose what app to open.
 *
 * @param {{
  *     app: string | undefined | null,
  *     title: string,
  *     message: string,
  *     cancelLabel: string,
  *     removeText: boolean
  * }} options
  */
export async function openInbox(options) {
  const app = await getApp(options);
  return Linking.openURL(prefixes[app]);
}

/**
 * Open an email app on the compose screen, or let the user choose what app to open on the compose screen.
 *
 * @param {{
  *     app: string | undefined | null,
  *     title: string,
  *     message: string,
  *     cancelLabel: string,
  *     removeText: boolean,
  *     to: string,
  *     cc: string,
  *     bcc: string,
  *     subject: string,
  *     body: string
  * }} options
  */
export async function openComposer(options) {
  const app = await getApp(options);
  const params = getUrlParams(app, options);
  let prefix = prefixes[app];

  if (app === 'apple-mail') {
    // apple mail prefix to compose an email is mailto
    prefix = 'mailto:';
  }

  return Linking.openURL(`${prefix}${params}`);
}
