<script setup lang="ts">
import { SettingsField } from "../components/AppSettingsForm/types";

const fields: SettingsField[] = [
  {
    name: "display",
    type: "select",
    options: [
      { label: "Flex", value: "flex" },
      { label: "Flex ", value: "inline-flex" },
    ],
  },
  {
    name: "direction",
    type: "select",
    options: [
      { label: "Row", value: "row" },
      { label: "Column", value: "column" },
    ],
  },
    {
        name: "justifyContent",
        type: "select",
        options: [
        { label: "Start", value: "flex-start" },
        { label: "Center", value: "center" },
        { label: "End", value: "flex-end" },
        { label: "Between", value: "space-between" },
        { label: "Around", value: "space-around" },
        ],
    },
    {
        name: "alignItems",
        type: "select",
        options: [
        { label: "Start", value: "flex-start" },
        { label: "Center", value: "center" },
        { label: "End", value: "flex-end" },
        { label: "Stretch", value: "stretch" },
        ],
    },
    {
        name: "gap",
        type: "number",
        label: "Gap",
        default: 0
    },
];
</script>
<template>
  <AppSettingsForm :fields />
</template>
