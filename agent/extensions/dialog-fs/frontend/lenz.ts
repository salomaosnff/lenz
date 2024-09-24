import type { Plugin } from "vite";

export function Lenz(): Plugin {
  let skip = false;
  let importMap = "";

  return {
    name: "lenz:icons",
    async config(_, env) {
      if (env.mode === "production") {
        skip = true;
        return {
          build: {
            rollupOptions: {
              external: (id) => id.startsWith("lenz:"),
            },
          },
        };
      }

      const imports: object = await fetch(
        "http://localhost:5369/importmap.json"
      ).then((res: any) => res.json());

      importMap = JSON.stringify({ imports });

      return {
        build: {
          rollupOptions: {
            external: (id) => id in imports,
          },
        },
      };
    },
    transformIndexHtml(html) {
      if (skip) {
        return html;
      }

      return {
        html,
        tags: [
          {
            tag: "style",
            injectTo: "head-prepend",
            children: `:root{--theme-surface-opacity: 25%;--color-surface-primary: oklch(from var(--color-primary) l c h / var(--theme-surface-opacity));--color-surface-danger: oklch(from var(--color-danger) l c h / var(--theme-surface-opacity));--color-surface-warning: oklch(from var(--color-warning) l c h / var(--theme-surface-opacity));--color-surface-info: oklch(from var(--color-info) l c h / var(--theme-surface-opacity));--color-surface-error: var(--color-surface-danger);--current-color: var(--color-primary);--current-surface-color: oklch(from var(--current-color) l c h / var(--theme-surface-opacity))}.theme--dark{--color-primary:#4A90E2;--color-surface-primary:oklch(from var(--color-primary) l c h / var(--theme-surface-opacity));--color-secondary:#BD10E0;--color-surface-secondary:oklch(from var(--color-secondary) l c h / var(--theme-surface-opacity));--color-background:#121212;--color-surface-background:oklch(from var(--color-background) l c h / var(--theme-surface-opacity));--color-foreground:#E0E0E0;--color-surface-foreground:oklch(from var(--color-foreground) l c h / var(--theme-surface-opacity));--color-surface:#1E1E1E;--color-surface-surface:oklch(from var(--color-surface) l c h / var(--theme-surface-opacity));--color-surface2:#333333;--color-surface-surface2:oklch(from var(--color-surface2) l c h / var(--theme-surface-opacity));--color-danger:#FF5C5C;--color-surface-danger:oklch(from var(--color-danger) l c h / var(--theme-surface-opacity));--color-warning:#FFA726;--color-surface-warning:oklch(from var(--color-warning) l c h / var(--theme-surface-opacity));--color-info:#4FC3F7;--color-surface-info:oklch(from var(--color-info) l c h / var(--theme-surface-opacity));--color-success:#66BB6A;--color-surface-success:oklch(from var(--color-success) l c h / var(--theme-surface-opacity));--color-muted:#757575;--color-surface-muted:oklch(from var(--color-muted) l c h / var(--theme-surface-opacity));color:var(--color-foreground);background-color:var(--color-background)}.theme--light{--color-primary:#4A90E2;--color-surface-primary:oklch(from var(--color-primary) l c h / var(--theme-surface-opacity));--color-secondary:#BD10E0;--color-surface-secondary:oklch(from var(--color-secondary) l c h / var(--theme-surface-opacity));--color-background:#F5F7FA;--color-surface-background:oklch(from var(--color-background) l c h / var(--theme-surface-opacity));--color-foreground:#000000;--color-surface-foreground:oklch(from var(--color-foreground) l c h / var(--theme-surface-opacity));--color-surface:#FFFFFF;--color-surface-surface:oklch(from var(--color-surface) l c h / var(--theme-surface-opacity));--color-surface2:#F2F2F2;--color-surface-surface2:oklch(from var(--color-surface2) l c h / var(--theme-surface-opacity));--color-danger:#D0021B;--color-surface-danger:oklch(from var(--color-danger) l c h / var(--theme-surface-opacity));--color-warning:#F8A532;--color-surface-warning:oklch(from var(--color-warning) l c h / var(--theme-surface-opacity));--color-info:#50E3C2;--color-surface-info:oklch(from var(--color-info) l c h / var(--theme-surface-opacity));--color-success:#7ED321;--color-surface-success:oklch(from var(--color-success) l c h / var(--theme-surface-opacity));--color-muted:#9B9B9B;--color-surface-muted:oklch(from var(--color-muted) l c h / var(--theme-surface-opacity));color:var(--color-foreground);background-color:var(--color-background)}`,
          },
          {
            tag: "script",
            attrs: {
              type: "importmap",
            },
            children: importMap,
          },
        ],
      };
    },
  };
}
