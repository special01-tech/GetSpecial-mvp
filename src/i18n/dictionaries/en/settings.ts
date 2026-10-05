/* =============================================================================
 * i18n — English dictionary: settings & misc (settings, more)
 * (Filled in when migrating settings / more)
 * ============================================================================= */

export const settings = {
  pauseOn: 'Emergency Pause active. All publications are suspended.',
  pauseOff:
    'Automation active. GetSpecial monitors your signals and prepares your posts.',
  header: {
    title: 'Settings & Security',
    subtitle:
      'Manage your connected channels, publishing limits, and the security of {name}.',
  },
  emergency: {
    title: 'Emergency Breaker (Emergency Pause)',
    paused: 'Publications fully suspended',
    normal: 'Normal mode active',
    description:
      'In case of an unexpected rush or temporary closure, suspend all publications with a single tap.',
    resume: 'Resume the assistant',
    pause: 'Pause',
  },
  channels: {
    title: 'Connected Publishing Channels',
    tiktokDescription: 'Connected via unified Zernio gateway',
    connected: 'Connected',
    instagramDescription: 'Ready for direct linking or guided publishing',
    ready: 'Ready',
    facebookGoogleDescription: 'Local listing synchronization',
    optional: 'Optional linking',
  },
  frequency: {
    title: 'Anti-Fatigue & Frequency Rules',
    capLabel: 'Daily publishing cap',
    capDescription:
      'Limits the number of automatic posts per day so you never tire your audience.',
    onePerDay: '1 post per day (Recommended)',
    twoPerDay: '2 posts per day max',
    validationLabel: 'Mandatory manager approval',
    validationDescription:
      'Nothing is published without your explicit approval on the Today screen.',
    strictlyActive: 'Strictly active',
  },
  session: {
    label: 'User session',
    description: 'Disconnect the current device from your GetSpecial account.',
    logout: 'Log out',
  },
  language: {
    title: 'Interface language',
    description: 'Choose the GetSpecial display language.',
  },
};
