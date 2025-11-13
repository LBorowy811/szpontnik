<template>
    <div class="piece" :class="color"></div>
</template>

<script setup>
const props = defineProps({
    color: { type: String, required: true}
})

</script>

<style scoped>
.piece{
    width: 80%;
    height: 80%;
    border-radius: 50%;
    margin: auto;
    box-shadow: 0 2px 5px;
}
.white{
    background-color: white;
}
.black{
    background-color: black;
}

</style>