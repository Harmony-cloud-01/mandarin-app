"use client"

import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Volume2, Plus, Shuffle, RefreshCcw } from 'lucide-react'
import { useDialect } from "./dialect-provider"
import { useI18n } from "./i18n-provider"
import { useSrs } from "@/hooks/use-srs"
import { logEvent } from "@/utils/activity-log"

interface RuralWord {
  id: number
  chinese: string
  pinyin: string
  english: string
  category: string
  icon: string
  difficulty: "Basic" | "Intermediate" | "Advanced"
  context: string
}

// DATA: Extended (20 per category). Truncated comments removed for brevity.
const ruralVocabulary: RuralWord[] = [
  // Agriculture (20)
  { id: 1001, chinese: "种地", pinyin: "zhòng dì", english: "Farm the land", category: "Agriculture", icon: "🌾", difficulty: "Basic", context: "春天要种地了 (Spring is time to farm)" },
  { id: 1002, chinese: "播种", pinyin: "bō zhǒng", english: "Sow seeds", category: "Agriculture", icon: "🌾", difficulty: "Basic", context: "今天在地里播种玉米 (Sow corn in the field today)" },
  { id: 1003, chinese: "施肥", pinyin: "shī féi", english: "Apply fertilizer", category: "Agriculture", icon: "🌾", difficulty: "Basic", context: "给小麦施一次底肥 (Apply base fertilizer to wheat)" },
  { id: 1004, chinese: "灌溉", pinyin: "guàn gài", english: "Irrigate", category: "Agriculture", icon: "🌾", difficulty: "Intermediate", context: "庄稼干了需要灌溉 (Irrigation is needed when the crops are dry)" },
  { id: 1005, chinese: "除草", pinyin: "chú cǎo", english: "Weed removal", category: "Agriculture", icon: "🌾", difficulty: "Basic", context: "夏天草长得快要除草 (Weeds grow fast in summer; remove them)" },
  { id: 1006, chinese: "松土", pinyin: "sōng tǔ", english: "Loosen soil", category: "Agriculture", icon: "🌾", difficulty: "Intermediate", context: "松土让根系更好呼吸 (Loosening soil helps roots breathe)" },
  { id: 1007, chinese: "插秧", pinyin: "chā yāng", english: "Transplant rice seedlings", category: "Agriculture", icon: "🌾", difficulty: "Intermediate", context: "插秧要快手齐步 (Transplant rice seedlings quickly and evenly)" },
  { id: 1008, chinese: "打药", pinyin: "dǎ yào", english: "Spray pesticide", category: "Agriculture", icon: "🌾", difficulty: "Intermediate", context: "病虫害多了要打药 (Spray when pests appear)" },
  { id: 1009, chinese: "收割", pinyin: "shōu gē", english: "Harvest", category: "Agriculture", icon: "🌾", difficulty: "Basic", context: "秋天是收割的季节 (Autumn is harvest season)" },
  { id: 1010, chinese: "晾晒", pinyin: "liàng shài", english: "Sun-dry", category: "Agriculture", icon: "🌾", difficulty: "Basic", context: "把玉米摊开放在院里晾晒 (Spread corn in the yard to dry)" },
  { id: 1011, chinese: "脱粒", pinyin: "tuō lì", english: "Thresh", category: "Agriculture", icon: "🌾", difficulty: "Intermediate", context: "收完麦子要脱粒 (Thresh the wheat after harvest)" },
  { id: 1012, chinese: "储粮", pinyin: "chǔ liáng", english: "Store grain", category: "Agriculture", icon: "🌾", difficulty: "Intermediate", context: "把粮食装进粮仓储存 (Store grain in the granary)" },
  { id: 1013, chinese: "轮作", pinyin: "lún zuò", english: "Crop rotation", category: "Agriculture", icon: "🌾", difficulty: "Advanced", context: "轮作能保护土壤肥力 (Rotation preserves soil fertility)" },
  { id: 1014, chinese: "秧苗", pinyin: "yāng miáo", english: "Seedling", category: "Agriculture", icon: "🌾", difficulty: "Basic", context: "秧苗长得很壮 (The seedlings look strong)" },
  { id: 1015, chinese: "犁地", pinyin: "lí dì", english: "Plow the field", category: "Agriculture", icon: "🌾", difficulty: "Basic", context: "春耕前先犁地 (Plow before spring planting)" },
  { id: 1016, chinese: "整地", pinyin: "zhěng dì", english: "Prepare the field", category: "Agriculture", icon: "🌾", difficulty: "Intermediate", context: "整地要把土块打碎 (Break clods while preparing fields)" },
  { id: 1017, chinese: "测土", pinyin: "cè tǔ", english: "Test soil", category: "Agriculture", icon: "🌾", difficulty: "Advanced", context: "测土配方施肥更科学 (Soil testing guides fertilization)" },
  { id: 1018, chinese: "盖膜", pinyin: "gài mó", english: "Mulch with film", category: "Agriculture", icon: "🌾", difficulty: "Intermediate", context: "盖膜能保墒增温 (Mulch keeps moisture and warms soil)" },
  { id: 1019, chinese: "大棚", pinyin: "dà péng", english: "Greenhouse", category: "Agriculture", icon: "🌾", difficulty: "Intermediate", context: "大棚里种菜更早上市 (Greenhouse vegetables reach market earlier)" },
  { id: 1020, chinese: "授粉", pinyin: "shòu fěn", english: "Pollinate", category: "Agriculture", icon: "🌾", difficulty: "Advanced", context: "果树开花要注意授粉 (Ensure pollination when fruit trees bloom)" },

  // Daily Life (20)
  { id: 2001, chinese: "赶集", pinyin: "gǎn jí", english: "Go to market", category: "Daily Life", icon: "🏠", difficulty: "Basic", context: "今天赶集买东西 (Go to market today to buy things)" },
  { id: 2002, chinese: "做饭", pinyin: "zuò fàn", english: "Cook", category: "Daily Life", icon: "🏠", difficulty: "Basic", context: "中午在家做饭 (Cook lunch at home)" },
  { id: 2003, chinese: "生火", pinyin: "shēng huǒ", english: "Light a fire", category: "Daily Life", icon: "🏠", difficulty: "Basic", context: "冬天生火取暖 (Light a fire to keep warm in winter)" },
  { id: 2004, chinese: "打水", pinyin: "dǎ shuǐ", english: "Fetch water", category: "Daily Life", icon: "🏠", difficulty: "Basic", context: "去井里打水 (Fetch water from the well)" },
  { id: 2005, chinese: "洗衣", pinyin: "xǐ yī", english: "Wash clothes", category: "Daily Life", icon: "🏠", difficulty: "Basic", context: "在河边洗衣服 (Wash clothes by the river)" },
  { id: 2006, chinese: "扫地", pinyin: "sǎo dì", english: "Sweep the floor", category: "Daily Life", icon: "🏠", difficulty: "Basic", context: "每天早上扫院子 (Sweep the yard every morning)" },
  { id: 2007, chinese: "劈柴", pinyin: "pī chái", english: "Chop firewood", category: "Daily Life", icon: "🏠", difficulty: "Intermediate", context: "下午去劈柴烧火 (Chop firewood for cooking)" },
  { id: 2008, chinese: "晾衣", pinyin: "liàng yī", english: "Hang clothes to dry", category: "Daily Life", icon: "🏠", difficulty: "Basic", context: "把衣服晾在院里 (Hang clothes in the yard)" },
  { id: 2009, chinese: "晒被子", pinyin: "shài bèi zi", english: "Sun quilts", category: "Daily Life", icon: "🏠", difficulty: "Basic", context: "晴天晒晒被子 (Sun the quilts on a clear day)" },
  { id: 2010, chinese: "午休", pinyin: "wǔ xiū", english: "Take a nap", category: "Daily Life", icon: "🏠", difficulty: "Basic", context: "中午回家午休一会儿 (Take a short nap at noon)" },
  { id: 2011, chinese: "看孩子", pinyin: "kān hái zi", english: "Watch the kids", category: "Daily Life", icon: "🏠", difficulty: "Basic", context: "奶奶在家看孩子 (Grandma watches the kids at home)" },
  { id: 2012, chinese: "修房", pinyin: "xiū fáng", english: "Repair the house", category: "Daily Life", icon: "🏠", difficulty: "Intermediate", context: "下个月修房补漏 (Fix roof leaks next month)" },
  { id: 2013, chinese: "挑担", pinyin: "tiāo dàn", english: "Carry with a shoulder pole", category: "Daily Life", icon: "🏠", difficulty: "Intermediate", context: "挑担去地里送菜苗 (Carry seedlings to the field)" },
  { id: 2014, chinese: "做手工", pinyin: "zuò shǒu gōng", english: "Do handicrafts", category: "Daily Life", icon: "🏠", difficulty: "Basic", context: "晚上做点儿手工活 (Do some handicrafts in the evening)" },
  { id: 2015, chinese: "拜访", pinyin: "bài fǎng", english: "Pay a visit", category: "Daily Life", icon: "🏠", difficulty: "Basic", context: "去村里拜访亲戚 (Visit relatives in the village)" },
  { id: 2016, chinese: "拉家常", pinyin: "lā jiā cháng", english: "Chat (small talk)", category: "Daily Life", icon: "🏠", difficulty: "Basic", context: "在门口拉会儿家常 (Chit-chat at the gate)" },
  { id: 2017, chinese: "早饭", pinyin: "zǎo fàn", english: "Breakfast", category: "Daily Life", icon: "🏠", difficulty: "Basic", context: "早饭吃玉米粥 (Have corn porridge for breakfast)" },
  { id: 2018, chinese: "晚饭", pinyin: "wǎn fàn", english: "Dinner", category: "Daily Life", icon: "🏠", difficulty: "Basic", context: "晚饭全家一起吃 (Family dinner together)" },
  { id: 2019, chinese: "买盐", pinyin: "mǎi yán", english: "Buy salt", category: "Daily Life", icon: "🏠", difficulty: "Basic", context: "顺路买包盐 (Buy a pack of salt on the way)" },
  { id: 2020, chinese: "缝衣服", pinyin: "féng yī fu", english: "Sew clothes", category: "Daily Life", icon: "🏠", difficulty: "Intermediate", context: "奶奶帮我缝衣服 (Grandma helps me sew clothes)" },

  // Community (20)
  { id: 3001, chinese: "邻居", pinyin: "lín jū", english: "Neighbor", category: "Community", icon: "👥", difficulty: "Basic", context: "邻居来借工具 (Neighbor comes to borrow tools)" },
  { id: 3002, chinese: "村委会", pinyin: "cūn wěi huì", english: "Village committee", category: "Community", icon: "👥", difficulty: "Intermediate", context: "村委会发出通知 (Village committee issued a notice)" },
  { id: 3003, chinese: "互助", pinyin: "hù zhù", english: "Mutual help", category: "Community", icon: "👥", difficulty: "Basic", context: "忙不过来大家互助 (Help each other when busy)" },
  { id: 3004, chinese: "借工具", pinyin: "jiè gōng jù", english: "Borrow tools", category: "Community", icon: "👥", difficulty: "Basic", context: "去隔壁借把锄头 (Borrow a hoe from next door)" },
  { id: 3005, chinese: "打招呼", pinyin: "dǎ zhāo hu", english: "Greet", category: "Community", icon: "👥", difficulty: "Basic", context: "在路上互相打招呼 (Greet each other on the road)" },
  { id: 3006, chinese: "通知", pinyin: "tōng zhī", english: "Notice", category: "Community", icon: "👥", difficulty: "Basic", context: "村里发了新的通知 (A new notice was posted in the village)" },
  { id: 3007, chinese: "开会", pinyin: "kāi huì", english: "Hold a meeting", category: "Community", icon: "👥", difficulty: "Basic", context: "晚上在村部开会 (Meeting at the village office tonight)" },
  { id: 3008, chinese: "修路", pinyin: "xiū lù", english: "Repair the road", category: "Community", icon: "👥", difficulty: "Intermediate", context: "大家一起修村道 (Everyone repairs the village road together)" },
  { id: 3009, chinese: "看望", pinyin: "kàn wàng", english: "Visit (care)", category: "Community", icon: "👥", difficulty: "Basic", context: "去看望生病的老人 (Visit an elderly person who is ill)" },
  { id: 3010, chinese: "帮忙", pinyin: "bāng máng", english: "Help out", category: "Community", icon: "👥", difficulty: "Basic", context: "邻里之间互相帮忙 (Neighbors help each other)" },
  { id: 3011, chinese: "合作社", pinyin: "hé zuò shè", english: "Cooperative", category: "Community", icon: "👥", difficulty: "Intermediate", context: "把粮食卖给合作社 (Sell grain to the cooperative)" },
  { id: 3012, chinese: "志愿者", pinyin: "zhì yuàn zhě", english: "Volunteer", category: "Community", icon: "👥", difficulty: "Intermediate", context: "青年当志愿者服务 (Young people volunteer to serve)" },
  { id: 3013, chinese: "敬老", pinyin: "jìng lǎo", english: "Respect the elderly", category: "Community", icon: "👥", difficulty: "Basic", context: "村里有敬老活动 (There is a respect-for-the-elderly event)" },
  { id: 3014, chinese: "劳动", pinyin: "láo dòng", english: "Labor", category: "Community", icon: "👥", difficulty: "Basic", context: "今天组织义务劳动 (Voluntary labor today)" },
  { id: 3015, chinese: "文艺表演", pinyin: "wén yì biǎo yǎn", english: "Cultural performance", category: "Community", icon: "👥", difficulty: "Intermediate", context: "晚上广场有文艺表演 (Cultural performance on the square tonight)" },
  { id: 3016, chinese: "红白喜事", pinyin: "hóng bái xǐ shì", english: "Weddings and funerals", category: "Community", icon: "👥", difficulty: "Intermediate", context: "村里有人办红白喜事 (A ceremony is held in the village)" },
  { id: 3017, chinese: "调解", pinyin: "tiáo jiě", english: "Mediate", category: "Community", icon: "👥", difficulty: "Intermediate", context: "村干部出面调解矛盾 (Cadres mediate disputes)" },
  { id: 3018, chinese: "联防", pinyin: "lián fáng", english: "Joint patrol", category: "Community", icon: "👥", difficulty: "Intermediate", context: "夜间联防巡逻 (Night patrol for safety)" },
  { id: 3019, chinese: "慰问", pinyin: "wèi wèn", english: "Convey regards", category: "Community", icon: "👥", difficulty: "Intermediate", context: "节日慰问困难家庭 (Holiday visits to families in need)" },
  { id: 3020, chinese: "打电话", pinyin: "dǎ diàn huà", english: "Make a phone call", category: "Community", icon: "👥", difficulty: "Basic", context: "有事给村部打电话 (Call the village office if needed)" },

  // Weather (20)
  { id: 4001, chinese: "下雨", pinyin: "xià yǔ", english: "Raining", category: "Weather", icon: "🌤️", difficulty: "Basic", context: "下雨了，庄稼有水喝 (It's raining, crops have water)" },
  { id: 4002, chinese: "出太阳", pinyin: "chū tài yáng", english: "Sunny", category: "Weather", icon: "🌤️", difficulty: "Basic", context: "今天出太阳晒晒粮 (Sunny today, dry some grain)" },
  { id: 4003, chinese: "刮风", pinyin: "guā fēng", english: "Windy", category: "Weather", icon: "🌤️", difficulty: "Basic", context: "刮大风注意防护 (Protect against strong winds)" },
  { id: 4004, chinese: "下雪", pinyin: "xià xuě", english: "Snowing", category: "Weather", icon: "🌤️", difficulty: "Basic", context: "下雪路滑要小心 (Be careful on snowy, slippery roads)" },
  { id: 4005, chinese: "打雷", pinyin: "dǎ léi", english: "Thunder", category: "Weather", icon: "🌤️", difficulty: "Basic", context: "打雷了别在树下躲 (Don't hide under trees in thunder)" },
  { id: 4006, chinese: "起雾", pinyin: "qǐ wù", english: "Foggy", category: "Weather", icon: "🌤️", difficulty: "Basic", context: "清早起雾看不远 (Morning fog limits visibility)" },
  { id: 4007, chinese: "霜冻", pinyin: "shuāng dòng", english: "Frost", category: "Weather", icon: "🌤️", difficulty: "Intermediate", context: "霜冻伤苗要防护 (Protect seedlings from frost)" },
  { id: 4008, chinese: "干旱", pinyin: "gān hàn", english: "Drought", category: "Weather", icon: "🌤️", difficulty: "Intermediate", context: "今年干旱，需要浇水 (Drought this year, need watering)" },
  { id: 4009, chinese: "洪水", pinyin: "hóng shuǐ", english: "Flood", category: "Weather", icon: "🌤️", difficulty: "Intermediate", context: "洪水来了快转移 (Evacuate quickly when flood comes)" },
  { id: 4010, chinese: "高温", pinyin: "gāo wēn", english: "Heatwave", category: "Weather", icon: "🌤️", difficulty: "Intermediate", context: "高温天要避开中午干活 (Avoid noon labor during heatwaves)" },
  { id: 4011, chinese: "寒潮", pinyin: "hán cháo", english: "Cold snap", category: "Weather", icon: "🌤️", difficulty: "Intermediate", context: "寒潮来临要添衣 (Put on more clothes when cold snap arrives)" },
  { id: 4012, chinese: "降温", pinyin: "jiàng wēn", english: "Temperature drops", category: "Weather", icon: "🌤️", difficulty: "Basic", context: "明天降温注意保暖 (Temperature drops tomorrow, keep warm)" },
  { id: 4013, chinese: "升温", pinyin: "shēng wēn", english: "Temperature rises", category: "Weather", icon: "🌤️", difficulty: "Basic", context: "周末升温适合晾晒 (Warming this weekend; good for drying)" },
  { id: 4014, chinese: "连阴天", pinyin: "lián yīn tiān", english: "Consecutive cloudy days", category: "Weather", icon: "🌤️", difficulty: "Intermediate", context: "连阴天晒不干粮 (Grain won't dry in continuous overcast)" },
  { id: 4015, chinese: "冰雹", pinyin: "bīng báo", english: "Hail", category: "Weather", icon: "🌤️", difficulty: "Intermediate", context: "有冰雹预警要防护 (Hail warning—protect crops)" },
  { id: 4016, chinese: "彩虹", pinyin: "cǎi hóng", english: "Rainbow", category: "Weather", icon: "🌤️", difficulty: "Basic", context: "雨后天边有彩虹 (A rainbow appears after rain)" },
  { id: 4017, chinese: "湿度", pinyin: "shī dù", english: "Humidity", category: "Weather", icon: "🌤️", difficulty: "Intermediate", context: "湿度大粮食易返潮 (High humidity re-wets grain)" },
  { id: 4018, chinese: "天气预报", pinyin: "tiān qì yù bào", english: "Weather forecast", category: "Weather", icon: "🌤️", difficulty: "Basic", context: "先看天气预报再安排活 (Check the forecast before planning)" },
  { id: 4019, chinese: "风向", pinyin: "fēng xiàng", english: "Wind direction", category: "Weather", icon: "🌤️", difficulty: "Intermediate", context: "打药要看风向 (Mind wind direction when spraying)" },
  { id: 4020, chinese: "气压", pinyin: "qì yā", english: "Air pressure", category: "Weather", icon: "🌤️", difficulty: "Advanced", context: "气压变化影响天气 (Pressure changes affect weather)" },

  // Livestock (20)
  { id: 5001, chinese: "养鸡", pinyin: "yǎng jī", english: "Raise chickens", category: "Livestock", icon: "🐄", difficulty: "Basic", context: "家里养鸡下蛋 (Raise chickens for eggs)" },
  { id: 5002, chinese: "养猪", pinyin: "yǎng zhū", english: "Raise pigs", category: "Livestock", icon: "��", difficulty: "Basic", context: "喂猪要定时定量 (Feed pigs on schedule)" },
  { id: 5003, chinese: "养牛", pinyin: "yǎng niú", english: "Raise cattle", category: "Livestock", icon: "🐄", difficulty: "Basic", context: "村里有几头奶牛 (There are some dairy cows in the village)" },
  { id: 5004, chinese: "挤奶", pinyin: "jǐ nǎi", english: "Milk (a cow)", category: "Livestock", icon: "🐄", difficulty: "Intermediate", context: "每天早晚各挤一次奶 (Milk twice a day)" },
  { id: 5005, chinese: "喂草", pinyin: "wèi cǎo", english: "Feed hay", category: "Livestock", icon: "🐄", difficulty: "Basic", context: "冬天多喂点草料 (Feed more hay in winter)" },
  { id: 5006, chinese: "清圈", pinyin: "qīng juàn", english: "Clean the pen", category: "Livestock", icon: "🐄", difficulty: "Basic", context: "每天清圈保持卫生 (Clean pens daily for hygiene)" },
  { id: 5007, chinese: "放牛", pinyin: "fàng niú", english: "Graze cattle", category: "Livestock", icon: "🐄", difficulty: "Basic", context: "下午把牛赶去河边放 (Graze cattle by the river in the afternoon)" },
  { id: 5008, chinese: "打疫苗", pinyin: "dǎ yì miáo", english: "Vaccinate (animals)", category: "Livestock", icon: "🐄", difficulty: "Intermediate", context: "家畜要定期打疫苗 (Livestock need regular vaccinations)" },
  { id: 5009, chinese: "剪蹄", pinyin: "jiǎn tí", english: "Trim hooves", category: "Livestock", icon: "🐄", difficulty: "Advanced", context: "牛蹄长了要剪蹄 (Trim hooves when they get long)" },
  { id: 5010, chinese: "配种", pinyin: "pèi zhǒng", english: "Breeding", category: "Livestock", icon: "🐄", difficulty: "Advanced", context: "配种要选好时机 (Choose the right time for breeding)" },
  { id: 5011, chinese: "小牛", pinyin: "xiǎo niú", english: "Calf", category: "Livestock", icon: "🐄", difficulty: "Basic", context: "小牛出生要保暖 (Keep newborn calves warm)" },
  { id: 5012, chinese: "小猪", pinyin: "xiǎo zhū", english: "Piglet", category: "Livestock", icon: "🐄", difficulty: "Basic", context: "小猪要补铁防贫血 (Piglets need iron supplements)" },
  { id: 5013, chinese: "母鸡", pinyin: "mǔ jī", english: "Hen", category: "Livestock", icon: "🐄", difficulty: "Basic", context: "母鸡在下蛋 (The hen is laying eggs)" },
  { id: 5014, chinese: "公鸡", pinyin: "gōng jī", english: "Rooster", category: "Livestock", icon: "🐄", difficulty: "Basic", context: "公鸡每天打鸣 (The rooster crows daily)" },
  { id: 5015, chinese: "鸡舍", pinyin: "jī shè", english: "Chicken coop", category: "Livestock", icon: "🐄", difficulty: "Basic", context: "鸡舍要保持干燥 (Keep the coop dry)" },
  { id: 5016, chinese: "猪圈", pinyin: "zhū juàn", english: "Pigsty", category: "Livestock", icon: "🐄", difficulty: "Basic", context: "猪圈要勤打扫 (Clean the pigsty often)" },
  { id: 5017, chinese: "牛棚", pinyin: "niú péng", english: "Cowshed", category: "Livestock", icon: "🐄", difficulty: "Basic", context: "牛棚要通风 (Ventilate the cowshed)" },
  { id: 5018, chinese: "饲料", pinyin: "sì liào", english: "Feed (fodder)", category: "Livestock", icon: "🐄", difficulty: "Basic", context: "把饲料拌匀再喂 (Mix the feed well before feeding)" },
  { id: 5019, chinese: "接生", pinyin: "jiē shēng", english: "Deliver (animal)", category: "Livestock", icon: "🐄", difficulty: "Advanced", context: "母牛下崽要接生 (Assist calving)" },
  { id: 5020, chinese: "看兽医", pinyin: "kàn shòu yī", english: "See the vet", category: "Livestock", icon: "🐄", difficulty: "Intermediate", context: "牲口生病找兽医 (See the vet if livestock are ill)" },

  // Farm Equipment (20)
  { id: 6001, chinese: "拖拉机", pinyin: "tuō lā jī", english: "Tractor", category: "Farm Equipment", icon: "🚜", difficulty: "Basic", context: "用拖拉机耕地 (Use a tractor to plow)" },
  { id: 6002, chinese: "犁", pinyin: "lí", english: "Plow", category: "Farm Equipment", icon: "🚜", difficulty: "Basic", context: "把犁装在拖拉机上 (Attach the plow to the tractor)" },
  { id: 6003, chinese: "耙", pinyin: "pá", english: "Harrow", category: "Farm Equipment", icon: "🚜", difficulty: "Intermediate", context: "耙地把土弄细 (Harrow the soil finer)" },
  { id: 6004, chinese: "播种机", pinyin: "bō zhǒng jī", english: "Seeder", category: "Farm Equipment", icon: "🚜", difficulty: "Intermediate", context: "用播种机下种更均匀 (Seeder makes planting even)" },
  { id: 6005, chinese: "收割机", pinyin: "shōu gē jī", english: "Harvester", category: "Farm Equipment", icon: "🚜", difficulty: "Intermediate", context: "收割机下地收麦子 (Harvester reaps wheat in field)" },
  { id: 6006, chinese: "脱粒机", pinyin: "tuō lì jī", english: "Thresher", category: "Farm Equipment", icon: "🚜", difficulty: "Intermediate", context: "脱粒机把麦粒打出来 (Thresher separates grain)" },
  { id: 6007, chinese: "水泵", pinyin: "shuǐ bèng", english: "Water pump", category: "Farm Equipment", icon: "🚜", difficulty: "Basic", context: "用水泵灌溉田地 (Use a pump to irrigate fields)" },
  { id: 6008, chinese: "喷雾器", pinyin: "pēn wù qì", english: "Sprayer", category: "Farm Equipment", icon: "🚜", difficulty: "Intermediate", context: "背上喷雾器去打药 (Wear a sprayer to apply pesticide)" },
  { id: 6009, chinese: "镰刀", pinyin: "lián dāo", english: "Sickle", category: "Farm Equipment", icon: "🚜", difficulty: "Basic", context: "用镰刀割草 (Cut grass with a sickle)" },
  { id: 6010, chinese: "锄头", pinyin: "chú tou", english: "Hoe", category: "Farm Equipment", icon: "🚜", difficulty: "Basic", context: "拿锄头去地里除草 (Use a hoe to weed in fields)" },
  { id: 6011, chinese: "铁锹", pinyin: "tiě qiāo", english: "Shovel", category: "Farm Equipment", icon: "🚜", difficulty: "Basic", context: "用铁锹装土 (Shovel soil)" },
  { id: 6012, chinese: "独轮车", pinyin: "dú lún chē", english: "Wheelbarrow", category: "Farm Equipment", icon: "🚜", difficulty: "Basic", context: "用独轮车运粮 (Carry grain with a wheelbarrow)" },
  { id: 6013, chinese: "手推车", pinyin: "shǒu tuī chē", english: "Handcart", category: "Farm Equipment", icon: "🚜", difficulty: "Basic", context: "手推车拉化肥 (Carry fertilizer by handcart)" },
  { id: 6014, chinese: "粮袋", pinyin: "liáng dài", english: "Grain sack", category: "Farm Equipment", icon: "🚜", difficulty: "Basic", context: "把粮食装进粮袋 (Put grain into sacks)" },
  { id: 6015, chinese: "秤", pinyin: "chèng", english: "Scale", category: "Farm Equipment", icon: "🚜", difficulty: "Basic", context: "用秤称一下重量 (Weigh it with a scale)" },
  { id: 6016, chinese: "绳子", pinyin: "shéng zi", english: "Rope", category: "Farm Equipment", icon: "🚜", difficulty: "Basic", context: "用绳子捆住稻草 (Tie straw with rope)" },
  { id: 6017, chinese: "篮子", pinyin: "lán zi", english: "Basket", category: "Farm Equipment", icon: "🚜", difficulty: "Basic", context: "篮子里装鸡蛋 (Put eggs in the basket)" },
  { id: 6018, chinese: "种子箱", pinyin: "zhǒng zi xiāng", english: "Seed box", category: "Farm Equipment", icon: "🚜", difficulty: "Intermediate", context: "把种子放进种子箱 (Put seeds in the seed box)" },
  { id: 6019, chinese: "防护服", pinyin: "fáng hù fú", english: "Protective suit", category: "Farm Equipment", icon: "🚜", difficulty: "Intermediate", context: "打药要穿防护服 (Wear protective suit when spraying)" },
  { id: 6020, chinese: "手套", pinyin: "shǒu tào", english: "Gloves", category: "Farm Equipment", icon: "🚜", difficulty: "Basic", context: "干活戴上手套 (Wear gloves for work)" },
]

