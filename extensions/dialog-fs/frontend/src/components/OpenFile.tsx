import { Icon } from "./icons";
import { useMemo, useState } from "react";
import { Entry } from "../types";

import iconfolderUp from "lenz:icons/chevron_left";
import iconGrid from "lenz:icons/view_grid";
import iconList from "lenz:icons/view_list";

import { BreadCrumb } from "./BreadCrumb/bread-crumb";
import { FileList } from "./FileList/FileList";
import { Locals } from "./FileList/Locals";
import { Ref } from "lenz:reactivity";

export interface AppData {
  result: Ref<string | null>;
  filters: Record<string, string>;
}

export default function App(props: { getData: () => AppData; save?: boolean }) {
  const { result, filters = {} } = props.getData();
  const isMultiple = false;
  const [isGrid, setIsGrid] = useState(true);
  const [currentPath, setCurrentPath] = useState<string>();
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<string>(
    (Object.values(filters)[0] ?? "*") as string
  );
  const [filename, setFilename] = useState<string>();
  const [sortBy] = useState([
    {
      key: "kind",
      asc: true,
    },
    {
      key: "name",
      asc: true,
    },
  ]);

  function select(entry: Entry) {
    setSelection((prev) => {
      if (!isMultiple) {
        prev.clear();
      }

      prev.add(entry.path);

      return new Set(prev);
    });
  }

  function goToParent() {
    return setCurrentPath((prev) => {
      return prev?.replace(/\/[^/]*\/*$/, "") || "/";
    });
  }

  const breadCrumbItems = useMemo(() => {
    const path = currentPath || "/";

    return path.split("/").map((item, i, arr) => {
      return {
        name: item,
        path: arr.slice(0, i + 1).join("/"),
      };
    });
  }, [currentPath]);

  function onOpen(entry: Entry) {
    if (entry.kind === "Directory" || entry.kind === "DiskPartition") {
      setCurrentPath(entry.path);
    }
  }

  function onSelect(entry: Entry) {
    if (entry.kind === "File") {
      if (props.save) {
        const parts = entry.path.split("/");
        setFilename(parts.pop());

        select({
          ...entry,
          path: parts.join("/"),
        });
      } else {
        select(entry);
      }
    } else if (entry.kind === "Directory") {
      setSelection(new Set());
      onOpen(entry);
    }
  }

  function onConfirm() {
    if (props.save) {
      if (filename) {
        result.value = `${currentPath}/${filename}`;
      }
    }
    if (selection.size === 1) {
      result.value = selection.values().next()?.value ?? null;
    } else {
      result.value = Array.from(selection);
    }
  }

  return (
    <div className="flex flex-col w-full h-full select-none overflow-hidden">
      <div className="flex overflow-hidden flex-1 overflow-hidden">
        <Locals
          className="bg--surface w-60 py-2 overflow-hidden"
          path={currentPath}
          onOpen={onOpen}
        />

        <div className="flex-1 flex flex-col bg--background overflow-hidden">
          <div className="flex px-4 py-3 items-center gap-2">
            <Icon
              className="text-6 cursor-pointer"
              path={iconfolderUp}
              onClick={goToParent}
            />
            <BreadCrumb
              className="flex-1"
              path={breadCrumbItems}
              onSelect={setCurrentPath}
            />
            <Icon
              path={isGrid ? iconGrid : iconList}
              onClick={() => setIsGrid((prev) => !prev)}
              className="text-5 cursor-pointer"
              title={isGrid ? "Ver como lista" : "Ver como grade"}
            />
          </div>

          <div className="separator !mt-0"></div>
          <FileList
            path={currentPath}
            onOpen={onOpen}
            selection={selection}
            onSelect={onSelect}
            sortBy={sortBy}
            gridView={isGrid}
            filter={filter ?? []}
          />
        </div>
      </div>

      <div className="bg--surface flex justify-end">
        <div className="footer flex justify-end gap-2 pa-2 overflow-hidden">
          {props.save && (
            <input
              className="bg-transparent pl-2 pr-2  h-full flex-1"
              placeholder="Nome do Arquivo"
              autoFocus
              value={filename}
              onChange={(e) => setFilename(e.currentTarget.value)}
            />
          )}
          <label className="inline-flex pr-2 bg--surface-muted cursor-pointer">
            <select
              value={filter}
              className="bg-transparent pl-2 pr-2 cursor-pointer h-full"
              onChange={(e) => setFilter(e.currentTarget.value)}
            >
              {Object.entries<string>(filters).map(([label, value]) => (
                <option key={label} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <button
            className="btn bg--surface-muted rounded-md"
            onClick={() => (result.value = null)}
          >
            Cancelar
          </button>
          <button
            className="btn bg--primary rounded-md"
            onClick={onConfirm}
            disabled={!selection.size}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}