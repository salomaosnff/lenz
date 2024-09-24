import "./style.css";
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

export function FileGridView({
  entries,
  selection,
  path,
  onOpen,
  onSelect,
}: FileListViewProps) {
  return (
    <ul className="file-grid-view overflow-y-auto pa-2">
      {entries.map((item) => (
        <li key={item.path}>
          <div
            className={classNames(
              "text-center pa-2 cursor-pointer rounded-md hover:bg--surface-muted",
              {
                "bg--surface-muted": path === item.path,
                "!bg--primary": selection?.has(item.path),
              }
            )}
            onDoubleClick={() => onOpen?.(item)}
            onClick={() => onSelect?.(item)}
          >
            <EntryIcon entry={item} className="text-12" />
            <p className="flex-1 line-clamp-2">{item.name}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
