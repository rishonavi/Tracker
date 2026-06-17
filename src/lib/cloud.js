// Registry of configured cloud-backup providers, each with a uniform
// { id, label, backup(payload), restore() -> data|null } interface.
import { driveConfigured, backupToDrive, restoreFromDrive } from './gdrive'
import { dropboxConfigured, dropboxBackup, dropboxRestore } from './dropbox'
import { onedriveConfigured, onedriveBackup, onedriveRestore } from './onedrive'

export const cloudProviders = [
  driveConfigured && { id: 'gdrive', label: 'Google Drive', backup: backupToDrive, restore: restoreFromDrive },
  dropboxConfigured && { id: 'dropbox', label: 'Dropbox', backup: dropboxBackup, restore: dropboxRestore },
  onedriveConfigured && { id: 'onedrive', label: 'OneDrive', backup: onedriveBackup, restore: onedriveRestore },
].filter(Boolean)
