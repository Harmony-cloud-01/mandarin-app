"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  ReactNode,
  useEffect,
  useMemo,
} from "react"
import { useToast } from "@/hooks/use-toast"
import { logEvent } from "@/utils/activity-log"
import { scopedKey } from "@/utils/profile-storage"

export interface DialectInfo {
  name: string
  code: string
  region: string
  description: string
  available: boolean
}

const supportedDialects: DialectInfo[] = [
  { name: "普通话", code: "zh-CN", region: "Standard", description: "Standard Mandarin", available: true },
  { name: "东北话", code: "zh-CN-northeast", region: "Northeast", description: "Northeastern dialect", available: true },
  { name: "四川话", code: "zh-CN-sichuan", region: "Sichuan", description: "Sichuan dialect", available: true },
  { name: "河南话", code: "zh-CN-henan", region: "Henan", description: "Henan dialect", available: true },
  { name: "山东话", code: "zh-CN-shandong", region: "Shandong", description: "Shandong dialect", available: true },
  { name: "陕西话", code: "zh-CN-shaanxi", region: "Shaanxi", description: "Shaanxi dialect", available: true },
]

// Preferred voice name patterns by dialect (best-effort; varies by OS/Browser)
const PREFERRED_VOICE_PATTERNS: Record<string, string[]> = {
  "zh-CN": ["Ting-Ting", "Tingting", "Mei-Jia", "Liang", "Zhiwei", "Chinese"],
  "zh-CN-northeast": ["Chinese", "Mandarin", "zh-CN"],
  "zh-CN-sichuan": ["Chinese", "Mandarin", "zh-CN"],
  "zh-CN-henan": ["Chinese", "Mandarin", "zh-CN"],
  "zh-CN-shandong": ["Chinese", "Mandarin", "zh-CN"],
  "zh-CN-shaanxi": ["Chinese", "Mandarin", "zh-CN"],
}

interface DialectContextType {
  // playback
  playPronunciation: (text: string, dialectCode?: string) => Promise<void>
  playBothDialects: (text: string, primaryDialect: string) => Promise<void>
  stopAudio: () => void
  isPlaying: boolean
  currentlyPlaying: string | null
  currentDialect: string | null

  // settings
  playbackRate: number
  setPlaybackRate: (rate: number) => void
  selectedDialects: string[]
  setSelectedDialects: (dialects: string[]) => void
  preferredVoiceName: string | null
  setPreferredVoiceName: (name: string | null) => void

  // voices / env
  speechSupported: boolean
  voices: SpeechSynthesisVoice[]
  hasChineseVoice: boolean

  // metadata
  supportedDialects: DialectInfo[]
}

const DialectContext = createContext<DialectContextType | undefined>(undefined)

interface DialectProviderProps {
  children: React.ReactNode
}

// Base storage keys (scoped per profile)
const BASE_SELECTED_DIALECTS = "dialect.selectedDialects"
const BASE_PLAYBACK_RATE = "dialect.playbackRate"
const BASE_PREFERRED_VOICE = "dialect.preferredVoice"

