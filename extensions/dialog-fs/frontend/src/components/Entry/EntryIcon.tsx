
import iconFolderHome from 'lenz:icons/folder_home'
import iconFolderDesktop from 'lenz:icons/monitor'
import iconFolderVideo from 'lenz:icons/folder_play'
import iconFolderDownload from 'lenz:icons/folder_download'
import iconFolderFile from 'lenz:icons/folder_file'
import iconFolderImage from 'lenz:icons/folder_image'
import iconFolderMusic from 'lenz:icons/folder_music'
import iconFolder from 'lenz:icons/folder'
import iconHarddisk from 'lenz:icons/harddisk'
import iconFileOutline from 'lenz:icons/file_outline'
import iconFileMusic from 'lenz:icons/file_music'
import iconFileVideo from 'lenz:icons/file_video'
import iconFileImage from 'lenz:icons/file_image'
import iconArchive from 'lenz:icons/zip_box';
import iconHtml from 'lenz:icons/language_html5';
import iconCss from 'lenz:icons/language_css3';
import iconJs from 'lenz:icons/language_javascript';
import iconJson from 'lenz:icons/code_json';
import iconPdf from 'lenz:icons/file_pdf_box';
import { Icon } from '../icons'
import { Entry } from '../../types'

const iconMap = {
    folder: iconFolder,
    file: iconFileOutline,
    "folder-home": iconFolderHome,
    "folder-desktop": iconFolderDesktop,
    "folder-documents": iconFolderFile,
    "folder-downloads": iconFolderDownload,
    "folder-pictures": iconFolderImage,
    "folder-music": iconFolderMusic,
    "folder-videos": iconFolderVideo,
    "disk-partition": iconHarddisk,
    "file-audio": iconFileMusic,
    "file-video": iconFileVideo,
    "file-image": iconFileImage,
}

function getEntryIconByExtension(name: string): string {
    const ext = name.match(/\.([^.]+)$/)?.[1].toLowerCase()

    if (!ext) {
        return iconFileOutline
    }

    return {
        'mp3': iconFileMusic,
        'mp4': iconFileVideo,
        'jpg': iconFileImage,
        'jpeg': iconFileImage,
        'png': iconFileImage,
        'gif': iconFileImage,
        'zip': iconArchive,
        'rar': iconArchive,
        '7z': iconArchive,
        'tar': iconArchive,
        'gz': iconArchive,
        'html': iconHtml,
        'htm': iconHtml,
        'css': iconCss,
        'js': iconJs,
        'json': iconJson,
        'pdf': iconPdf,
    }[ext] || iconFileOutline
}

function getEntryIcon(item: Entry): string {
    if (item.display_as) {
        return iconMap[item.display_as]
    }

    if (item.kind === 'Directory') {
        return iconMap.folder
    }

    if (item.kind === 'DiskPartition') {
        return iconHarddisk
    }

    return getEntryIconByExtension(item.name)
}

export function EntryIcon(props: { entry: Entry, className?: string }) {
    return <Icon className={props.className} path={getEntryIcon(props.entry)} />
}