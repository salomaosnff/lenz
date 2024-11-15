import { Fragment, useEffect, useState } from "react";
import classNames from "classnames";
import { invoke } from "lenz:invoke";

import { FileListProps } from "./FileList";
import { Entry } from "../../types";
import { EntryIcon } from "../Entry/EntryIcon";

export function Locals(props: Omit<FileListProps, "onSelect" | "filter">) {
  const [entries, setEntries] = useState<{ title: string; items: Entry[] }[]>(
    []
  );

  useEffect(() => {
    Promise.all([invoke("folders.locals"), invoke("folders.disks")]).then(
      ([locals, disks]) => {
        if (!props.path) {
          props.onOpen?.(locals[0]);
        }
        setEntries([
          {
            title: "Locais",
            items: locals,
          },
          {
            title: "Discos",
            items: disks,
          },
        ]);
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ul className={props.className}>
      {entries.map((group, i, arr) => {
        return (
          <Fragment key={i}>
            <p className="fg--muted px-4 uppercase font-bold text-3 my-2">
              {group.title}
            </p>
            {group.items.map((item) => (
              <li
                className={classNames(
                  "flex gap-1 py-1 px-2 cursor-pointer rounded-md hover:bg--surface-muted mx-2 mb-1",
                  {
                    "bg--surface-muted": props.path === item.path,
                  }
                )}
                onClick={() => props.onOpen?.(item)}
                key={item.path}
              >
                <EntryIcon entry={item} className="text-6" />
                <p className="flex-1">{item.name}</p>
              </li>
            ))}
            {i < arr.length - 1 && <div className="separator"></div>}
          </Fragment>
        );
      })}
    </ul>
  );
}