export function DialectProvider({ children }: DialectProviderProps) {
  const { toast } = useToast()

  // env
  const speechSupported = typeof window === "undefined" ? false : "speechSynthesis" in window

  // state
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [currentDialect, setCurrentDialect] = useState<string | null>(null)
  const [playbackRate, setPlaybackRate] = useState(0.8)
  const [selectedDialects, setSelectedDialects] = useState<string[]>(["zh-CN", "zh-CN-northeast"])
  const [preferredVoiceName, setPreferredVoiceName] = useState<string | null>(null)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const audioElRef = useRef<HTMLAudioElement | null>(null)

  // derived
  const hasChineseVoice = useMemo(
    () =>
      voices.some(
        (v) =>
          v.lang.toLowerCase().includes("zh") ||
          v.name.toLowerCase().includes("chinese") ||
          v.name.toLowerCase().includes("mandarin")
      ),
    [voices]
  )

  // centralized voice loading
  useEffect(() => {
    if (!speechSupported) return
    const loadVoices = () => {
      const list = speechSynthesis.getVoices()
      if (list && list.length) {
        setVoices(list)
      }
    }
    loadVoices()
    speechSynthesis.addEventListener("voiceschanged", loadVoices)
    return () => speechSynthesis.removeEventListener("voiceschanged", loadVoices)
  }, [speechSupported])

  // hydrate from profile-scoped localStorage
  const hydratePrefs = useCallback(() => {
    if (typeof window === "undefined") return
    try {
      const d = localStorage.getItem(scopedKey(BASE_SELECTED_DIALECTS))
      if (d) {
        const parsed = JSON.parse(d)
        if (Array.isArray(parsed) && parsed.length > 0) setSelectedDialects(parsed)
      } else {
        setSelectedDialects(["zh-CN", "zh-CN-northeast"])
      }
    } catch {
      setSelectedDialects(["zh-CN", "zh-CN-northeast"])
    }
    try {
      const r = localStorage.getItem(scopedKey(BASE_PLAYBACK_RATE))
      if (r) {
        const n = parseFloat(r)
        if (!Number.isNaN(n) && n >= 0.5 && n <= 2) setPlaybackRate(n)
      } else {
        setPlaybackRate(0.8)
      }
    } catch {
      setPlaybackRate(0.8)
    }
    try {
      const v = localStorage.getItem(scopedKey(BASE_PREFERRED_VOICE))
      if (v) setPreferredVoiceName(v)
      else setPreferredVoiceName(null)
    } catch {
      setPreferredVoiceName(null)
    }
  }, [])

  useEffect(() => {
    hydratePrefs()
  }, [hydratePrefs])

  // rehydrate on profile switch
  useEffect(() => {
    const onProfileChange = () => hydratePrefs()
    window.addEventListener("profile:changed", onProfileChange)
    return () => window.removeEventListener("profile:changed", onProfileChange)
  }, [hydratePrefs])

  // persist to profile-scoped localStorage
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem(scopedKey(BASE_SELECTED_DIALECTS), JSON.stringify(selectedDialects))
    } catch {}
  }, [selectedDialects])
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem(scopedKey(BASE_PLAYBACK_RATE), String(playbackRate))
    } catch {}
  }, [playbackRate])
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      if (preferredVoiceName) localStorage.setItem(scopedKey(BASE_PREFERRED_VOICE), preferredVoiceName)
      else localStorage.removeItem(scopedKey(BASE_PREFERRED_VOICE))
    } catch {}
  }, [preferredVoiceName])

  const stopAudio = useCallback(() => {
    if (speechSupported && speechSynthesis.speaking) {
      speechSynthesis.cancel()
    }
    if (audioElRef.current) {
      audioElRef.current.pause()
      audioElRef.current.currentTime = 0
      audioElRef.current = null
    }
    setIsPlaying(false)
    setCurrentlyPlaying(null)
    setCurrentDialect(null)
    utteranceRef.current = null
  }, [speechSupported])

  // attempt to find best voice
  const findBestVoice = useCallback(
    (dialectCode: string) => {
      if (!speechSupported) return undefined
      // 1) Exact name preference
      if (preferredVoiceName) {
        const byName = voices.find((v) => v.name === preferredVoiceName)
        if (byName) return byName
      }
      // 2) Exact language match
      let v = voices.find((vv) => vv.lang === dialectCode)
      if (v) return v
      // 3) Preferred patterns for dialect
      const patterns = PREFERRED_VOICE_PATTERNS[dialectCode] || []
      for (const p of patterns) {
        const candidate = voices.find(
          (vv) => vv.name.toLowerCase().includes(p.toLowerCase()) || vv.lang.toLowerCase().includes("zh")
        )
        if (candidate) return candidate
      }
      // 4) Any Chinese/Mandarin
      v = voices.find(
        (vv) =>
          vv.lang.toLowerCase().includes("zh") ||
          vv.name.toLowerCase().includes("chinese") ||
          vv.name.toLowerCase().includes("mandarin")
      )
      return v
    },
    [voices, speechSupported, preferredVoiceName]
  )

  // optional: baked-in audio fallback (empty mapping by default)
  const bakedAudio: Record<string, string> = {
    // Example: "你好": "/audio/nihao.mp3"
  }

  const playWithAudioTag = useCallback(
    async (text: string) => {
      const src = bakedAudio[text]
      if (!src) {
        toast({
          title: "Audio unavailable",
          description: "No pre-recorded audio found for this phrase.",
        })
        return
      }
      stopAudio()
      const audio = new Audio(src)
      audioElRef.current = audio
      setIsPlaying(true)
      setCurrentlyPlaying(text)
      setCurrentDialect("baked")
      audio.onended = () => {
        setIsPlaying(false)
        setCurrentlyPlaying(null)
        setCurrentDialect(null)
        audioElRef.current = null
      }
      audio.onerror = () => {
        setIsPlaying(false)
        setCurrentlyPlaying(null)
        setCurrentDialect(null)
        audioElRef.current = null
        toast({
          title: "Playback error",
          description: "There was a problem playing the audio file.",
          variant: "destructive",
        })
      }
      // Log activity
      logEvent({ type: "audio.play", text, t: Date.now() })
      await audio.play().catch(() => {
        toast({
          title: "Tap to play",
          description: "Your browser blocked auto-play. Tap the speaker icon again.",
        })
      })
    },
    [stopAudio, toast, bakedAudio]
  )

  const playPronunciation = useCallback(
    async (text: string, dialectCode: string = "zh-CN") => {
      stopAudio()

      if (!speechSupported) {
        toast({
          title: "Speech not supported",
          description: "Text-to-Speech not available. Trying pre-recorded audio.",
        })
        await playWithAudioTag(text)
        return
      }

      try {
        setIsPlaying(true)
        setCurrentlyPlaying(text)
        setCurrentDialect(dialectCode)

        const utterance = new SpeechSynthesisUtterance(text)
        utteranceRef.current = utterance

        utterance.lang = dialectCode
        utterance.rate = playbackRate
        utterance.pitch = dialectCode.includes("northeast") ? 1.1 : 1.0
        utterance.volume = 1

        const voice = findBestVoice(dialectCode)
        if (voice) {
          utterance.voice = voice
        } else {
          toast({
            title: "Chinese voice not found",
            description: "Using default system voice or trying pre-recorded audio.",
          })
        }

        utterance.onend = () => {
          setIsPlaying(false)
          setCurrentlyPlaying(null)
          setCurrentDialect(null)
          utteranceRef.current = null
        }
        utterance.onerror = () => {
          setIsPlaying(false)
          setCurrentlyPlaying(null)
          setCurrentDialect(null)
          utteranceRef.current = null
          toast({
            title: "Speech error",
            description: "There was a problem with speech synthesis.",
            variant: "destructive",
          })
        }

        // Log activity once we kick off speaking
        logEvent({ type: "audio.play", text, dialect: dialectCode, t: Date.now() })
        speechSynthesis.speak(utterance)
      } catch (error) {
        setIsPlaying(false)
        setCurrentlyPlaying(null)
        setCurrentDialect(null)
        toast({
          title: "Playback error",
          description: "Falling back to pre-recorded audio when available.",
        })
        await playWithAudioTag(text)
      }
    },
    [findBestVoice, playbackRate, playWithAudioTag, speechSupported, stopAudio, toast]
  )

  const playBothDialects = useCallback(
    async (text: string, primaryDialect: string) => {
      // chain strictly using onend
      await playPronunciation(text, "zh-CN")

      const waitForEnd = () =>
        new Promise<void>((resolve) => {
          const current = utteranceRef.current
          if (!current) return resolve()
          const prevOnEnd = current.onend
          current.onend = () => {
            prevOnEnd && prevOnEnd(new Event("end") as any)
            resolve()
          }
          const prevOnErr = current.onerror
          current.onerror = () => {
            prevOnErr && prevOnErr(new Event("error") as any)
            resolve()
          }
        })

      await waitForEnd()
      if (primaryDialect !== "zh-CN") {
        await playPronunciation(text, primaryDialect)
      }
    },
    [playPronunciation]
  )

  const contextValue = useMemo(
    () => ({
      playPronunciation,
      playBothDialects,
      stopAudio,
      isPlaying,
      currentlyPlaying,
      currentDialect,
      playbackRate,
      setPlaybackRate,
      supportedDialects,
      selectedDialects,
      setSelectedDialects,
      preferredVoiceName,
      setPreferredVoiceName,
      speechSupported,
      voices,
      hasChineseVoice,
    }),
    [
      playPronunciation,
      playBothDialects,
      stopAudio,
      isPlaying,
      currentlyPlaying,
      currentDialect,
      playbackRate,
      selectedDialects,
      preferredVoiceName,
      speechSupported,
      voices,
      hasChineseVoice,
    ]
  )

  return <DialectContext.Provider value={contextValue}>{children}</DialectContext.Provider>
}

export function useDialect() {
  const ctx = useContext(DialectContext)
  if (!ctx) throw new Error("useDialect must be used within a DialectProvider")
  return ctx
}
