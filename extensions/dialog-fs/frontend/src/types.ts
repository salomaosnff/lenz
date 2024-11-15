export type EntryType = 'folder' | 'disk' | 'file' | 'link'

export type EntryDisplay = 'file' | 'folder'| 'folder-home' | 'folder-downloads' | 'folder-documents' | 'folder-music' | 'folder-videos' | 'disk-partition' | 'folder-desktop' | 'folder-pictures'

export interface Entry {
    created_at: number
    display_as: EntryDisplay | null
    is_hidden: boolean
    kind: 'File' | 'Directory' | 'DiskPartition'
    modified_at: number
    name: string
    path: string
    size: number
}