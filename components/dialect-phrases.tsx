"use client"

import { useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Volume2, Users, MapPin, ArrowRightLeft } from 'lucide-react'
import { useDialect } from "./dialect-provider"
import { useI18n } from "./i18n-provider"
import { MiniDictionary } from "./mini-dictionary"

interface PhraseVariant { text: string; pinyin: string }
interface PhraseEntry {
  english: string
  standard: PhraseVariant
  dialects: Record<string, PhraseVariant>
}
interface PhraseCategory {
  id: number
  category: string
  icon: string
  phrases: PhraseEntry[]
}

const dialectPhrases: PhraseCategory[] = [
  {
    id: 1,
    category: "问候语 Greetings",
    icon: "👋",
    phrases: [
      {
        english: "How are you?",
        standard: { text: "你好吗？", pinyin: "nǐ hǎo ma?" },
        dialects: {
          "zh-CN-northeast": { text: "你咋样？", pinyin: "nǐ zǎ yàng?" },
          "zh-CN-sichuan": { text: "你好不？", pinyin: "nǐ hǎo bù?" },
          "zh-CN-henan": { text: "中不中？", pinyin: "zhōng bù zhōng?" },
          "zh-CN-shandong": { text: "你好着不？", pinyin: "nǐ hǎo zhe bù?" },
        },
      },
      {
        english: "What are you doing?",
        standard: { text: "你在做什么？", pinyin: "nǐ zài zuò shén me?" },
        dialects: {
          "zh-CN-northeast": { text: "你干啥呢？", pinyin: "nǐ gàn shá ne?" },
          "zh-CN-sichuan": { text: "你搞啥子？", pinyin: "nǐ gǎo shá zi?" },
          "zh-CN-henan": { text: "你弄啥咧？", pinyin: "nǐ nòng shá lie?" },
          "zh-CN-shandong": { text: "你忙啥呢？", pinyin: "nǐ máng shá ne?" },
        },
      },
    ],
  },
  {
    id: 2,
    category: "农事交流 Farm Talk",
    icon: "🌾",
    phrases: [
      {
        english: "The crops are growing well",
        standard: { text: "庄稼长得很好", pinyin: "zhuāng jia zhǎng de hěn hǎo" },
        dialects: {
          "zh-CN-northeast": { text: "庄稼长得老好了", pinyin: "zhuāng jia zhǎng de lǎo hǎo le" },
          "zh-CN-sichuan": { text: "庄稼长得巴适", pinyin: "zhuāng jia zhǎng de bā shì" },
          "zh-CN-henan": { text: "庄稼长得中", pinyin: "zhuāng jia zhǎng de zhōng" },
          "zh-CN-shandong": { text: "庄稼长得好得很", pinyin: "zhuāng jia zhǎng de hǎo de hěn" },
        },
      },
      {
        english: "It's time to harvest",
        standard: { text: "该收割了", pinyin: "gāi shōu gē le" },
        dialects: {
          "zh-CN-northeast": { text: "该割地了", pinyin: "gāi gē dì le" },
          "zh-CN-sichuan": { text: "要收庄稼了", pinyin: "yào shōu zhuāng jia le" },
          "zh-CN-henan": { text: "该割麦了", pinyin: "gāi gē mài le" },
          "zh-CN-shandong": { text: "该收成了", pinyin: "gāi shōu chéng le" },
        },
      },
    ],
  },
  {
    id: 3,
    category: "日常生活 Daily Life",
    icon: "🏠",
    phrases: [
      {
        english: "Have you eaten?",
        standard: { text: "你吃饭了吗？", pinyin: "nǐ chī fàn le ma?" },
        dialects: {
          "zh-CN-northeast": { text: "你造饭了没？", pinyin: "nǐ zào fàn le méi?" },
          "zh-CN-sichuan": { text: "你吃了没有？", pinyin: "nǐ chī le méi yǒu?" },
          "zh-CN-henan": { text: "你喝汤了没？", pinyin: "nǐ hē tāng le méi?" },
          "zh-CN-shandong": { text: "你用饭了吗？", pinyin: "nǐ yòng fàn le ma?" },
        },
      },
    ],
  },
]

