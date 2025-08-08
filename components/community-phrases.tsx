"use client"

import { useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Volume2, Users, Heart, HandHeart } from 'lucide-react'
import { useDialect } from "./dialect-provider"
import { useI18n } from "./i18n-provider"
import { MiniDictionary } from "./mini-dictionary"

interface CommunityPhrase {
  chinese: string
  pinyin: string
  english: string
  situation: string
}
interface CommunityCategory {
  category: string
  icon: React.ReactNode
  color: string
  phrases: CommunityPhrase[]
}

const communityPhrases: CommunityCategory[] = [
  {
    category: "互相帮助 (Mutual Help)",
    icon: <HandHeart className="h-6 w-6" />,
    color: "bg-blue-100",
    phrases: [
      { chinese: "需要帮忙吗？", pinyin: "xū yào bāng máng ma?", english: "Do you need help?", situation: "When seeing neighbor working" },
      { chinese: "谢谢你的帮助", pinyin: "xiè xiè nǐ de bāng zhù", english: "Thank you for your help", situation: "After receiving help" },
      { chinese: "大家一起干活", pinyin: "dà jiā yī qǐ gān huó", english: "Let's work together", situation: "During harvest time" },
    ],
  },
  {
    category: "邻里问候 (Neighbor Greetings)",
    icon: <Users className="h-6 w-6" />,
    color: "bg-green-100",
    phrases: [
      { chinese: "早上好，老王", pinyin: "zǎo shang hǎo, lǎo wáng", english: "Good morning, Old Wang", situation: "Morning greeting to neighbor" },
      { chinese: "今天天气真好", pinyin: "jīn tiān tiān qì zhēn hǎo", english: "The weather is really nice today", situation: "Small talk about weather" },
      { chinese: "你家庄稼长得真好", pinyin: "nǐ jiā zhuāng jia zhǎng de zhēn hǎo", english: "Your crops are growing really well", situation: "Complimenting neighbor's farm" },
    ],
  },
  {
    category: "关心问候 (Caring Inquiries)",
    icon: <Heart className="h-6 w-6" />,
    color: "bg-pink-100",
    phrases: [
      { chinese: "身体怎么样？", pinyin: "shēn tǐ zěn me yàng?", english: "How is your health?", situation: "Asking about someone's wellbeing" },
      { chinese: "孩子们都好吗？", pinyin: "hái zi men dōu hǎo ma?", english: "Are the children all well?", situation: "Asking about family" },
      { chinese: "有什么困难吗？", pinyin: "yǒu shén me kùn nán ma?", english: "Are there any difficulties?", situation: "Offering support" },
    ],
  },
  {
    category: "集市交流 (Market Communication)",
    icon: <Users className="h-6 w-6" />,
    color: "bg-yellow-100",
    phrases: [
      { chinese: "这个多少钱一斤？", pinyin: "zhè gè duō shǎo qián yī jīn?", english: "How much per jin (500g)?", situation: "Asking price at market" },
      { chinese: "能便宜点吗？", pinyin: "néng pián yi diǎn ma?", english: "Can you make it cheaper?", situation: "Bargaining at market" },
      { chinese: "这是我家种的", pinyin: "zhè shì wǒ jiā zhòng de", english: "This is grown by my family", situation: "Selling own produce" },
    ],
  },
]

export function CommunityPhrases() {
  const [selectedCategory, setSelectedCategory] = useState(0)
  const [currentPhrase, setCurrentPhrase] = useState(0)
  const { playPronunciation, isPlaying, currentlyPlaying, currentDialect } = useDialect()
  const { t } = useI18n()
  const containerRef = useRef<HTMLDivElement | null>(null)

  const category = communityPhrases[selectedCategory]
  const phrase = category.phrases[currentPhrase]

  const handlePlayPhrase = async () => {
    await playPronunciation(phrase.chinese)
  }

  const nextPhrase = () => {
    if (currentPhrase < category.phrases.length - 1) setCurrentPhrase(currentPhrase + 1)
    else {
      setCurrentPhrase(0)
      setSelectedCategory((selectedCategory + 1) % communityPhrases.length)
    }
  }

  const prevPhrase = () => {
    if (currentPhrase > 0) setCurrentPhrase(currentPhrase - 1)
    else {
      const prevCat = selectedCategory === 0 ? communityPhrases.length - 1 : selectedCategory - 1
      setSelectedCategory(prevCat)
      setCurrentPhrase(communityPhrases[prevCat].phrases.length - 1)
    }
  }

  return (
    <div className="space-y-6" aria-live="polite">
      <MiniDictionary containerRef={containerRef} />

      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">{t("communityPhrasesTitle")}</h2>
      </div>

      {/* Category Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {communityPhrases.map((cat, index) => (
          <Button
            key={index}
            variant={selectedCategory === index ? "default" : "outline"}
            onClick={() => {
              setSelectedCategory(index)
              setCurrentPhrase(0)
            }}
            className={`h-auto p-4 ${cat.color}`}
            aria-pressed={selectedCategory === index}
          >
            <div className="flex items-center gap-3">
              {cat.icon}
              <div className="text-left">
                <div className="font-semibold">{cat.category}</div>
                <div className="text-sm text-gray-600">{cat.phrases.length} phrases</div>
              </div>
            </div>
          </Button>
        ))}
      </div>

      {/* Current Phrase */}
      <Card className={`${category.color} border-2`} ref={containerRef as any}>
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            {category.icon}
            <CardTitle className="text-xl">{category.category}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Card className="bg-white/90">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-red-600 mb-3">{phrase.chinese}</div>
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-lg text-gray-600">{phrase.pinyin}</span>
                <Button variant="ghost" size="sm" onClick={handlePlayPhrase} disabled={isPlaying} aria-label="Play phrase">
                  <Volume2 className={`h-5 w-5 ${currentlyPlaying === phrase.chinese ? "text-blue-600" : ""}`} />
                </Button>
              </div>
              {currentlyPlaying === phrase.chinese && currentDialect && (
                <div className="text-xs text-gray-500 mb-2">
                  {t("playingDialect")}: {currentDialect}
                </div>
              )}
              <div className="text-lg text-gray-800 mb-4">{phrase.english}</div>
              <Badge variant="outline" className="text-sm">
                使用场合: {phrase.situation}
              </Badge>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={prevPhrase}>
              {t("previous")}
            </Button>
            <div className="text-center">
              <div className="text-sm text-gray-600">
                {currentPhrase + 1} / {category.phrases.length}
              </div>
              <div className="text-xs text-gray-500">
                Category {selectedCategory + 1} / {communityPhrases.length}
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
