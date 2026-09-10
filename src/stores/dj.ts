import { ref } from 'vue'
import { defineStore } from 'pinia'

import {
  DJ_RADIO_PAGE_SIZE,
  DJ_RADIO_PROGRAM_PAGE_SIZE,
  getDjBanners,
  getDjCategories,
  getDjProgramDetail,
  getDjRadioDetail,
  getDjRadioPrograms,
  getDjProgramToplist,
  getDjRadioToplist,
  getDjRecommendRadios,
  getDjRecommendPrograms,
  getDjHotRadios,
  getDjRecommendByType,
  getDjCategoryRecommend,
  getDjTodayPrograms,
  getDjProgramHoursToplist,
  getDjRadioHoursToplist,
  getHotDjRadios,
  getPersonalizedDjPrograms,
} from '@/api/dj'
import {
  COMMENT_LIMIT,
  getDjCommentPage,
  getDjRadioCommentPage,
} from '@/api/comment'
import { getErrorMessage } from '@/api/http'
import type { MediaComment } from '@/models/comment'
import type {
  DjBanner,
  DjCategory,
  DjProgram,
  DjProgramDetail,
  DjRadioDetail,
  HallRadio,
} from '@/models/dj'

let requestSerial = 0
let commentsMoreSerial = 0
let listSerial = 0
let toplistSerial = 0
let bannerSerial = 0
let categorySerial = 0
let radioSerial = 0
let radioToplistSerial = 0
let recommendRadioSerial = 0
let todayProgramSerial = 0
let programHoursSerial = 0
let radioHoursSerial = 0
let recommendProgramSerial = 0
let hotRadioSerial = 0
let typeRecommendSerial = 0
let categoryRecommendSerial = 0
let radioDetailSerial = 0
let radioProgramSerial = 0
let radioCommentsMoreSerial = 0

