<template>
  <div ref="containerRef"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import React from 'react'
import { createRoot } from 'react-dom/client'

const props = defineProps<{
  component: React.ComponentType
}>()

const containerRef = ref<HTMLDivElement | null>(null)
let root: ReturnType<typeof createRoot> | null = null

onMounted(() => {
  if (containerRef.value) {
    root = createRoot(containerRef.value)
    root.render(React.createElement(props.component))
  }
})

watch(
  () => props.component,
  (newComponent) => {
    if (root) {
      root.render(React.createElement(newComponent))
    }
  }
)
</script>
