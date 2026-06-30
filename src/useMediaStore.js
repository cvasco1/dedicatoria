// useMediaStore.js — IndexedDB persistence for photos & videos
import { useState, useEffect, useCallback } from 'react'

const DB_NAME = 'romantic_v4'
const DB_VER  = 1
const STORES  = { photos: 'photos', videos: 'videos' }

// Default scope used when none is provided — keeps existing Gallery/Videos
// data (saved before this change, with no `scope` field) working as before.
const DEFAULT_SCOPE = { photos: 'gallery', videos: 'videos' }

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORES.photos))
        db.createObjectStore(STORES.photos, { keyPath: 'id' })
      if (!db.objectStoreNames.contains(STORES.videos))
        db.createObjectStore(STORES.videos, { keyPath: 'id' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror   = () => reject(req.error)
  })
}

async function dbGetAll(store) {
  const db = await openDB()
  return new Promise((res, rej) => {
    const req = db.transaction(store, 'readonly').objectStore(store).getAll()
    req.onsuccess = () => res(req.result)
    req.onerror   = () => rej(req.error)
  })
}

async function dbPut(store, item) {
  const db = await openDB()
  return new Promise((res, rej) => {
    const req = db.transaction(store, 'readwrite').objectStore(store).put(item)
    req.onsuccess = () => res()
    req.onerror   = () => rej(req.error)
  })
}

async function dbDelete(store, id) {
  const db = await openDB()
  return new Promise((res, rej) => {
    const req = db.transaction(store, 'readwrite').objectStore(store).delete(id)
    req.onsuccess = () => res()
    req.onerror   = () => rej(req.error)
  })
}

function fileToDataURL(file) {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload  = () => res(r.result)
    r.onerror = rej
    r.readAsDataURL(file)
  })
}

function blobToDataURL(blob) {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload  = () => res(r.result)
    r.onerror = rej
    r.readAsDataURL(blob)
  })
}

const ROTS = ['-2deg','1.5deg','-1deg','2deg','-1.5deg','1deg','-2.5deg','0.8deg']

// ── PHOTOS ──────────────────────────────────────────────────────────────────
// `scope` lets different sections (e.g. each pet) keep separate, isolated
// photo collections in the same IndexedDB store, each with its own MAX limit.
export function usePersistedPhotos(seedPhotos, MAX = 20, scope = DEFAULT_SCOPE.photos) {
  const [saved,   setSaved]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    dbGetAll(STORES.photos)
      .then(rows => {
        if (!alive) return
        const filtered = rows.filter(r => (r.scope || DEFAULT_SCOPE.photos) === scope)
        setSaved(filtered.sort((a, b) => a.order - b.order))
        setLoading(false)
      })
      .catch(() => alive && setLoading(false))
    return () => { alive = false }
  }, [scope])

  const all = [...seedPhotos, ...saved]

  const addFromFile = useCallback(async (file, caption, rotate) => {
    if (all.length >= MAX) return { error: `Máximo ${MAX} fotos` }
    const dataUrl = await fileToDataURL(file)
    const item = {
      id:      `photo_${Date.now()}`,
      src:     dataUrl,
      caption: caption || 'Un momento especial 💕',
      rotate:  rotate  || ROTS[saved.length % ROTS.length],
      order:   Date.now(),
      fromDB:  true,
      scope,
    }
    await dbPut(STORES.photos, item)
    setSaved(p => [...p, item])
    return { ok: true }
  }, [all.length, MAX, saved.length, scope])

  const addFromUrl = useCallback(async (url, caption, rotate) => {
    if (all.length >= MAX) return { error: `Máximo ${MAX} fotos` }
    const item = {
      id:      `photo_${Date.now()}`,
      src:     url.trim(),
      caption: caption || 'Un momento especial 💕',
      rotate:  rotate  || ROTS[saved.length % ROTS.length],
      order:   Date.now(),
      fromDB:  true,
      scope,
    }
    await dbPut(STORES.photos, item)
    setSaved(p => [...p, item])
    return { ok: true }
  }, [all.length, MAX, saved.length, scope])

  const remove = useCallback(async (id) => {
    await dbDelete(STORES.photos, id)
    setSaved(p => p.filter(x => x.id !== id))
  }, [])

  return { all, saved, loading, addFromFile, addFromUrl, remove, count: all.length, max: MAX }
}

// ── VIDEOS ──────────────────────────────────────────────────────────────────
export function usePersistedVideos(seedVideos, MAX = 15, scope = DEFAULT_SCOPE.videos) {
  const [saved,   setSaved]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    dbGetAll(STORES.videos)
      .then(rows => {
        if (!alive) return
        const filtered = rows.filter(r => (r.scope || DEFAULT_SCOPE.videos) === scope)
        setSaved(filtered.sort((a, b) => a.order - b.order))
        setLoading(false)
      })
      .catch(() => alive && setLoading(false))
    return () => { alive = false }
  }, [scope])

  const all = [...seedVideos, ...saved]

  // Add from raw file (no conversion — for mp4/webm that browsers handle natively)
  const addFromFile = useCallback(async (file, title) => {
    if (all.length >= MAX) return { error: `Máximo ${MAX} videos` }
    const dataUrl = await fileToDataURL(file)
    const item = {
      id:        `video_${Date.now()}`,
      title:     title || file.name.replace(/\.[^.]+$/, ''),
      src:       dataUrl,
      mimeType:  file.type || 'video/mp4',
      url:       null,
      thumbnail: null,
      emoji:     '🎬',
      order:     Date.now(),
      fromDB:    true,
      converted: false,
      scope,
    }
    await dbPut(STORES.videos, item)
    setSaved(p => [...p, item])
    return { ok: true }
  }, [all.length, MAX, scope])

  // Add from FFmpeg-converted Blob (always mp4)
  const addFromBlob = useCallback(async (blob, title) => {
    if (all.length >= MAX) return { error: `Máximo ${MAX} videos` }
    const dataUrl = await blobToDataURL(blob)
    const item = {
      id:        `video_${Date.now()}`,
      title:     title || 'Mi video',
      src:       dataUrl,
      mimeType:  'video/mp4',
      url:       null,
      thumbnail: null,
      emoji:     '🎬',
      order:     Date.now(),
      fromDB:    true,
      converted: true,
      scope,
    }
    await dbPut(STORES.videos, item)
    setSaved(p => [...p, item])
    return { ok: true }
  }, [all.length, MAX, scope])

  // Add from URL (YouTube embed or direct link)
  const addFromUrl = useCallback(async (url, title, thumbnail) => {
    if (all.length >= MAX) return { error: `Máximo ${MAX} videos` }
    const item = {
      id:        `video_${Date.now()}`,
      title:     title || 'Mi video',
      url:       url.trim(),
      thumbnail: thumbnail || null,
      src:       null,
      mimeType:  null,
      emoji:     '🎬',
      order:     Date.now(),
      fromDB:    true,
      converted: false,
      scope,
    }
    await dbPut(STORES.videos, item)
    setSaved(p => [...p, item])
    return { ok: true }
  }, [all.length, MAX, scope])

  const remove = useCallback(async (id) => {
    await dbDelete(STORES.videos, id)
    setSaved(p => p.filter(x => x.id !== id))
  }, [])

  return { all, saved, loading, addFromFile, addFromBlob, addFromUrl, remove, count: all.length, max: MAX }
}