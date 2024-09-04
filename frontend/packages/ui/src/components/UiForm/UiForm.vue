<script setup lang="ts" generic="S extends z.ZodType">
import { z } from 'zod';
import { provideForm } from '../../composable/useForm';

const props = defineProps<{
    schema: S,
    validateOnMount?: boolean,
    onSubmit?(value: z.output<S>): Promise<any>
    onValid?(value: z.output<S>): void
}>()

const modelValue = defineModel<z.infer<S> | z.input<S>>()
const validModelValue = defineModel<z.infer<S>>('validValues')

const form = provideForm({
    schema: () => props.schema,
    modelValue: modelValue,
    onSubmit: async values => props.onSubmit?.(values),
    validateOnMount: props.validateOnMount,
    onValid(values) {
        validModelValue.value = values
        props.onValid?.(values)
    },
})
</script>

<template>
    <form @submit.prevent="form.submit" @reset.prevent="form.reset">
        <pre>{{ form.values.value }}</pre>
        <slot :form="form"></slot>
    </form>
</template>