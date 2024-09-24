import classNames from "classnames";
import "./style.css";
import { createRef, useEffect } from "react";

export interface BreadCrumbItem {
  path: string;
  name: string;
}

export interface BreadCrumbProps {
  path: BreadCrumbItem[];
  className?: string;
  onSelect?(path: string): void;
}

export function BreadCrumb(props: BreadCrumbProps) {
  const { path, onSelect } = props;

  const elementRef = createRef<HTMLUListElement>();

  useEffect(() => {
    elementRef.current?.scrollTo({
      left: elementRef.current?.scrollWidth,
      behavior: "smooth",
    });
  }, [path, elementRef]);

  return (
    <ul className={classNames("breadcrumb flex overflow-x-hidden", props.className)} ref={elementRef}>
      {path.map((item) => {
        return (
          <li
            className="flex cursor-pointer"
            key={item.path}
            onClick={() => onSelect?.(item.path)}
          >
            <p className="w-full truncate">{item.name}</p>
          </li>
        );
      })}
    </ul>
  );
}
