"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from "react"
import { useToast } from "@/hooks/use-toast"
import { logEvent } from "@/utils/activity-log"
import { scopedKey } from "@/utils/profile-storage"
import { debounce } from "lodash-es"

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

const PREFERRED_VOICE_PATTERNS: Record<string, string[]> = {
  "zh-CN": ["Ting-Ting", "Tingting", "Mei-Jia", "Liang", "Zhiwei", "Chinese"],
  "zh-CN-northeast": ["Chinese", "Mandarin", "zh-CN", "Dongbei"],
  "zh-CN-sichuan": ["Chinese", "Mandarin", "zh-CN", "Sichuan"],
  "zh-CN-henan": ["Chinese", "Mandarin", "zh-CN", "Henan"],
  "zh-CN-shandong": ["Chinese", "Mandarin", "zh-CN", "Shandong"],
  "zh-CN-shaanxi": ["Chinese", "Mandarin", "zh-CN", "Shaanxi"],
}

interface DialectContextType {
  playPronunciation: (text: string, dialectCode?: string) => Promise<void>
  playBothDialects: (text: string, primaryDialect: string) => Promise<void>
  playWithToneDisplay: (text: string, dialectCode?: string) => Promise<void>
  stopAudio: () => void
  isPlaying: boolean
  currentlyPlaying: string | null
  currentDialect: string | null
  playbackRate: number
  setPlaybackRate: (rate: number) => void
  selectedDialects: string[]
  setSelectedDialects: (dialects: string[]) => void
  preferredVoiceName: string | null
  setPreferredVoiceName: (name: string | null) => void
  speechSupported: boolean
  voices: SpeechSynthesisVoice[]
  hasChineseVoice: boolean
  supportedDialects: DialectInfo[]
}

const DialectContext = createContext<DialectContextType | undefined>(undefined)

interface DialectProviderProps {
  children: React.ReactNode
}

const BASE_SELECTED_DIALECTS = "dialect.v2.selectedDialects"
const BASE_PLAYBACK_RATE = "dialect.v2.playbackRate"
const BASE_PREFERRED_VOICE = "dialect.v2.preferredVoice"