export function DialectPhrases() {
  const [selectedCategory, setSelectedCategory] = useState(0)
  const [currentPhrase, setCurrentPhrase] = useState(0)
  const [showComparison, setShowComparison] = useState(true)
  const {
    selectedDialects,
    supportedDialects,
    playPronunciation,
    isPlaying,
    currentlyPlaying,
    currentDialect,
    playBothDialects,
  } = useDialect()
  const { t } = useI18n()
  const containerRef = useRef<HTMLDivElement | null>(null)

  const category = dialectPhrases[selectedCategory]
  const phrase = category.phrases[currentPhrase]

  const getDialectName = (code: string) => supportedDialects.find((d) => d.code === code)?.name || code
  const getDialectRegion = (code: string) => supportedDialects.find((d) => d.code === code)?.region || ""

  const handlePlayStandard = async () => {
    await playPronunciation(phrase.standard.text, "zh-CN")
  }

  const handlePlayDialect = async (dialectCode: string) => {
    const dialectVersion = phrase.dialects[dialectCode]
    if (dialectVersion) {
      await playPronunciation(dialectVersion.text, dialectCode)
    }
  }

  const playStandardThenSelectedDialects = async () => {
    await playPronunciation(phrase.standard.text, "zh-CN")
    const sel = selectedDialects.filter((d) => d !== "zh-CN")
    for (const d of sel) {
      await playBothDialects(phrase.standard.text, d)
    }
  }

  const nextPhrase = () => {
    if (currentPhrase < category.phrases.length - 1) setCurrentPhrase(currentPhrase + 1)
    else {
      setCurrentPhrase(0)
      setSelectedCategory((selectedCategory + 1) % dialectPhrases.length)
    }
  }

  const prevPhrase = () => {
    if (currentPhrase > 0) setCurrentPhrase(currentPhrase - 1)
    else {
      const prevCategoryIndex = selectedCategory === 0 ? dialectPhrases.length - 1 : selectedCategory - 1
      setSelectedCategory(prevCategoryIndex)
      setCurrentPhrase(dialectPhrases[prevCategoryIndex].phrases.length - 1)
    }
  }

  return (
    <div className="space-y-6" aria-live="polite">
      <MiniDictionary containerRef={containerRef} />

      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">{t("dialectPhrases")}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {dialectPhrases.map((cat, index) => (
          <Button
            key={index}
            variant={selectedCategory === index ? "default" : "outline"}
            onClick={() => {
              setSelectedCategory(index)
              setCurrentPhrase(0)
            }}
            className="h-auto p-4"
            aria-pressed={selectedCategory === index}
          >
            <div className="text-center">
              <div className="text-3xl mb-2">{cat.icon}</div>
              <div className="font-semibold">{cat.category}</div>
              <div className="text-sm text-gray-600">{cat.phrases.length} {t("phrasesLower")}</div>
            </div>
          </Button>
        ))}
      </div>

      <Card className="max-w-4xl mx-auto" ref={containerRef as any}>
        <CardHeader className="text-center">
          <div className="text-4xl mb-4">{category.icon}</div>
          <CardTitle className="text-xl mb-2">{category.category}</CardTitle>
          <div className="text-lg text-gray-600 mb-4">{phrase.english}</div>
          <div className="flex justify-center">
            <Button
              onClick={playStandardThenSelectedDialects}
              disabled={isPlaying}
              className="flex items-center gap-2"
              aria-label={t("playStdThenSelectedDialects")}
            >
              <ArrowRightLeft className="h-4 w-4" />
              {t("playStdThenSelectedDialects")}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Card className="bg-blue-50 border-2 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-blue-600">{t("standardMandarin")}</Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-red-600">{phrase.standard.text}</span>
                    <span className="text-lg text-gray-600">{phrase.standard.pinyin}</span>
                  </div>
                  {currentlyPlaying === phrase.standard.text && currentDialect === "zh-CN" && (
                    <div className="mt-1 text-xs text-gray-500">
                      {t("playingDialect")}: zh-CN
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={handlePlayStandard} disabled={isPlaying} aria-label={t("standardMandarin")}>
                  <Volume2
                    className={`h-5 w-5 ${currentlyPlaying === phrase.standard.text && currentDialect === "zh-CN" ? "text-blue-600" : ""}`}
                  />
                </Button>
              </div>
            </CardContent>
          </Card>

          {showComparison && (
            <div className="space-y-3">
              <h4 className="font-semibold text-lg">{t("dialectCompare")}</h4>
              {Object.entries(phrase.dialects)
                .filter(([code]) => selectedDialects.includes(code))
                .map(([dialectCode, dialectVersion]) => {
                  const dialectName = getDialectName(dialectCode)
                  const dialectRegion = getDialectRegion(dialectCode)
                  const isPlayingThis = currentlyPlaying === dialectVersion.text && currentDialect === dialectCode

                  return (
                    <Card key={dialectCode} className={`${isPlayingThis ? "ring-2 ring-green-500 bg-green-50" : "bg-gray-50"}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {dialectRegion}
                              </Badge>
                              <span className="font-medium">{dialectName}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-2xl font-bold text-red-600">{dialectVersion.text}</span>
                              <span className="text-lg text-gray-600">{dialectVersion.pinyin}</span>
                            </div>
                            {isPlayingThis && <div className="mt-1 text-xs text-gray-500">{t("playingDialect")}: {dialectCode}</div>}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePlayDialect(dialectCode)}
                            disabled={isPlaying}
                            aria-label={`Play ${dialectName}`}
                          >
                            <Volume2 className={`h-5 w-5 ${isPlayingThis ? "text-green-600" : ""}`} />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
            </div>
          )}

          <div className="flex justify-between items-center pt-4">
            <Button variant="outline" onClick={prevPhrase}>
              {t("previous")}
            </Button>
            <div className="text-center">
              <div className="text-sm text-gray-600">
                {currentPhrase + 1} / {category.phrases.length}
              </div>
              <div className="text-xs text-gray-500">
                Category {selectedCategory + 1} / {dialectPhrases.length}
              </div>
            </div>
            <Button variant="outline" onClick={nextPhrase}>
              {t("next")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
