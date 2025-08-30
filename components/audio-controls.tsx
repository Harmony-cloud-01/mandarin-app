"use client";

import { Badge } from "@/components/ui/badge";
import { VolumeX, Headphones, Mic2 } from "lucide-react";
import { useDialect } from "@/hooks/use-dialect";
import { useI18n } from "./i18n-provider";

export function AudioControls() {
  const { t } = useI18n();
  const { playPronunciation, stopAudio, isPlaying } = useDialect();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant="secondary">{t("currentDialect")}</Badge>
        <Button variant="ghost" onClick={stopAudio} disabled={!isPlaying}>
          {isPlaying ? <VolumeX className="h-4 w-4" /> : <Headphones className="h-4 w-4" />}
        </Button>
      </div>
      <div className="flex items-center justify-between">
        <Badge variant="secondary">{t("pronunciation")}</Badge>
        <Button variant="ghost" onClick={() => playPronunciation("测试")}>
          <Mic2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
