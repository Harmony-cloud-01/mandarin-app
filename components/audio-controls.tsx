"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { VolumeX, Headphones, Mic2 } from 'lucide-react'
import { useDialect } from "./dialect-provider"
import { useI18n } from "./i18n-provider"

export function AudioControls() {
  const {
    playbackRate,
    setPlaybackRate,
    stopAudio,
    isPlaying,
    voices,
    preferredVoiceName,
    setPreferredVoiceName,
    speechSupported,
    hasChineseVoice,
  } = useDialect()
  const { t } = useI18n()

  return (
    <Card className="mb-4" aria-live="polite">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Headphones className="h-5 w-5" />
          {t("audioSettingsTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {!speechSupported && (
          <div className="rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
            {t("ttsNotSupported")}
          </div>
        )}
        {speechSupported && !hasChineseVoice && (
          <div className="rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
            {t("noChineseVoice")}
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{t("playbackSpeed")}</span>
          <Badge variant="outline">{playbackRate.toFixed(1)}x</Badge>
        </div>
        <Slider
          value={[playbackRate]}
          onValueChange={(v) => setPlaybackRate(v[0])}
          min={0.5}
          max={2.0}
          step={0.1}
          className="w-full"
          aria-label={t("playbackSpeed")}
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>{t("slow")} (0.5x)</span>
          <span>{t("normal")} (1.0x)</span>
          <span>{t("fast")} (2.0x)</span>
        </div>

        {speechSupported && voices.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm font-medium">{t("preferredVoice")}</span>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-auto pr-1">
              {voices.map((v) => (
                <Button
                  key={`${v.name}-${v.lang}`}
                  variant={preferredVoiceName === v.name ? "default" : "outline"}
                  onClick={() => setPreferredVoiceName(preferredVoiceName === v.name ? null : v.name)}
                  className="justify-start h-auto py-2"
                  aria-pressed={preferredVoiceName === v.name}
                  aria-label={`Select voice ${v.name} ${v.lang}`}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{v.name}</span>
                    <span className="text-xs opacity-70">{v.lang}</span>
                  </div>
                </Button>
              ))}
            </div>
            <div className="text-xs text-gray-500">
              {t("voiceAvailabilityTip")}
            </div>
          </div>
        )}

        {isPlaying && (
          <Button onClick={stopAudio} variant="outline" className="w-full flex items-center gap-2">
            <VolumeX className="h-4 w-4" />
            {t("stopAudio")}
          </Button>
        )}

        <div className="text-xs text-gray-500 flex items-center gap-2">
          <Mic2 className="h-3.5 w-3.5" />
          {t("androidTip")}
        </div>
      </CardContent>
    </Card>
  )
}
