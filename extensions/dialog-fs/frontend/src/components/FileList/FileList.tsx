import { useEffect, useMemo, useState } from "react";
import { invoke } from "lenz:invoke";

import { Entry } from "../../types";
import { FileListView } from "./FileListView";
import { FileGridView } from "../FileGridView/FileGridView";

export interface FileListProps {
  path?: string;
  selection?: Set<string>;
  filter: string | string[];
  className?: string;
  sortBy?: { key: string; asc: boolean }[];
  gridView?: boolean;

  onOpen?(entry: Entry): void;
  onSelect?(entry: Entry): void;
}

export function FileList(props: FileListProps) {
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    if (!props.path) {
      return setEntries([]);
    }

    invoke("folders.list", {
      dir: props.path,
      filter: [].concat(props.filter ?? []),
      sort_by: props.sortBy?.map(({ key, asc }) =>
        JSON.stringify([key, asc ?? true])
      ),
    }).then((entries: Entry[]) => {
      setEntries(entries);
    });
  }, [props.path, props.filter, props.sortBy]);

  const viewProps = useMemo(() => ({ entries, ...props }), [entries, props]);

  return props.gridView ? <FileGridView {...viewProps} /> : <FileListView {...viewProps} />;
}
