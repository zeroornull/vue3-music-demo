import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { setApiBaseUrl } from '@/api/http'
import { clearStoredApiHost, readApiHost, saveApiHost } from '@/config/apiHost'

export const useHostStore = defineStore('host', () => {
  const apiHost = ref(readApiHost())
  const isConfigured = computed(() => Boolean(apiHost.value))

  setApiBaseUrl(apiHost.value)

  function setHost(input: string) {
    const host = saveApiHost(input)
    apiHost.value = host
    setApiBaseUrl(host)
    return host
  }

  function clearHost() {
    clearStoredApiHost()
    apiHost.value = ''
    setApiBaseUrl('')
  }

  return { apiHost, clearHost, isConfigured, setHost }
})
