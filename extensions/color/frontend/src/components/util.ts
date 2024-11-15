import { Ref, ref, watch } from "vue";

let id = 0;

export function generateAnchor() {
  return `--color-anchor-${id++}`;
}

export function getThemes(styleContent: Ref<string>) {
  const themes = ref<
    Array<{
      name: string;
      colors: Array<{
        name: string;
        value: string;
      }>;
    }>
  >([]);

  watch(
    () => styleContent.value.trim(),
    (str) => {
      const newThemes: Array<{
        name: string;
        colors: Array<{
          name: string;
          value: string;
        }>;
      }> = [];

      for (const match of str.matchAll(
        /^.*?\.theme--(.+?)\s*{\s*([\s\S]+?)\s*}/gm
      )) {
        const [_, theme, content] = match;
        const themeObj = {
          name: theme,
          colors: [] as Array<{ name: string; value: string }>,
        };

        str = str.substring(0, match[0].length);

        for (const line of content.split(/;\n?/g)) {
          let [key, value] = line.split(":").map((v) => v.trim());

          key = key.substring(8);
          value = value?.replace(/;+$/, "") ?? "";

          if (!key || !value) {
            continue;
          }

          themeObj.colors.push({ name: key, value });
        }

        newThemes.push(themeObj);
      }

      themes.value = newThemes;
    },
    { deep: true, immediate: true }
  );

  return themes;
}
