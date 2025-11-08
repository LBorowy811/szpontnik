<template>
  <div id="app">
    <UserMenuTop />
    <Sidebar />
    <div class="main-content">
	    <router-view />
    </div>
  </div>
</template>

<script setup>
import Sidebar from './compontents/Sidebar.vue';
import UserMenuTop from './compontents/UserMenuTop.vue';
</script>

<style>
body {
  margin: 0;
}

.main-content {
  position: absolute;
  top: 70px;
  left: 220px;
  right: 10px;
  bottom: 10px;
  padding: 0.5rem;
  background-color: var(--bg-color);
  border: 2px solid transparent;
  box-sizing: border-box;
  overflow: auto;
  transition: border 0.3s ease;
}

.main-content:hover {
  border: 2px solid white;
}
</style>
