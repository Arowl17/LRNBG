// English UI strings. Every key here must also exist in tr.ts (TypeScript and a test enforce it).
// Placeholders use {name} syntax and must match between languages.
export const en = {
  'app.name': 'Shtarkel',
  'app.tagline': 'Learn Bulgarian, one short lesson at a time.',

  'nav.main': 'Main navigation',
  'nav.path': 'Learn',
  'nav.practice': 'Practice',
  'nav.words': 'Words',
  'nav.grammar': 'Grammar',
  'nav.profile': 'Profile',
  'nav.settings': 'Settings',

  'path.title': 'Your course',
  'path.empty': 'No units yet. The Cyrillic alphabet section arrives in the next phase.',
  'path.loadError': 'The course could not be loaded. Try reloading the page.',
  'path.unitCount': '{count} units',

  'practice.title': 'Practice',
  'practice.empty': 'Nothing to review yet. Finish a lesson first.',

  'words.title': 'Words',
  'words.empty': 'Words you learn will appear here.',

  'grammar.title': 'Grammar tips',
  'grammar.empty': 'Grammar tips will appear here as you unlock them.',

  'profile.title': 'Profile',
  'profile.xp': 'Total XP',
  'profile.streak': 'Day streak',
  'profile.since': 'Learning since {date}',
  'profile.empty': 'Stats will appear here once you start learning.',

  'settings.title': 'Settings',
  'settings.section.general': 'General',
  'settings.section.display': 'Display & sound',
  'settings.language': 'Language',
  'settings.language.help': 'Language for menus and translations.',
  'settings.language.en': 'English',
  'settings.language.tr': 'Türkçe',
  'settings.theme': 'Appearance',
  'settings.theme.system': 'Match device',
  'settings.theme.light': 'Light',
  'settings.theme.dark': 'Dark',
  'settings.dailyGoal': 'Daily goal',
  'settings.dailyGoal.casual': 'Casual (10 XP)',
  'settings.dailyGoal.regular': 'Regular (20 XP)',
  'settings.dailyGoal.serious': 'Serious (50 XP)',
  'settings.stress': 'Show stress marks',
  'settings.stress.always': 'Always',
  'settings.stress.new': 'New words only',
  'settings.stress.never': 'Never',
  'settings.sounds': 'Sound effects',
  'settings.haptics': 'Vibration',
  'settings.hearts': 'Hearts (lose a heart per mistake)',
  'settings.hearts.help': 'Off by default: mistakes are repeated at the end of the lesson instead.',
  'settings.data': 'Your progress',
  'settings.data.help':
    'Progress is stored only on this device. Export a backup regularly so you never lose it.',
  'settings.export': 'Export progress',
  'settings.import': 'Import progress',
  'settings.import.confirm':
    'Importing replaces all progress on this device with the backup. Continue?',
  'settings.import.success': 'Backup imported.',
  'settings.import.error': 'This file is not a valid Shtarkel backup.',
  'settings.export.success': 'Backup saved as {file}.',
  'settings.reset': 'Reset all progress',
  'settings.reset.confirm':
    'This permanently deletes all progress on this device. Export a backup first if unsure. Continue?',
  'settings.reset.success': 'All progress was reset.',

  'update.available': 'A new version is available.',
  'update.reload': 'Update',
  'update.dismiss': 'Later',
  'offline.ready': 'Ready to work offline.',

  'common.on': 'On',
  'common.off': 'Off',
  'common.close': 'Close',
  'common.loading': 'Loading…',

  'notFound.title': 'Page not found',
  'notFound.back': 'Back to the course',
} as const;

export type MessageKey = keyof typeof en;
