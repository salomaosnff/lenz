export interface IconProps {
  path: string;
  [key: string]: unknown;
}

export function Icon({ path, ...props }: IconProps) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ display: "inline-block", width: "1em", height: "1em" }}
    >
      <path d={path}></path>
    </svg>
  );
}