export const useDjStore = defineStore('dj', () => {
  const program = ref<DjProgramDetail | null>(null)
  const error = ref<string | null>(null)
  const loading = ref(false)
  const loadedId = ref<number | null>(null)
  const programs = ref<DjProgram[]>([])
  const programsError = ref<string | null>(null)
  const programsLoading = ref(false)
  const toplistPrograms = ref<DjProgram[]>([])
  const toplistError = ref<string | null>(null)
  const toplistLoading = ref(false)
  const banners = ref<DjBanner[]>([])
  const bannersError = ref<string | null>(null)
  const bannersLoading = ref(false)
  const categories = ref<DjCategory[]>([])
  const categoriesError = ref<string | null>(null)
  const categoriesLoading = ref(false)
  const cateId = ref(0)
  const radios = ref<HallRadio[]>([])
  const radiosError = ref<string | null>(null)
  const radiosLoading = ref(false)
  const radiosMore = ref(false)
  const radioToplist = ref<HallRadio[]>([])
  const radioToplistError = ref<string | null>(null)
  const radioToplistLoading = ref(false)
  const recommendRadios = ref<HallRadio[]>([])
  const recommendRadiosError = ref<string | null>(null)
  const recommendRadiosLoading = ref(false)
  const todayPrograms = ref<DjProgram[]>([])
  const todayProgramsError = ref<string | null>(null)
  const todayProgramsLoading = ref(false)
  const programHours = ref<DjProgram[]>([])
  const programHoursError = ref<string | null>(null)
  const programHoursLoading = ref(false)
  const radioHours = ref<HallRadio[]>([])
  const radioHoursError = ref<string | null>(null)
  const radioHoursLoading = ref(false)
  const recommendPrograms = ref<DjProgram[]>([])
  const recommendProgramsError = ref<string | null>(null)
  const recommendProgramsLoading = ref(false)
  const hotRadios = ref<HallRadio[]>([])
  const hotRadiosError = ref<string | null>(null)
  const hotRadiosLoading = ref(false)
  const typeRecommendRadios = ref<HallRadio[]>([])
  const typeRecommendRadiosError = ref<string | null>(null)
  const typeRecommendRadiosLoading = ref(false)
  const typeRecommendLoadedId = ref<number | null>(null)
  const categoryRecommendRadios = ref<HallRadio[]>([])
  const categoryRecommendRadiosError = ref<string | null>(null)
  const categoryRecommendRadiosLoading = ref(false)
  const radio = ref<DjRadioDetail | null>(null)
  const radioError = ref<string | null>(null)
  const radioLoading = ref(false)
  const radioLoadedId = ref<number | null>(null)
  const radioPrograms = ref<DjProgram[]>([])
  const radioProgramsError = ref<string | null>(null)
  const radioProgramsLoading = ref(false)
  const radioProgramsMore = ref(false)
  const relatedRadios = ref<HallRadio[] | null>(null)
  const relatedPrograms = ref<DjProgram[] | null>(null)
  const comments = ref<MediaComment[] | null>(null)
  const commentsMore = ref(false)
  const commentsMoreLoading = ref(false)
  const commentsMoreError = ref<string | null>(null)
  const commentOffset = ref(0)
  const radioComments = ref<MediaComment[] | null>(null)
  const radioCommentsMore = ref(false)
  const radioCommentsMoreLoading = ref(false)
  const radioCommentsMoreError = ref<string | null>(null)
  const radioCommentOffset = ref(0)

  function resetDetail() {
    requestSerial++
    commentsMoreSerial++
    program.value = null
    relatedPrograms.value = null
    comments.value = null
    commentsMore.value = false
    commentsMoreLoading.value = false
    commentsMoreError.value = null
    commentOffset.value = 0
    error.value = null
    loading.value = false
    loadedId.value = null
  }

  function resetRadio() {
    radioDetailSerial++
    radioProgramSerial++
    radioCommentsMoreSerial++
    radio.value = null
    radioError.value = null
    radioLoading.value = false
    radioLoadedId.value = null
    radioPrograms.value = []
    radioProgramsError.value = null
    radioProgramsLoading.value = false
    radioProgramsMore.value = false
    relatedRadios.value = null
    radioComments.value = null
    radioCommentsMore.value = false
    radioCommentsMoreLoading.value = false
    radioCommentsMoreError.value = null
    radioCommentOffset.value = 0
  }

  function reset() {
    resetDetail()
    resetRadio()
    listSerial++
    toplistSerial++
    bannerSerial++
    categorySerial++
    radioSerial++
    radioToplistSerial++
    recommendRadioSerial++
    todayProgramSerial++
    programHoursSerial++
    radioHoursSerial++
    recommendProgramSerial++
    hotRadioSerial++
    typeRecommendSerial++
    categoryRecommendSerial++
    programs.value = []
    programsError.value = null
    programsLoading.value = false
    toplistPrograms.value = []
    toplistError.value = null
    toplistLoading.value = false
    banners.value = []
    bannersError.value = null
    bannersLoading.value = false
    categories.value = []
    categoriesError.value = null
    categoriesLoading.value = false
    cateId.value = 0
    radios.value = []
    radiosError.value = null
    radiosLoading.value = false
    radiosMore.value = false
    radioToplist.value = []
    radioToplistError.value = null
    radioToplistLoading.value = false
    recommendRadios.value = []
    recommendRadiosError.value = null
    recommendRadiosLoading.value = false
    todayPrograms.value = []
    todayProgramsError.value = null
    todayProgramsLoading.value = false
    programHours.value = []
    programHoursError.value = null
    programHoursLoading.value = false
    radioHours.value = []
    radioHoursError.value = null
    radioHoursLoading.value = false
    recommendPrograms.value = []
    recommendProgramsError.value = null
    recommendProgramsLoading.value = false
    hotRadios.value = []
    hotRadiosError.value = null
    hotRadiosLoading.value = false
    typeRecommendRadios.value = []
    typeRecommendRadiosError.value = null
    typeRecommendRadiosLoading.value = false
    typeRecommendLoadedId.value = null
    categoryRecommendRadios.value = []
    categoryRecommendRadiosError.value = null
    categoryRecommendRadiosLoading.value = false
  }

  async function loadBanners(force = false) {
    if (banners.value.length && !force && !bannersError.value) {
      return
    }

    const serial = ++bannerSerial
    bannersLoading.value = true
    bannersError.value = null
    try {
      const next = await getDjBanners()
      if (serial !== bannerSerial) return
      banners.value = next
    } catch (requestError) {
      if (serial !== bannerSerial) return
      bannersError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === bannerSerial) bannersLoading.value = false
    }
  }

  async function loadPrograms(force = false) {
    if (programs.value.length && !force && !programsError.value) {
      return
    }

    const serial = ++listSerial
    programsLoading.value = true
    programsError.value = null
    try {
      const next = await getPersonalizedDjPrograms()
      if (serial !== listSerial) return
      programs.value = next
    } catch (requestError) {
      if (serial !== listSerial) return
      programsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === listSerial) programsLoading.value = false
    }
  }

  async function loadToplist(force = false) {
    if (toplistPrograms.value.length && !force && !toplistError.value) {
      return
    }

    const serial = ++toplistSerial
    toplistLoading.value = true
    toplistError.value = null
    try {
      const next = await getDjProgramToplist()
      if (serial !== toplistSerial) return
      toplistPrograms.value = next
    } catch (requestError) {
      if (serial !== toplistSerial) return
      toplistError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === toplistSerial) toplistLoading.value = false
    }
  }

  async function loadRadioToplist(force = false) {
    if (radioToplist.value.length && !force && !radioToplistError.value) {
      return
    }

    const serial = ++radioToplistSerial
    radioToplistLoading.value = true
    radioToplistError.value = null
    try {
      const next = await getDjRadioToplist()
      if (serial !== radioToplistSerial) return
      radioToplist.value = next
    } catch (requestError) {
      if (serial !== radioToplistSerial) return
      radioToplistError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === radioToplistSerial) radioToplistLoading.value = false
    }
  }

  async function loadRecommendRadios(force = false) {
    if (recommendRadios.value.length && !force && !recommendRadiosError.value) {
      return
    }
    const serial = ++recommendRadioSerial
    recommendRadiosLoading.value = true
    recommendRadiosError.value = null
    try {
      const next = await getDjRecommendRadios()
      if (serial !== recommendRadioSerial) return
      recommendRadios.value = next
    } catch (requestError) {
      if (serial !== recommendRadioSerial) return
      recommendRadiosError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === recommendRadioSerial) recommendRadiosLoading.value = false
    }
  }

  async function loadTodayPrograms(force = false) {
    if (todayPrograms.value.length && !force && !todayProgramsError.value) {
      return
    }
    const serial = ++todayProgramSerial
    todayProgramsLoading.value = true
    todayProgramsError.value = null
    try {
      const next = await getDjTodayPrograms()
      if (serial !== todayProgramSerial) return
      todayPrograms.value = next
    } catch (requestError) {
      if (serial !== todayProgramSerial) return
      todayProgramsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === todayProgramSerial) todayProgramsLoading.value = false
    }
  }

  async function loadProgramHours(force = false) {
    if (programHours.value.length && !force && !programHoursError.value) {
      return
    }
    const serial = ++programHoursSerial
    programHoursLoading.value = true
    programHoursError.value = null
    try {
      const next = await getDjProgramHoursToplist()
      if (serial !== programHoursSerial) return
      programHours.value = next
    } catch (requestError) {
      if (serial !== programHoursSerial) return
      programHoursError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === programHoursSerial) programHoursLoading.value = false
    }
  }

  async function loadRadioHours(force = false) {
    if (radioHours.value.length && !force && !radioHoursError.value) {
      return
    }
    const serial = ++radioHoursSerial
    radioHoursLoading.value = true
    radioHoursError.value = null
    try {
      const next = await getDjRadioHoursToplist()
      if (serial !== radioHoursSerial) return
      radioHours.value = next
    } catch (requestError) {
      if (serial !== radioHoursSerial) return
      radioHoursError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === radioHoursSerial) radioHoursLoading.value = false
    }
  }

  async function loadRecommendPrograms(force = false) {
    if (
      recommendPrograms.value.length &&
      !force &&
      !recommendProgramsError.value
    ) {
      return
    }
    const serial = ++recommendProgramSerial
    recommendProgramsLoading.value = true
    recommendProgramsError.value = null
    try {
      const next = await getDjRecommendPrograms()
      if (serial !== recommendProgramSerial) return
      recommendPrograms.value = next
    } catch (requestError) {
      if (serial !== recommendProgramSerial) return
      recommendProgramsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === recommendProgramSerial) recommendProgramsLoading.value = false
    }
  }

  async function loadHotRadios(force = false) {
    if (hotRadios.value.length && !force && !hotRadiosError.value) {
      return
    }
    const serial = ++hotRadioSerial
    hotRadiosLoading.value = true
    hotRadiosError.value = null
    try {
      const next = await getDjHotRadios()
      if (serial !== hotRadioSerial) return
      hotRadios.value = next
    } catch (requestError) {
      if (serial !== hotRadioSerial) return
      hotRadiosError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === hotRadioSerial) hotRadiosLoading.value = false
    }
  }

  async function loadRecommendByType(force = false) {
    if (cateId.value <= 0) return
    if (
      typeRecommendLoadedId.value === cateId.value &&
      !force &&
      !typeRecommendRadiosError.value
    ) {
      return
    }
    const serial = ++typeRecommendSerial
    const requested = cateId.value
    typeRecommendRadiosLoading.value = true
    typeRecommendRadiosError.value = null
    try {
      const next = await getDjRecommendByType(requested)
      if (serial !== typeRecommendSerial) return
      if (requested !== cateId.value) return
      typeRecommendRadios.value = next
      typeRecommendLoadedId.value = requested
    } catch (requestError) {
      if (serial !== typeRecommendSerial) return
      typeRecommendRadiosError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === typeRecommendSerial) typeRecommendRadiosLoading.value = false
    }
  }

  async function loadCategoryRecommend(force = false) {
    if (
      categoryRecommendRadios.value.length &&
      !force &&
      !categoryRecommendRadiosError.value
    ) {
      return
    }
    const serial = ++categoryRecommendSerial
    categoryRecommendRadiosLoading.value = true
    categoryRecommendRadiosError.value = null
    try {
      const next = await getDjCategoryRecommend()
      if (serial !== categoryRecommendSerial) return
      categoryRecommendRadios.value = next
    } catch (requestError) {
      if (serial !== categoryRecommendSerial) return
      categoryRecommendRadiosError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === categoryRecommendSerial) {
        categoryRecommendRadiosLoading.value = false
      }
    }
  }

  async function load(id: number, force = false): Promise<boolean> {
    if (!Number.isInteger(id) || id <= 0) {
      resetDetail()
      error.value = '缺少有效的电台节目 ID'
      throw new Error('缺少有效的电台节目 ID')
    }

    if (!force && loadedId.value === id && program.value && !error.value) {
      if (relatedPrograms.value === null) requestRelatedPrograms(id, program.value)
      if (comments.value === null) requestComments(id, requestSerial)
      return true
    }

    const serial = ++requestSerial
    commentsMoreSerial++
    commentsMore.value = false
    commentsMoreLoading.value = false
    commentsMoreError.value = null
    commentOffset.value = 0
    if (loadedId.value !== id) {
      program.value = null
      relatedPrograms.value = null
      comments.value = null
      loadedId.value = null
    }
    loading.value = true
    error.value = null
    try {
      const next = await getDjProgramDetail(id)
      if (serial !== requestSerial) return false
      program.value = next
      loadedId.value = id
      requestRelatedPrograms(id, next)
      requestComments(id, serial)
      return true
    } catch (requestError) {
      if (serial !== requestSerial) return false
      error.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === requestSerial) loading.value = false
    }
  }

  function requestComments(id: number, serial: number) {
    const moreSerial = commentsMoreSerial
    void Promise.resolve(getDjCommentPage(id, 0))
      .then((page) => {
        if (serial !== requestSerial) return
        if (loadedId.value !== id) return
        if (moreSerial !== commentsMoreSerial) return
        comments.value = page.comments
        commentsMore.value = page.more
        commentsMoreError.value = null
        commentOffset.value = COMMENT_LIMIT
      })
      .catch(() => undefined)
  }

  async function loadMoreComments() {
    const id = loadedId.value
    if (
      id === null ||
      comments.value === null ||
      !comments.value.length ||
      !commentsMore.value ||
      commentsMoreLoading.value
    ) {
      return
    }
    const serial = ++commentsMoreSerial
    const offset = commentOffset.value
    commentsMoreLoading.value = true
    commentsMoreError.value = null
    try {
      const page = await getDjCommentPage(id, offset)
      if (serial !== commentsMoreSerial || loadedId.value !== id) return
      const seen = new Set(comments.value.map((item) => item.commentId))
      comments.value = [
        ...comments.value,
        ...page.comments.filter((item) => !seen.has(item.commentId)),
      ]
      commentsMore.value = page.more
      commentOffset.value = offset + COMMENT_LIMIT
    } catch (requestError) {
      if (serial !== commentsMoreSerial || loadedId.value !== id) return
      commentsMoreError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === commentsMoreSerial) commentsMoreLoading.value = false
    }
  }

  async function loadCategories(force = false) {
    if (categories.value.length && !force && !categoriesError.value) {
      return
    }
    const serial = ++categorySerial
    categoriesLoading.value = true
    categoriesError.value = null
    try {
      const next = await getDjCategories()
      if (serial !== categorySerial) return
      categories.value = next
    } catch (requestError) {
      if (serial !== categorySerial) return
      categoriesError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === categorySerial) categoriesLoading.value = false
    }
  }

  async function loadRadios(force = false) {
    if (
      radios.value.length &&
      !force &&
      !radiosError.value &&
      cateId.value > 0
    ) {
      return
    }
    if (cateId.value <= 0) return
    const serial = ++radioSerial
    const requested = cateId.value
    radiosLoading.value = true
    radiosError.value = null
    try {
      const page = await getHotDjRadios({
        cateId: requested,
        limit: DJ_RADIO_PAGE_SIZE,
        offset: 0,
      })
      if (serial !== radioSerial) return
      radios.value = page.radios
      radiosMore.value = page.more
    } catch (requestError) {
      if (serial !== radioSerial) return
      radiosError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === radioSerial) radiosLoading.value = false
    }
  }

  async function loadMoreRadios() {
    if (!radiosMore.value || radiosLoading.value || !radios.value.length) return
    const serial = ++radioSerial
    const requested = cateId.value
    const offset = radios.value.length
    radiosLoading.value = true
    radiosError.value = null
    try {
      const page = await getHotDjRadios({
        cateId: requested,
        limit: DJ_RADIO_PAGE_SIZE,
        offset,
      })
      if (serial !== radioSerial) return
      radios.value = [...radios.value, ...page.radios]
      radiosMore.value = page.more
    } catch (requestError) {
      if (serial !== radioSerial) return
      radiosError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === radioSerial) radiosLoading.value = false
    }
  }

  async function setCate(id: number) {
    if (id !== cateId.value) {
      typeRecommendSerial++
      cateId.value = id
      radios.value = []
      radiosError.value = null
      radiosMore.value = false
      typeRecommendRadios.value = []
      typeRecommendRadiosError.value = null
      typeRecommendRadiosLoading.value = false
      typeRecommendLoadedId.value = null
    }
    const [radiosResult] = await Promise.allSettled([
      loadRadios(),
      loadRecommendByType(),
    ])
    if (radiosResult.status === 'rejected') throw radiosResult.reason
  }

  async function loadRadio(id: number, force = false) {
    if (!Number.isInteger(id) || id <= 0) {
      resetRadio()
      radioError.value = '缺少有效的电台 ID'
      throw new Error('缺少有效的电台 ID')
    }
    if (
      !force &&
      radioLoadedId.value === id &&
      radio.value &&
      !radioError.value &&
      !radioProgramsError.value
    ) {
      if (relatedRadios.value === null) requestRelated(id, radio.value)
      if (radioComments.value === null) requestRadioComments(id, radioDetailSerial)
      return
    }

    const detailSerial = ++radioDetailSerial
    const programSerial = ++radioProgramSerial
    radioCommentsMoreSerial++
    radioCommentsMore.value = false
    radioCommentsMoreLoading.value = false
    radioCommentsMoreError.value = null
    radioCommentOffset.value = 0
    if (radioLoadedId.value !== id) {
      radio.value = null
      radioLoadedId.value = null
      radioPrograms.value = []
      radioProgramsMore.value = false
      relatedRadios.value = null
      radioComments.value = null
    }
    radioLoading.value = true
    radioProgramsLoading.value = true
    radioError.value = null
    radioProgramsError.value = null
    try {
      const [next, page] = await Promise.all([
        getDjRadioDetail(id),
        getDjRadioPrograms({
          limit: DJ_RADIO_PROGRAM_PAGE_SIZE,
          offset: 0,
          rid: id,
        }),
      ])
      if (detailSerial === radioDetailSerial) {
        radio.value = next
        radioLoadedId.value = id
        requestRelated(id, next)
        requestRadioComments(id, detailSerial)
      }
      if (programSerial === radioProgramSerial) {
        radioPrograms.value = page.programs
        radioProgramsMore.value = page.more
      }
    } catch (requestError) {
      if (detailSerial === radioDetailSerial) {
        radioError.value = getErrorMessage(requestError)
      }
      if (programSerial === radioProgramSerial) {
        radioProgramsError.value = getErrorMessage(requestError)
      }
      throw requestError
    } finally {
      if (detailSerial === radioDetailSerial) radioLoading.value = false
      if (programSerial === radioProgramSerial) radioProgramsLoading.value = false
    }
  }

  function requestRelatedPrograms(programId: number, detail: DjProgramDetail) {
    const rid = detail.radioId
    if (!Number.isInteger(rid) || rid <= 0) {
      relatedPrograms.value = []
      return
    }
    void Promise.resolve(getDjRadioPrograms({ rid }))
      .then((page) => {
        if (loadedId.value !== programId) return
        relatedPrograms.value = page.programs.filter(
          (item) =>
            item.id !== programId &&
            Number.isInteger(item.id) &&
            item.id > 0,
        )
      })
      .catch(() => undefined)
  }

  function requestRadioComments(id: number, serial: number) {
    const moreSerial = radioCommentsMoreSerial
    void Promise.resolve(getDjRadioCommentPage(id, 0))
      .then((page) => {
        if (serial !== radioDetailSerial) return
        if (radioLoadedId.value !== id) return
        if (moreSerial !== radioCommentsMoreSerial) return
        radioComments.value = page.comments
        radioCommentsMore.value = page.more
        radioCommentsMoreError.value = null
        radioCommentOffset.value = COMMENT_LIMIT
      })
      .catch(() => undefined)
  }

  async function loadMoreRadioComments() {
    const id = radioLoadedId.value
    if (
      id === null ||
      radioComments.value === null ||
      !radioComments.value.length ||
      !radioCommentsMore.value ||
      radioCommentsMoreLoading.value
    ) {
      return
    }
    const serial = ++radioCommentsMoreSerial
    const offset = radioCommentOffset.value
    radioCommentsMoreLoading.value = true
    radioCommentsMoreError.value = null
    try {
      const page = await getDjRadioCommentPage(id, offset)
      if (serial !== radioCommentsMoreSerial || radioLoadedId.value !== id) return
      const seen = new Set(radioComments.value.map((item) => item.commentId))
      radioComments.value = [
        ...radioComments.value,
        ...page.comments.filter((item) => !seen.has(item.commentId)),
      ]
      radioCommentsMore.value = page.more
      radioCommentOffset.value = offset + COMMENT_LIMIT
    } catch (requestError) {
      if (serial !== radioCommentsMoreSerial || radioLoadedId.value !== id) return
      radioCommentsMoreError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === radioCommentsMoreSerial) radioCommentsMoreLoading.value = false
    }
  }

  function requestRelated(radioId: number, detail: DjRadioDetail) {
    const cateId = detail.categoryId
    if (!Number.isInteger(cateId) || cateId <= 0) {
      relatedRadios.value = []
      return
    }
    void Promise.resolve(getHotDjRadios({ cateId }))
      .then((page) => {
        if (radioLoadedId.value !== radioId) return
        relatedRadios.value = page.radios.filter(
          (item) =>
            item.id !== radioId &&
            Number.isInteger(item.id) &&
            item.id > 0,
        )
      })
      .catch(() => undefined)
  }

  async function loadMoreRadioPrograms() {
    const id = radioLoadedId.value
    if (!id || !radioProgramsMore.value || radioProgramsLoading.value) return
    const serial = ++radioProgramSerial
    const offset = radioPrograms.value.length
    radioProgramsLoading.value = true
    radioProgramsError.value = null
    try {
      const page = await getDjRadioPrograms({
        limit: DJ_RADIO_PROGRAM_PAGE_SIZE,
        offset,
        rid: id,
      })
      if (serial !== radioProgramSerial) return
      radioPrograms.value = [...radioPrograms.value, ...page.programs]
      radioProgramsMore.value = page.more
    } catch (requestError) {
      if (serial !== radioProgramSerial) return
      radioProgramsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === radioProgramSerial) radioProgramsLoading.value = false
    }
  }

  return {
    load,
    loadBanners,
    loadPrograms,
    loadToplist,
    loadRadioToplist,
    loadRecommendRadios,
    loadTodayPrograms,
    loadProgramHours,
    loadRadioHours,
    loadRecommendPrograms,
    loadHotRadios,
    loadRecommendByType,
    loadCategoryRecommend,
    loadCategories,
    loadRadios,
    loadMoreRadios,
    setCate,
    loadRadio,
    loadMoreRadioPrograms,
    loadMoreRadioComments,
    loadMoreComments,
    resetDetail,
    resetRadio,
    reset,
    program,
    error,
    loading,
    loadedId,
    programs,
    programsError,
    programsLoading,
    toplistPrograms,
    toplistError,
    toplistLoading,
    banners,
    bannersError,
    bannersLoading,
    categories,
    categoriesError,
    categoriesLoading,
    cateId,
    radios,
    radiosError,
    radiosLoading,
    radiosMore,
    radioToplist,
    radioToplistError,
    radioToplistLoading,
    recommendRadios,
    recommendRadiosError,
    recommendRadiosLoading,
    todayPrograms,
    todayProgramsError,
    todayProgramsLoading,
    programHours,
    programHoursError,
    programHoursLoading,
    radioHours,
    radioHoursError,
    radioHoursLoading,
    recommendPrograms,
    recommendProgramsError,
    recommendProgramsLoading,
    hotRadios,
    hotRadiosError,
    hotRadiosLoading,
    typeRecommendRadios,
    typeRecommendRadiosError,
    typeRecommendRadiosLoading,
    categoryRecommendRadios,
    categoryRecommendRadiosError,
    categoryRecommendRadiosLoading,
    radio,
    radioError,
    radioLoading,
    radioLoadedId,
    radioPrograms,
    radioProgramsError,
    radioProgramsLoading,
    radioProgramsMore,
    relatedRadios,
    relatedPrograms,
    comments,
    commentsMore,
    commentsMoreLoading,
    commentsMoreError,
    commentOffset,
    radioComments,
    radioCommentsMore,
    radioCommentsMoreLoading,
    radioCommentsMoreError,
    radioCommentOffset,
  }
})
