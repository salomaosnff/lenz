import classNames from "classnames";
import { Entry } from "../../types";
import { EntryIcon } from "../Entry/EntryIcon";

export interface FileListViewProps {
  entries: Entry[];
  path?: string;
  selection?: Set<string>;
  onOpen?(entry: Entry): void;
  onSelect?(entry: Entry): void;
}

export function FileListView({
  entries,
  selection,
  path,
  onOpen,
  onSelect,
}: FileListViewProps) {
  return (
    <ul className="overflow-y-auto pa-2">
      {entries.map((item) => (
        <li
          className={classNames(
            "line-clamp-1 flex items-center gap-1 py-1 px-2 cursor-pointer rounded-md hover:bg--surface-muted",
            {
              "bg--surface-muted": path === item.path,
              "!bg--primary": selection?.has(item.path),
            }
          )}
          key={item.path}
          onDoubleClick={() => onOpen?.(item)}
          onClick={() => onSelect?.(item)}
        >
          <EntryIcon entry={item} className="text-6" />
          <p className="truncate flex-1">{item.name}</p>
        </li>
      ))}
    </ul>
  );
}
