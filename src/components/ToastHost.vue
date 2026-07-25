<script setup lang="ts">
/* Host do toast (index.html #toast 191-192 + toast() 589-590). */
import { toastMsg, toastShown } from '@/lib/toast'
</script>

<template>
  <div id="toast" :class="{ show: toastShown }">{{ toastMsg }}</div>
</template>