export function DialectProvider({ children }: DialectProviderProps) {
  const { toast } = useToast()

  const [speechSupported, setSpeechSupported] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [currentDialect, setCurrentDialect] = useState<string | null>(null)
  const [playbackRate, setPlaybackRate] = useState(0.8)
  const [selectedDialects, setSelectedDialects] = useState<string[]>(["zh-CN", "zh-CN-northeast"])
  const [preferredVoiceName, setPreferredVoiceName] = useState<string | null>(null)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const audioElRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const supported = typeof window !== "undefined" && "speechSynthesis" in window
    setSpeechSupported(supported)
    setIsMobile(/Mobi|Android/i.test(navigator.userAgent))
  }, [])

  useEffect(() => {
    if (!speechSupported) return
    const loadVoices = debounce(() => {
      const list = speechSynthesis.getVoices()
      if (list?.length) setVoices(list)
    }, 500)
    loadVoices()
    speechSynthesis.addEventListener("voiceschanged", loadVoices)
    return () => {
      speechSynthesis.removeEventListener("voiceschanged", loadVoices)
      loadVoices.cancel()
    }
  }, [speechSupported])

  const hydratePrefs = useCallback(() => {
    if (typeof window === "undefined") return
    const load = <T>(key: string, fallback: T, validate: (v: any) => boolean): T => {
      try {
        const item = localStorage.getItem(scopedKey(key))
        if (item) {
          const parsed = JSON.parse(item)
          if (validate(parsed)) return parsed
        }
      } catch {}
      return fallback
    }
    setSelectedDialects(load(BASE_SELECTED_DIALECTS, ["zh-CN", "zh-CN-northeast"], Array.isArray))
    setPlaybackRate(load(BASE_PLAYBACK_RATE, 0.8, (v) => typeof v === "number"))
    setPreferredVoiceName(load(BASE_PREFERRED_VOICE, null, (v) => typeof v === "string" || v === null))
  }, [])

  useEffect(() => {
    hydratePrefs()
    const onProfileChange = () => hydratePrefs()
    window.addEventListener("profile:changed", onProfileChange)
    return () => window.removeEventListener("profile:changed", onProfileChange)
  }, [hydratePrefs])

  useEffect(() => {
    if (typeof window === "undefined") return
    localStorage.setItem(scopedKey(BASE_SELECTED_DIALECTS), JSON.stringify(selectedDialects))
  }, [selectedDialects])

  useEffect(() => {
    if (typeof window === "undefined") return
    localStorage.setItem(scopedKey(BASE_PLAYBACK_RATE), String(playbackRate))
  }, [playbackRate])

  useEffect(() => {
    if (typeof window === "undefined") return
    preferredVoiceName
      ? localStorage.setItem(scopedKey(BASE_PREFERRED_VOICE), preferredVoiceName)
      : localStorage.removeItem(scopedKey(BASE_PREFERRED_VOICE))
  }, [preferredVoiceName])

  const stopAudio = useCallback(() => {
    speechSynthesis.cancel()
    if (audioElRef.current) {
      audioElRef.current.pause()
      audioElRef.current.currentTime = 0
      audioElRef.current = null
    }
    setIsPlaying(false)
    setCurrentlyPlaying(null)
    setCurrentDialect(null)
    utteranceRef.current = null
  }, [])

  const findBestVoice = useCallback(
    (dialectCode: string) => {
      if (!speechSupported) return undefined
      if (preferredVoiceName) {
        const byName = voices.find((v) => v.name === preferredVoiceName)
        if (byName) return byName
      }
      const patterns = [
        ...(PREFERRED_VOICE_PATTERNS[dialectCode] || []),
        ...(dialectCode !== "zh-CN" ? PREFERRED_VOICE_PATTERNS["zh-CN"] : []),
        "Chinese",
        "Mandarin",
      ]
      for (const p of patterns) {
        const candidate = voices.find(
          (v) =>
            v.lang.toLowerCase().includes(dialectCode.toLowerCase()) ||
            v.name.toLowerCase().includes(p.toLowerCase()) ||
            v.lang.toLowerCase().includes("zh")
        )
        if (candidate) return candidate
      }
      return voices.find((v) => v.default) || voices[0]
    },
    [voices, speechSupported, preferredVoiceName]
  )

  const getBakedAudioPath = useCallback((text: string, dialectCode: string) => {
    return `/audio/${dialectCode}/${encodeURIComponent(text)}.mp3`
  }, [])

  const playWithAudioTag = useCallback(
    async (text: string, dialectCode: string) => {
      const src = getBakedAudioPath(text, dialectCode)
      stopAudio()
      const audio = new Audio(src)
      audioElRef.current = audio
      audio.onerror = () => {
        stopAudio()
        toast({ title: "Audio unavailable", description: "No recording available for this phrase" })
      }
      audio.onended = () => stopAudio()
      setIsPlaying(true)
      setCurrentlyPlaying(text)
      setCurrentDialect(dialectCode)
      logEvent({ type: "audio.play", text, dialect: dialectCode, t: Date.now() })
      try {
        await audio.play()
      } catch (err) {
        stopAudio()
        if (isMobile) {
          toast({ title: "Tap to play", description: "Mobile requires direct interaction" })
        }
      }
    },
    [getBakedAudioPath, isMobile, stopAudio, toast]
  )

  const playPronunciation = useCallback(
    async (text: string, dialectCode = "zh-CN") => {
      if (isMobile) {
        toast({ title: "Tap speaker icon", description: "Mobile requires direct interaction" })
        return
      }
      stopAudio()
      if (!speechSupported) return playWithAudioTag(text, dialectCode)
      setIsPlaying(true)
      setCurrentlyPlaying(text)
      setCurrentDialect(dialectCode)
      const utterance = new SpeechSynthesisUtterance(text)
      utteranceRef.current = utterance
      utterance.lang = dialectCode
      utterance.rate = playbackRate
      utterance.pitch = dialectCode.includes("northeast") ? 1.1 : 1.0
      const voice = findBestVoice(dialectCode)
      if (voice) utterance.voice = voice
      utterance.onend = () => stopAudio()
      utterance.onerror = () => {
        stopAudio()
        playWithAudioTag(text, dialectCode)
      }
      logEvent({ type: "audio.play", text, dialect: dialectCode, t: Date.now() })
      speechSynthesis.speak(utterance)
    },
    [findBestVoice, isMobile, playbackRate, playWithAudioTag, speechSupported, stopAudio, toast]
  )

  const playBothDialects = useCallback(
    async (text: string, primaryDialect: string) => {
      await playPronunciation(text, "zh-CN")
      const waitForEnd = () =>
        new Promise<void>((resolve) => {
          const current = utteranceRef.current
          if (!current) return resolve()
          const prevOnEnd = current.onend
          current.onend = (e: SpeechSynthesisEvent) => {
            prevOnEnd?.(e)
            resolve()
          }
          const prevOnErr = current.onerror
          current.onerror = (e: SpeechSynthesisEvent) => {
            prevOnErr?.(e)
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

  const playWithToneDisplay = useCallback(
    async (text: string, dialectCode = "zh-CN") => {
      await playPronunciation(text, dialectCode)
      logEvent({ type: "tone.analysis", text, dialect: dialectCode })
    },
    [playPronunciation]
  )

  const contextValue = useMemo(
    () => ({
      playPronunciation,
      playBothDialects,
      playWithToneDisplay,
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
      hasChineseVoice: voices.some((v) => v.lang.toLowerCase().includes("zh")),
    }),
    [
      playPronunciation,
      playBothDialects,
      playWithToneDisplay,
      stopAudio,
      isPlaying,
      currentlyPlaying,
      currentDialect,
      playbackRate,
      selectedDialects,
      preferredVoiceName,
      speechSupported,
      voices,
    ]
  )

  return <DialectContext.Provider value={contextValue}>{children}</DialectContext.Provider>
}

export function useDialect() {
  const context = useContext(DialectContext)
  if (!context) throw new Error("useDialect must be used within DialectProvider")
  return context
}
