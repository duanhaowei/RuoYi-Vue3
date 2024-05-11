<template>
  <div>
    <svg-icon icon-class="question" @click="goto" />
  </div>
</template>

<script setup>
const url = ref('http://doc.howard.vip/howard-vue');

function goto() {
  window.open(url.value)
}
</script>