const categories = [
  { name: "Agriculture", icon: "🌾" },
  { name: "Daily Life", icon: "🏠" },
  { name: "Community", icon: "👥" },
  { name: "Weather", icon: "🌤️" },
  { name: "Livestock", icon: "🐄" },
  { name: "Farm Equipment", icon: "🚜" },
]

// Hardcoded category images per v0 rules (no string concatenation for placeholders)
const categoryImageSrc: Record<string, string> = {
  "Agriculture": "/placeholder-altgr.png",
  "Daily Life": "/rural-village-home-yard.png",
  "Community": "/village-gathering-square.png",
  "Weather": "/farmland-sky.png",
  "Livestock": "/farm-animals-chickens-cattle.png",
  "Farm Equipment": "/farm-tools-tractor-implements.png",
}

type StartDifficulty = "hard" | "normal" | "easy"

export function RuralVocabulary() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [randomMode, setRandomMode] = useState(false)
  const [order, setOrder] = useState<number[]>([])
  const [pos, setPos] = useState(0)
  const [startDiff, setStartDiff] = useState<StartDifficulty>("normal")

  const { playPronunciation, isPlaying, currentlyPlaying, currentDialect } = useDialect()
  const { t } = useI18n()
  const { addItem } = useSrs()

  const filteredWords = useMemo(
    () => (selectedCategory ? ruralVocabulary.filter((w) => w.category === selectedCategory) : ruralVocabulary),
    [selectedCategory]
  )

  // Build index order based on mode/category/length
  useEffect(() => {
    const base = Array.from({ length: filteredWords.length }, (_, i) => i)
    if (randomMode) {
      const shuffled = [...base]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      setOrder(shuffled)
    } else {
      setOrder(base)
    }
    setPos(0)
  }, [randomMode, selectedCategory, filteredWords.length])

  const word = filteredWords.length > 0 && order.length > 0 ? filteredWords[order[pos]] : null

  const next = () => {
    if (order.length === 0) return
    setPos((p) => Math.min(order.length - 1, p + 1))
  }
  const prev = () => {
    if (order.length === 0) return
    setPos((p) => Math.max(0, p - 1))
  }
  const reshuffle = () => {
    if (!randomMode) return
    const base = Array.from({ length: filteredWords.length }, (_, i) => i)
    const shuffled = [...base]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    setOrder(shuffled)
    setPos(0)
  }

  const handlePlayWord = async () => {
    if (!word) return
    await playPronunciation(word.chinese)
    ;(logEvent as any) && logEvent({ type: "audio.play", text: word.chinese, t: Date.now() })
  }
  const handlePlayContext = async () => {
    if (!word) return
    const chineseContext = word.context.split("(")[0].trim()
    await playPronunciation(chineseContext)
  }

  // Map chosen start difficulty to initial SRS box
  const initialBox = startDiff === "easy" ? 3 : startDiff === "normal" ? 2 : 1

  const addToReview = () => {
    if (!word) return
    addItem(word.chinese, "word", { initialBox })
  }

  return (
    <div className="space-y-6" aria-live="polite">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">{t("ruralVocabularyTitle")}</h2>
        <p className="text-gray-600">Rural Practical Vocabulary</p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          onClick={() => {
            setSelectedCategory(null)
          }}
          className="h-auto p-3"
          aria-pressed={selectedCategory === null}
        >
          <div className="text-center">
            <div className="text-2xl mb-1">📚</div>
            <div className="text-sm">{t("showAll")}</div>
          </div>
        </Button>
        {categories.map((category) => (
          <Button
            key={category.name}
            variant={selectedCategory === category.name ? "default" : "outline"}
            onClick={() => {
              setSelectedCategory(category.name)
            }}
            className="h-auto p-3"
            aria-pressed={selectedCategory === category.name}
            aria-label={`Filter ${category.name}`}
          >
            <div className="text-center">
              <div className="text-2xl mb-1">{category.icon}</div>
              <div className="text-sm">{category.name}</div>
            </div>
          </Button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={randomMode ? "default" : "outline"}
          size="sm"
          onClick={() => setRandomMode((v) => !v)}
          aria-pressed={randomMode}
          className={randomMode ? "bg-emerald-600 hover:bg-emerald-700" : ""}
        >
          <Shuffle className="h-4 w-4 mr-2" />
          {randomMode ? "Random: On" : "Random: Off"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={reshuffle}
          disabled={!randomMode || filteredWords.length < 2}
          aria-disabled={!randomMode || filteredWords.length < 2}
        >
          <RefreshCcw className="h-4 w-4 mr-2" />
          Reshuffle
        </Button>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-gray-600">Start difficulty for SRS:</span>
          <Button
            size="sm"
            variant={startDiff === "hard" ? "default" : "outline"}
            onClick={() => setStartDiff("hard")}
            aria-pressed={startDiff === "hard"}
          >
            Hard
          </Button>
          <Button
            size="sm"
            variant={startDiff === "normal" ? "default" : "outline"}
            onClick={() => setStartDiff("normal")}
            aria-pressed={startDiff === "normal"}
          >
            Normal
          </Button>
          <Button
            size="sm"
            variant={startDiff === "easy" ? "default" : "outline"}
            onClick={() => setStartDiff("easy")}
            aria-pressed={startDiff === "easy"}
          >
            Easy
          </Button>
        </div>
      </div>

      {/* Current Item Card */}
      <Card className="max-w-2xl mx-auto">
        {word && (
          <>
            {/* Category image banner */}
            <div className="relative w-full">
              <Image
                src={categoryImageSrc[word.category] || "/placeholder.svg?height=180&width=720&query=rural%20china"}
                alt={`Illustration for ${word.category}`}
                width={720}
                height={180}
                className="h-40 w-full object-cover rounded-t-md"
                priority
              />
            </div>

            <CardHeader className="text-center">
              <div className="text-6xl mb-3">{word.icon}</div>
              <CardTitle className="text-4xl font-bold text-red-600 mb-2">{word.chinese}</CardTitle>
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-xl text-gray-600">{word.pinyin}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePlayWord}
                  disabled={isPlaying}
                  aria-label="Play word"
                >
                  <Volume2 className={`h-5 w-5 ${currentlyPlaying === word.chinese ? "text-blue-600" : ""}`} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addToReview}
                  className="ml-2 inline-flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" /> Add to Review
                </Button>
              </div>
              {currentlyPlaying === word.chinese && currentDialect && (
                <div className="text-xs text-gray-500">
                  {'Playing dialect: '}{currentDialect}
                </div>
              )}
              <div className="text-lg text-gray-800 mb-2">{word.english}</div>
              <div className="flex items-center justify-center gap-2">
                <Badge className="mb-2">{word.category}</Badge>
                <Badge variant="outline" className="mb-2">{word.difficulty}</Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">
                  {t("practicalExample")}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePlayContext}
                    disabled={isPlaying}
                    aria-label="Play example"
                    className="ml-2 inline-flex items-center gap-2"
                  >
                    <Volume2 className="h-4 w-4" />
                  </Button>
                </h4>
                <p className="text-lg">{word.context}</p>
              </div>

              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  onClick={prev}
                  disabled={pos === 0}
                >
                  {t("previous")}
                </Button>
                <span className="text-sm text-gray-600">
                  {filteredWords.length > 0 ? `${pos + 1} / ${filteredWords.length}` : "0 / 0"}
                </span>
                <Button
                  variant="outline"
                  onClick={next}
                  disabled={pos >= (order.length - 1)}
                >
                  {t("next")}
                </Button>
              </div>
            </CardContent>
          </>
        )}
        {!word && (
          <CardContent className="p-6 text-center text-gray-600">
            No items found.
          </CardContent>
        )}
      </Card>
    </div>
  )
}
