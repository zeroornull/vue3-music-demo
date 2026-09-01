<template>
  <main class="not-found">
    <p>404</p>
    <h1>页面不存在</h1>
    <RouterLink to="/">返回推荐页</RouterLink>
  </main>
</template>

<style scoped>
.not-found {
  display: grid;
  min-height: 100vh;
  align-content: center;
  justify-items: center;
  padding: 24px;
  color: var(--color-text);
  text-align: center;
}

p {
  margin: 0;
  color: var(--color-accent);
  font-size: 5rem;
  font-weight: 800;
}

h1 {
  margin: 0 0 24px;
}

a {
  color: var(--color-accent);
}
</style>
