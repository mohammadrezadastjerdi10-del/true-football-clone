// Lightweight i18n for the game: English (en) and Persian (fa) with RTL
// support. UI text lives in the dictionary below; generated game news and
// match commentary read `save.lang` / the match language directly.

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Lang = "en" | "fa";

export const LANGS: Lang[] = ["en", "fa"];

const STORAGE_KEY = "tf-lang";

const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

/** Convert Western digits (and -) in a string to Persian digits. */
export function faDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]);
}

/** Format a number for a language (Persian digits for fa). */
export function num(lang: Lang, n: number): string {
  return lang === "fa" ? faDigits(n.toLocaleString("en-US")) : n.toLocaleString("en-US");
}

type Dict = Record<string, { en: string; fa: string }>;

const DICT: Dict = {
  // ---- language toggle ----
  "lang.toggle": { en: "Language", fa: "زبان" },
  "lang.en": { en: "English", fa: "انگلیسی" },
  "lang.fa": { en: "Persian", fa: "فارسی" },

  // ---- dashboard chrome ----
  "nav.overview": { en: "Overview", fa: "نمای کلی" },
  "nav.squad": { en: "Squad", fa: "تیم" },
  "nav.tactics": { en: "Tactics", fa: "تاکتیک" },
  "nav.training": { en: "Training", fa: "تمرین" },
  "nav.transfers": { en: "Transfers", fa: "نقل‌وانتقالات" },
  "nav.club": { en: "Club", fa: "باشگاه" },
  "hdr.week": { en: "Week", fa: "هفته" },
  "hdr.budget": { en: "Budget", fa: "بودجه" },
  "hdr.signout": { en: "Sign out", fa: "خروج" },
  "hdr.leagueLine": { en: "{league} · {label}", fa: "{league} · {label}" },

  // ---- sacked screen ----
  "sacked.title": { en: "The board has lost patience", fa: "هیئت‌مدیره صبرش را از دست داد" },
  "sacked.body": {
    en: "Your time at {club} is over. Every manager gets another chance — take a new job and write a better story.",
    fa: "زمان حضور شما در {club} به پایان رسید. هر مربی یک فرصت دیگر دارد — کار جدیدی قبول کنید و داستان بهتری بسازید.",
  },
  "sacked.newCareer": { en: "Start a new career", fa: "شروع یک مربی‌گری جدید" },

  // ---- overview ----
  "ov.position": { en: "Position", fa: "رتبه" },
  "ov.leagueLine": { en: "{league} · Season {label} · Week {week}", fa: "{league} · فصل {label} · هفته {week}" },
  "ov.cup": { en: "National Cup · {round}", fa: "جام حذفی · {round}" },
  "ov.league": { en: "League · Round {round}", fa: "لیگ · هفته {round}" },
  "ov.seasonComplete": { en: "Season complete", fa: "پایان فصل" },
  "ov.trainingWeek": { en: "Training week", fa: "هفته تمرینی" },
  "ov.vs": { en: "vs", fa: "در برابر" },
  "ov.home": { en: "Home", fa: "میزبان" },
  "ov.away": { en: "Away", fa: "مهمان" },
  "ov.seasonOver": {
    en: "The season is over. Review the campaign and start the next one.",
    fa: "فصل به پایان رسید. عملکرد فصل را مرور کنید و فصل بعد را شروع کنید.",
  },
  "ov.noMatch": {
    en: "No match this week — a chance to rest players and let the youth develop.",
    fa: "این هفته مسابقه‌ای نیست — فرصتی برای استراحت بازیکنان و رشد جوان‌ها.",
  },
  "ov.playMatchday": { en: "Play matchday {round}", fa: "بازی هفته {round}" },
  "ov.playCup": { en: "Play cup {round}", fa: "بازی جام {round}" },
  "ov.startNextSeason": { en: "Start next season", fa: "شروع فصل بعد" },
  "ov.advanceWeek": { en: "Advance week", fa: "ادامه هفته" },
  "ov.balance": { en: "Balance", fa: "موجودی" },
  "ov.weekInOut": { en: "Week in / out", fa: "ورودی / خروجی هفته" },
  "ov.board": { en: "Board confidence", fa: "اعتماد هیئت‌مدیره" },
  "ov.club": { en: "Club", fa: "باشگاه" },
  "ov.sponsorLine": { en: "Sponsor Lv {lvl} · {amount}/wk", fa: "اسپانسر سطح {lvl} · {amount}/هفته" },
  "ov.nextUp": { en: "Next up: Round {round}", fa: "بازی بعدی: هفته {round}" },
  "ov.clubNews": { en: "Club news", fa: "اخبار باشگاه" },
  "ov.noNews": {
    en: "Nothing to report yet. Kick off your first week.",
    fa: "هنوز خبری نیست. هفته اول خود را شروع کنید.",
  },
  "ov.weekShort": { en: "Week {week}", fa: "هفته {week}" },
  "ov.table.club": { en: "Club", fa: "باشگاه" },
  "ov.table.p": { en: "P", fa: "ب" },
  "ov.table.w": { en: "W", fa: "پ" },
  "ov.table.d": { en: "D", fa: "م" },
  "ov.table.l": { en: "L", fa: "ب" },
  "ov.table.gd": { en: "GD", fa: "تف" },
  "ov.table.pts": { en: "Pts", fa: "ام" },
  "ov.playFirst": { en: "A match is scheduled — play it first.", fa: "یک مسابقه برنامه‌ریزی شده — اول آن را بازی کنید." },
  "ov.advanceError": { en: "Could not advance the week.", fa: "ادامه هفته ممکن نشد." },
  "ov.seasonStarted": { en: "Season {label} is underway!", fa: "فصل {label} شروع شد!" },
  "ov.seasonError": { en: "Could not start the new season.", fa: "شروع فصل جدید ممکن نشد." },

  // ---- squad ----
  "sq.title": { en: "First-team squad", fa: "تیم اصلی" },
  "sq.sub": { en: "{count} players · weekly wages {wages}", fa: "{count} بازیکن · دستمزد هفتگی {wages}" },
  "sq.player": { en: "Player", fa: "بازیکن" },
  "sq.pos": { en: "Pos", fa: "پست" },
  "sq.ovr": { en: "Ovr", fa: "ارز" },
  "sq.pot": { en: "Pot", fa: "استعداد" },
  "sq.form": { en: "Form", fa: "فرم" },
  "sq.recent": { en: "Recent", fa: "اخیر" },
  "sq.morale": { en: "Morale", fa: "روحیه" },
  "sq.condition": { en: "Condition", fa: "آمادگی" },
  "sq.value": { en: "Value", fa: "ارزش" },
  "sq.yrs": { en: "{age} yrs", fa: "{age} سال" },
  "sq.inj": { en: "inj {weeks}w", fa: "مصدوم {weeks} هفته" },
  "sq.susp": { en: "susp", fa: "محروم" },
  "sq.footnote": {
    en: "Overall is weighted for the player's position. Form is the average of the last five match ratings; condition and morale are drained by matchdays and restored by training.",
    fa: "ارزش کلی بر اساس پست بازیکن وزن‌دهی شده است. فرم میانگین پنج نمره آخر است؛ آمادگی و روحیه با مسابقات کم شده و با تمرین بازمی‌گردد.",
  },

  // ---- tactics ----
  "tc.title": { en: "Tactics board", fa: "تخته تاکتیک" },
  "tc.sub": { en: "Shape how the team plays every matchday", fa: "نحوه بازی تیم در هر هفته را تعیین کنید" },
  "tc.autoPick": { en: "Auto-pick best XI", fa: "انتخاب خودکار بهترین ترکیب" },
  "tc.save": { en: "Save tactics", fa: "ذخیره تاکتیک" },
  "tc.saved": { en: "Tactics saved — the squad is ready.", fa: "تاکتیک ذخیره شد — تیم آماده است." },
  "tc.saveError": { en: "Could not save tactics.", fa: "ذخیره تاکتیک ممکن نشد." },
  "tc.formation": { en: "Formation", fa: "چیدمان" },
  "tc.mentality": { en: "Mentality", fa: "ذهنیت" },
  "tc.pressing": { en: "Pressing", fa: "فشار" },
  "tc.passing": { en: "Passing", fa: "پاس" },
  "tc.tempo": { en: "Tempo", fa: "ریتم" },
  "tc.mentality.lo": { en: "Defensive", fa: "دفاعی" },
  "tc.mentality.hi": { en: "Attacking", fa: "هجومی" },
  "tc.pressing.lo": { en: "Sit off", fa: "کم‌فشار" },
  "tc.pressing.hi": { en: "High press", fa: "فشار بالا" },
  "tc.passing.lo": { en: "Short", fa: "کوتاه" },
  "tc.passing.hi": { en: "Direct", fa: "مستقیم" },
  "tc.tempo.lo": { en: "Patient", fa: "آهسته" },
  "tc.tempo.hi": { en: "Fast", fa: "سریع" },
  "tc.xi": { en: "Starting eleven · {name}", fa: "ترکیب اصلی · {name}" },
  "tc.empty": { en: "— empty —", fa: "— خالی —" },

  // ---- training ----
  "tr.title": { en: "Training plan", fa: "برنامه تمرینی" },
  "tr.sub": { en: "Weekly focus for the whole first team", fa: "تمرکز هفتگی برای کل تیم اصلی" },
  "tr.focus": { en: "Focus", fa: "تمرکز" },
  "tr.intensity": { en: "Intensity", fa: "شدت" },
  "tr.intensity.lo": { en: "Recovery", fa: "بازیابی" },
  "tr.intensity.hi": { en: "Peak fitness", fa: "اوج آمادگی" },
  "tr.save": { en: "Save plan", fa: "ذخیره برنامه" },
  "tr.saved": { en: "Training plan updated.", fa: "برنامه تمرینی به‌روزرسانی شد." },
  "tr.saveError": { en: "Could not save the training plan.", fa: "ذخیره برنامه تمرینی ممکن نشد." },
  "tr.facilities": { en: "Club facilities", fa: "امکانات باشگاه" },
  "tr.facilitiesSub": { en: "Upgrades land in the club tab", fa: "ارتقاها در بخش باشگاه انجام می‌شود" },
  "tr.stadium": { en: "Stadium", fa: "ورزشگاه" },
  "tr.sponsor": { en: "Sponsor", fa: "اسپانسر" },
  "tr.youth": { en: "Youth academy", fa: "آکادمی جوانان" },
  "tr.youthSub": { en: "{count} prospects · promote the gems, release the rest", fa: "{count} استعداد · درخشان‌ها را بالا بیاورید، بقیه را آزاد کنید" },
  "tr.emptyAcademy": {
    en: "The academy is empty — new intakes arrive through the season.",
    fa: "آکادمی خالی است — استعدادهای جدید در طول فصل می‌آیند.",
  },
  "tr.promote": { en: "Promote", fa: "ارتقا" },
  "tr.promoted": { en: "Promoted to the first team!", fa: "به تیم اصلی ارتقا یافت!" },
  "tr.promoteError": { en: "Could not promote.", fa: "ارتقا ممکن نشد." },
  "tr.released": { en: "Released from the academy.", fa: "از آکادمی آزاد شد." },
  "tr.releaseError": { en: "Could not release.", fa: "آزادسازی ممکن نشد." },
  "tr.tooYoung": { en: "{name} is too young (16+ required).", fa: "{name} خیلی جوان است (حداقل ۱۶ سال)." },
  "tr.pot": { en: "Pot", fa: "استعداد" },
  "tr.focus.attack": { en: "Attacking", fa: "حمله" },
  "tr.focus.defense": { en: "Defending", fa: "دفاع" },
  "tr.focus.fitness": { en: "Fitness", fa: "آمادگی" },
  "tr.focus.shooting": { en: "Shooting", fa: "شوت‌زنی" },
  "tr.focus.passing": { en: "Passing", fa: "پاسکاری" },
  "tr.focus.goalkeeping": { en: "Goalkeeping", fa: "دروازه‌بانی" },
  "tr.focus.balanced": { en: "Balanced", fa: "متعادل" },

  // ---- cup round names ----
  "cup.r1": { en: "First round", fa: "دور اول" },
  "cup.r2": { en: "Quarter-final", fa: "یک‌چهارم نهایی" },
  "cup.r3": { en: "Semi-final", fa: "نیمه‌نهایی" },
  "cup.r4": { en: "Final", fa: "فینال" },

  // ---- transfers ----
  "tf.market": { en: "Transfer market", fa: "بازار نقل‌وانتقالات" },
  "tf.marketSub": { en: "{count} players available · your budget {budget}", fa: "{count} بازیکن در دسترس · بودجه شما {budget}" },
  "tf.all": { en: "All", fa: "همه" },
  "tf.signed": { en: "Signed! Welcome aboard.", fa: "خریداری شد! خوش آمدید." },
  "tf.listTitle": { en: "List a player", fa: "فروش بازیکن" },
  "tf.listSub": { en: "Set your asking price and clubs will come knocking", fa: "قیمت درخواستی را تعیین کنید تا باشگاه‌ها سراغش بیایند" },
  "tf.choosePlayer": { en: "Choose a player", fa: "یک بازیکن انتخاب کنید" },
  "tf.listed": { en: "· listed", fa: "· فهرست‌شده" },
  "tf.list": { en: "List", fa: "فهرست" },
  "tf.listedOk": { en: "Player listed on the market.", fa: "بازیکن در بازار فهرست شد." },
  "tf.nobodyListed": { en: "Nobody is listed right now.", fa: "در حال حاضر کسی فهرست نشده است." },
  "tf.unlist": { en: "Unlist", fa: "حذف از فهرست" },
  "tf.offer": { en: "{club} offer · {amount}", fa: "پیشنهاد {club} · {amount}" },
  "tf.weeklyWage": { en: "weekly wage {wage}", fa: "دستمزد هفتگی {wage}" },
  "tf.accept": { en: "Accept", fa: "قبول" },
  "tf.accepted": { en: "Transfer completed.", fa: "انتقال انجام شد." },
  "tf.facilities": { en: "Club facilities", fa: "امکانات باشگاه" },
  "tf.facilitiesSub": { en: "Invest the club's money in infrastructure", fa: "پول باشگاه را در زیرساخت‌ها سرمایه‌گذاری کنید" },
  "tf.stadiumLine": { en: "Lv {lvl} · {cap} seats · €{ticket}/ticket", fa: "سطح {lvl} · {cap} صندلی · {ticket} یورو/بلیت" },
  "tf.sponsorLine": { en: "Lv {lvl} · {amount}/week", fa: "سطح {lvl} · {amount}/هفته" },
  "tf.next": { en: "Next: {name}", fa: "بعدی: {name}" },
  "tf.maxLevel": { en: "Max level", fa: "حداکثر سطح" },
  "tf.upgradeStadium": { en: "Upgrade stadium", fa: "ارتقای ورزشگاه" },
  "tf.upgradeSponsor": { en: "Upgrade sponsor", fa: "ارتقای اسپانسر" },
  "tf.stadiumUpgraded": { en: "Stadium expanded!", fa: "ورزشگاه توسعه یافت!" },
  "tf.sponsorUpgraded": { en: "Better sponsor secured!", fa: "اسپانسر بهتری جذب شد!" },
  "tf.asking": { en: "Asking price", fa: "قیمت درخواستی" },
  "tf.noPlayers": { en: "No players match this filter.", fa: "بازیکنی با این فیلتر یافت نشد." },
  "tf.signPlayer": { en: "Sign player", fa: "خرید بازیکن" },
  "tf.tooExpensive": { en: "Too expensive", fa: "خیلی گران است" },
  "tf.failed": { en: "That didn't work — try again.", fa: "مشکلی پیش آمد — دوباره تلاش کنید." },
  "tf.scoutHint": { en: "Tap a player card to scout their full profile", fa: "برای دیدن مشخصات کامل بازیکن روی کارت او بزنید" },

  // ---- player profile ----
  "pl.tech": { en: "Technical", fa: "فنی" },
  "pl.phys": { en: "Physical", fa: "بدنی" },
  "pl.mental": { en: "Mental", fa: "ذهنی" },
  "pl.gk": { en: "Goalkeeping", fa: "دروازه‌بانی" },
  "pl.contract": { en: "Contract {weeks} weeks", fa: "قرارداد {weeks} هفته" },
  "pl.injured": { en: "Injured {weeks}w · {type}", fa: "مصدوم {weeks} هفته · {type}" },
  "pl.suspended": { en: "Suspended {n} matches", fa: "محروم {n} بازی" },
  "pl.value": { en: "Value", fa: "ارزش" },
  "pl.wage": { en: "Wage", fa: "دستمزد" },
  "pl.asking": { en: "Asking", fa: "درخواستی" },
  "pl.actions": { en: "Manage morale", fa: "مدیریت روحیه" },
  "pl.actionsSub": {
    en: "How you talk to a player changes their morale, condition and mood.",
    fa: "نحوه صحبت شما با بازیکن، روحیه، آمادگی و حال او را تغییر می‌دهد.",
  },
  "pl.oncePerWeek": { en: "One talk per player per week", fa: "هر بازیکن فقط یک بار در هفته" },
  "pl.praise": { en: "Praise", fa: "تحسین" },
  "pl.encourage": { en: "Encourage", fa: "دلگرمی" },
  "pl.warn": { en: "Warn", fa: "هشدار" },
  "pl.fine": { en: "Fine", fa: "جریمه" },
  "pl.done.praise": { en: "Morale lifted!", fa: "روحیه بهبود یافت!" },
  "pl.done.encourage": { en: "Player encouraged!", fa: "بازیکن دلگرم شد!" },
  "pl.done.warn": { en: "Warning issued.", fa: "هشدار داده شد." },
  "pl.done.fine": { en: "Fine issued.", fa: "جریمه اعمال شد." },

  // ---- club tab ----
  "cl.manager": { en: "Manager", fa: "مدیر باشگاه" },
  "cl.managerSub": { en: "Your record at this club", fa: "کارنامه شما در این باشگاه" },
  "cl.seasonsRun": { en: "Season {n}", fa: "فصل {n}" },
  "cl.trophies": { en: "{n} trophies", fa: "{n} جام" },
  "cl.boardGood": { en: "The board is happy with your work.", fa: "هیئت‌مدیره از عملکرد شما راضی است." },
  "cl.boardWarn": { en: "The board is cautious — results need to improve.", fa: "هیئت‌مدیره محتاط است — نتایج باید بهتر شود." },
  "cl.boardBad": { en: "The board is losing patience. Danger!", fa: "هیئت‌مدیره صبرش را از دست می‌دهد. خطر!" },
  "cl.finances": { en: "Finances", fa: "امور مالی" },
  "cl.financesSub": { en: "The club's money in and out", fa: "پول ورودی و خروجی باشگاه" },
  "cl.income": { en: "Weekly income", fa: "درآمد هفتگی" },
  "cl.expenses": { en: "Weekly expenses", fa: "هزینه هفتگی" },
  "cl.log": { en: "Finance log", fa: "صورت‌حساب مالی" },
  "cl.emptyLog": { en: "No transactions yet.", fa: "هنوز تراکنشی ثبت نشده است." },
  "cl.facilities": { en: "Club facilities", fa: "امکانات باشگاه" },
  "cl.facilitiesSub": { en: "Invest in the club's infrastructure", fa: "روی زیرساخت‌های باشگاه سرمایه‌گذاری کنید" },
  "cl.sponsor": { en: "Sponsorship", fa: "اسپانسر" },
  "cl.history": { en: "Season history", fa: "تاریخچه فصل‌ها" },
  "cl.historySub": { en: "Your record across every campaign", fa: "عملکرد شما در طول دوران مربی‌گری" },
  "cl.h.season": { en: "Season", fa: "فصل" },
  "cl.h.pos": { en: "Pos", fa: "رتبه" },
  "cl.h.cup": { en: "Cup", fa: "جام" },
  "cl.h.trophies": { en: "Honours", fa: "افتخارات" },
  "cl.h.balance": { en: "Balance", fa: "موجودی" },
  "cl.emptyHistory": { en: "No completed seasons yet.", fa: "هنوز فصلی کامل نشده است." },
  "cl.achievements": { en: "Achievements", fa: "دستاوردها" },
  "cl.achievementsSub": { en: "{n} of {total} unlocked", fa: "{n} از {total} دستاورد" },

  // ---- match view ----
  "mv.back": { en: "Back to club", fa: "بازگشت به باشگاه" },
  "mv.cup": { en: "Cup · {round}", fa: "جام · {round}" },
  "mv.league": { en: "League · Round {round}", fa: "لیگ · هفته {round}" },
  "mv.home": { en: "Home", fa: "میزبان" },
  "mv.away": { en: "Away", fa: "مهمان" },
  "mv.live": { en: "Live · {min}'", fa: "زنده · {min}'" },
  "mv.halftime": { en: "Half time", fa: "پایان نیمه اول" },
  "mv.fulltime": { en: "Full time", fa: "پایان بازی" },
  "mv.you": { en: "You", fa: "شما" },
  "mv.opp": { en: "Opp", fa: "حریف" },
  "mv.finalWhistle": { en: "Final whistle", fa: "سوت پایان" },
  "mv.minute": { en: "Minute {min}", fa: "دقیقه {min}" },
  "mv.secondHalf": { en: "Second half", fa: "نیمه دوم" },
  "mv.possession": { en: "Possession", fa: "مالکیت توپ" },
  "mv.shots": { en: "Shots", fa: "شوت" },
  "mv.onTarget": { en: "On target", fa: "در چارچوب" },
  "mv.corners": { en: "Corners", fa: "کرنر" },
  "mv.fouls": { en: "Fouls", fa: "خطا" },
  "mv.xg": { en: "xG", fa: "xG" },
  "mv.teamTalk": { en: "Half-time team talk", fa: "صحبت‌های بین دو نیمه" },
  "mv.teamTalkSub": {
    en: "You trail {opp}–{you}. The dressing room is quiet. What do you say?",
    fa: "با نتیجه {opp}–{you} عقب هستید. رختکن ساکت است. چه می‌گویید؟",
  },
  "mv.stayCalm": { en: "Stay calm", fa: "آرام بمانید" },
  "mv.stayCalmSub": { en: "Keep the shape, trust the plan", fa: "ساختار را حفظ کنید، به برنامه اعتماد کنید" },
  "mv.positive": { en: "Positive", fa: "مثبت" },
  "mv.positiveSub": { en: "We're in this — keep going", fa: "ما در بازی هستیم — ادامه دهید" },
  "mv.firedUp": { en: "Fired up", fa: "آتشین" },
  "mv.firedUpSub": { en: "SEND THEM OUT ANGRY", fa: "آن‌ها را خشمگین به زمین بفرستید" },
  "mv.victory": { en: "Victory!", fa: "پیروزی!" },
  "mv.pointsShared": { en: "Points shared", fa: "تقسیم امتیاز" },
  "mv.defeat": { en: "Defeat", fa: "شکست" },
  "mv.confirmText": {
    en: "Confirm the result to record ratings, condition, finances and the league table.",
    fa: "نتیجه را تأیید کنید تا نمرات، آمادگی، مالی و جدول لیگ ثبت شود.",
  },
  "mv.confirm": { en: "Confirm result", fa: "تأیید نتیجه" },
  "mv.control": { en: "Matchday control", fa: "کنترل مسابقه" },
  "mv.controlSub": {
    en: "Stepping through the game — goals, cards and momentum all happen in real time.",
    fa: "بازی را مرحله به مرحله پیش ببرید — گل‌ها، کارت‌ها و جریان بازی همه لحظه‌ای اتفاق می‌افتند.",
  },
  "mv.min1": { en: "+1 min", fa: "+۱ دقیقه" },
  "mv.min5": { en: "+5 min", fa: "+۵ دقیقه" },
  "mv.toHalftime": { en: "To half-time", fa: "تا پایان نیمه اول" },
  "mv.toFulltime": { en: "To full-time", fa: "تا پایان بازی" },
  "mv.mentality": { en: "Quick mentality", fa: "ذهنیت سریع" },
  "mv.defensive": { en: "Defensive", fa: "دفاعی" },
  "mv.attacking": { en: "Attacking", fa: "هجومی" },
  "mv.commentary": { en: "Commentary", fa: "گزارش لحظه‌به‌لحظه" },
  "mv.emptyCommentary": { en: "The referee blows the whistle…", fa: "سوت داور به صدا درآمد…" },
  "mv.yourXI": { en: "Your XI", fa: "ترکیب شما" },
  "mv.bench": { en: "Bench", fa: "نیمکت" },
  "mv.subsLeft": { en: "{n} left", fa: "{n} باقی‌مانده" },
  "mv.allSubsUsed": { en: "all subs used", fa: "همه تعویض‌ها انجام شد" },
  "mv.tapStarter": {
    en: "Tap a starter to take them off, then choose a substitute.",
    fa: "برای تعویض، روی یک بازیکن اصلی بزنید و سپس جانشین را انتخاب کنید.",
  },
  "mv.pickSub": { en: "Now pick a substitute below to make the change.", fa: "حالا از پایین یک جانشین انتخاب کنید." },
  "mv.sub": { en: "Sub", fa: "تعویض" },
  "mv.starters": { en: "{name} · {n} starters", fa: "{name} · {n} بازیکن اصلی" },
  "mv.winToast": {
    en: "Three points! The fans are singing your name.",
    fa: "سه امتیاز! هواداران نام شما را فریاد می‌زنند.",
  },
  "mv.drawToast": { en: "A point apiece — the board will take it.", fa: "هر تیم یک امتیاز — هیئت‌مدیره قبول می‌کند." },
  "mv.loseToast": { en: "Tough afternoon. Pick the team up and go again.", fa: "بعدازظهر سختی بود. تیم را جمع کنید و دوباره بروید." },
  "mv.cupWinToast": { en: "Through to the next round!", fa: "به دور بعد صعود کردید!" },
  "mv.cupLoseToast": { en: "Out of the cup — focus on the league.", fa: "از جام حذف شدید — روی لیگ تمرکز کنید." },
  "mv.resultError": {
    en: "The result could not be recorded — the match state may have changed.",
    fa: "نتیجه ثبت نشد — وضعیت بازی ممکن است تغییر کرده باشد.",
  },

  // ---- career start ----
  "cs.sub": { en: "Career setup", fa: "شروع مربی‌گری" },
  "cs.newCareer": { en: "New career", fa: "مربی‌گری جدید" },
  "cs.takeJob": { en: "Take the job", fa: "کار را قبول کنید" },
  "cs.intro": {
    en: "Pick a manager, choose your club, and walk into the dressing room. The board has already made its mind up about you — it's on you to change it.",
    fa: "مربی خود را انتخاب کنید، باشگاهتان را برگزینید و وارد رختکن شوید. هیئت‌مدیره از قبل درباره شما نظر دارد — تغییر آن به خود شما بستگی دارد.",
  },
  "cs.managerName": { en: "Manager name", fa: "نام مربی" },
  "cs.yourName": { en: "Your name", fa: "نام شما" },
  "cs.nationality": { en: "Nationality", fa: "ملیت" },
  "cs.league": { en: "League", fa: "لیگ" },
  "cs.startCareer": { en: "Start the career", fa: "شروع مربی‌گری" },
  "cs.signingIn": { en: "Signing you in…", fa: "در حال شروع…" },
  "cs.chooseClub": { en: "Choose your club — {flag} {league}", fa: "باشگاه خود را انتخاب کنید — {flag} {league}" },
  "cs.tier": { en: "Tier {tier}", fa: "سطح {tier}" },
  "cs.welcome": { en: "Welcome to {club}!", fa: "به {club} خوش آمدید!" },
  "cs.error": { en: "Could not start the career. Please try again.", fa: "شروع مربی‌گری ممکن نشد. دوباره تلاش کنید." },
  "cs.clubTier": { en: "{stadium} · Tier {tier}", fa: "{stadium} · سطح {tier}" },

  // ---- landing ----
  "lp.home": { en: "True Football home", fa: "خانه فوتبال حرفه‌ای" },
  "lp.sub": { en: "Single-player manager", fa: "مربی‌گری تک‌نفره" },
  "lp.features": { en: "Features", fa: "امکانات" },
  "lp.how": { en: "How it works", fa: "روش بازی" },
  "lp.signIn": { en: "Sign in", fa: "ورود" },
  "lp.badge": { en: "The complete single-player football manager", fa: "مربی‌گری کامل فوتبال تک‌نفره" },
  "lp.h1a": { en: "Own the dugout.", fa: "مالک نیمکت باشید." },
  "lp.h1b": { en: "Write your own legend.", fa: "افسانه خودتان را بسازید." },
  "lp.hero": {
    en: "Take charge of a club, build the squad, and live every matchday — from the first whistle of pre-season to the final day of the title race. This is football management, played properly.",
    fa: "مدیریت یک باشگاه را به دست بگیرید، تیم بسازید و هر هفته مسابقه را از نزدیک تجربه کنید — از اولین سوت پیش‌فصل تا روز آخر رقابت قهرمانی. این، مربی‌گری فوتبال است؛ به شکل درستش.",
  },
  "lp.startCareer": { en: "Start your career", fa: "شروع مربی‌گری" },
  "lp.seeHow": { en: "See how it works", fa: "نحوه کار را ببینید" },
  "lp.live": { en: "Premier League · Live", fa: "لیگ برتر · زنده" },
  "lp.fullTimeLooming": { en: "Full time looming", fa: "پایان بازی نزدیک است" },
  "lp.leaguePos": { en: "League position", fa: "رتبه در لیگ" },
  "lp.budget": { en: "Transfer budget", fa: "بودجه نقل‌وانتقالات" },
  "lp.statLeagues": { en: "Leagues", fa: "لیگ" },
  "lp.statClubs": { en: "Real clubs", fa: "باشگاه واقعی" },
  "lp.statTrophies": { en: "Trophies per season", fa: "جام در هر فصل" },
  "lp.statWeeks": { en: "Match weeks", fa: "هفته مسابقه" },
  "lp.featKicker": { en: "Everything a manager needs", fa: "هر چیزی که یک مربی نیاز دارد" },
  "lp.featTitle": { en: "Run the club like a professional", fa: "باشگاه را حرفه‌ای مدیریت کنید" },
  "lp.featBody": {
    en: "Not a card flipper and not a highlight reel — a complete management simulation with real decisions, real consequences and a board that remembers.",
    fa: "نه یک بازی کارتی و نه فقط گل‌های برتر — یک شبیه‌سازی کامل مدیریتی با تصمیم‌های واقعی، پیامدهای واقعی و هیئت‌مدیره‌ای که فراموش نمی‌کند.",
  },
  "lp.stepsKicker": { en: "Three steps to glory", fa: "سه قدم تا افتخار" },
  "lp.stepsTitle": { en: "From the interview to the trophy parade", fa: "از مصاحبه تا جشن قهرمانی" },
  "lp.finalTitle": { en: "The board is waiting for your call", fa: "هیئت‌مدیره منتظر تماس شماست" },
  "lp.finalBody": {
    en: "Sign in and take the job. Your first matchday is closer than you think.",
    fa: "وارد شوید و کار را قبول کنید. اولین مسابقه شما نزدیک‌تر از آن چیزی است که فکر می‌کنید.",
  },
  "lp.saveProgress": { en: "Save progress to your account", fa: "ذخیره پیشرفت در حساب شما" },
  "lp.pureSingle": { en: "Pure single-player", fa: "کاملاً تک‌نفره" },
  "lp.copyright": { en: "For the love of the game. © {year} True Football", fa: "به عشق فوتبال. © {year} فوتبال حرفه‌ای" },

  // feature cards
  "feat.engine.title": { en: "Matchday engine", fa: "موتور مسابقه" },
  "feat.engine.body": {
    en: "Ninety minutes of live commentary, momentum swings, half-time team talks and tactical tweaks. Every result is earned, not scripted.",
    fa: "نود دقیقه گزارش زنده، نوسان جریان بازی، صحبت‌های بین دو نیمه و تغییرات تاکتیکی. هر نتیجه به دست می‌آید، نه از قبل نوشته شده.",
  },
  "feat.squad.title": { en: "Squad & tactics", fa: "تیم و تاکتیک" },
  "feat.squad.body": {
    en: "Seven formations, full line-up control and a real match engine that reads mentality, pressing, tempo and player fitness.",
    fa: "هفت چیدمان، کنترل کامل ترکیب و موتور مسابقه واقعی که ذهنیت، فشار، ریتم و آمادگی بازیکن را در نظر می‌گیرد.",
  },
  "feat.market.title": { en: "Transfer market", fa: "بازار نقل‌وانتقالات" },
  "feat.market.body": {
    en: "Scout the market, negotiate offers for your own stars and rebuild the squad around a budget the board actually respects.",
    fa: "بازار را زیر نظر بگیرید، برای ستاره‌های خود پیشنهاد بگیرید و تیم را با بودجه‌ای که هیئت‌مدیره واقعاً قبول دارد بازسازی کنید.",
  },
  "feat.youth.title": { en: "Youth academy", fa: "آکادمی جوانان" },
  "feat.youth.body": {
    en: "Intakes land every season. Promote the gems, watch them grow, and turn academy prospects into first-team legends.",
    fa: "هر فصل استعدادهای جدید می‌آیند. درخشان‌ها را بالا بیاورید، رشدشان را ببینید و آکادمی را به مهد ستاره‌های تیم اصلی تبدیل کنید.",
  },
  "feat.finance.title": { en: "Club finances", fa: "مالی باشگاه" },
  "feat.finance.body": {
    en: "Stadium expansions, sponsorship tiers, matchday income and a wage bill to balance. Run the club like a professional outfit.",
    fa: "توسعه ورزشگاه، سطوح اسپانسری، درآمد مسابقه و دستمزدی که باید متعادل شود. باشگاه را حرفه‌ای اداره کنید.",
  },
  "feat.trophy.title": { en: "Season & cup", fa: "فصل و جام" },
  "feat.trophy.body": {
    en: "A full 26-week league campaign plus a knockout cup. Win the double and the fans will sing your name for years.",
    fa: "یک فصل کامل ۲۶ هفته‌ای لیگ به‌علاوه یک جام حذفی. اگر دبل کنید، هواداران سال‌ها نام شما را فریاد می‌زنند.",
  },

  // steps
  "step.1.title": { en: "Take the job", fa: "کار را قبول کنید" },
  "step.1.body": {
    en: "Pick your manager, choose your club from eighteen leagues across Europe and the Americas, and walk into the dressing room.",
    fa: "مربی خود را انتخاب کنید، باشگاه را از میان هجده لیگ اروپا و آمریکا برگزینید و وارد رختکن شوید.",
  },
  "step.2.title": { en: "Build the squad", fa: "تیم را بسازید" },
  "step.2.body": {
    en: "Set the formation, pick the eleven, run the training ground and shape the market. Every decision changes the season.",
    fa: "چیدمان را تعیین کنید، یازده نفر اصلی را بچینید، تمرینات را هدایت کنید و بازار را شکل دهید. هر تصمیم فصل را تغییر می‌دهد.",
  },
  "step.3.title": { en: "Win the season", fa: "فصل را ببرید" },
  "step.3.body": {
    en: "Play the matchdays, react at half-time, and steer your club through a title race, a cup run and the long road to a dynasty.",
    fa: "هفته‌های مسابقه را بازی کنید، بین دو نیمه واکنش نشان دهید و باشگاه را در رقابت قهرمانی، مسیر جام و جاده طولانی به یک دودمان پیش ببرید.",
  },

  // ---- auth ----
  "au.backHome": { en: "Back to home", fa: "بازگشت به خانه" },
  "au.welcome": { en: "Welcome to True Football", fa: "به فوتبال حرفه‌ای خوش آمدید" },
  "au.desc": { en: "Sign in to take charge of your club", fa: "برای مدیریت باشگاه خود وارد شوید" },
  "au.emailPlaceholder": { en: "name@example.com", fa: "name@example.com" },
  "au.or": { en: "Or", fa: "یا" },
  "au.guest": { en: "Continue as Guest", fa: "ادامه به عنوان مهمان" },
  "au.checkEmail": { en: "Check your email", fa: "ایمیل خود را بررسی کنید" },
  "au.sentCode": { en: "We've sent a code to {email}", fa: "یک کد به {email} ارسال کردیم" },
  "au.didntReceive": { en: "Didn't receive a code?", fa: "کدی دریافت نکردید؟" },
  "au.tryAgain": { en: "Try again", fa: "تلاش مجدد" },
  "au.verifying": { en: "Verifying...", fa: "در حال بررسی..." },
  "au.verifyCode": { en: "Verify code", fa: "تأیید کد" },
  "au.differentEmail": { en: "Use different email", fa: "استفاده از ایمیل دیگر" },
  "au.footer": { en: "True Football Clone · For the love of the game", fa: "فوتبال حرفه‌ای · به عشق فوتبال" },
  "au.sendError": { en: "Failed to send verification code. Please try again.", fa: "ارسال کد تأیید ناموفق بود. دوباره تلاش کنید." },
  "au.codeError": { en: "The verification code you entered is incorrect.", fa: "کد تأیید وارد شده اشتباه است." },
  "au.guestError": { en: "Failed to sign in as guest", fa: "ورود به عنوان مهمان ناموفق بود" },

  // ---- 404 ----
  "nf.title": { en: "Page not found", fa: "صفحه پیدا نشد" },
  "nf.body": { en: "The page you are looking for has left the pitch.", fa: "صفحه‌ای که دنبال آن هستید از زمین بازی خارج شده است." },
  "nf.home": { en: "Back to home", fa: "بازگشت به خانه" },

  // ---- positions (kept Latin in both, but UI labels) ----
  "pos.GK": { en: "GK", fa: "دروازه‌بان" },
  "pos.DF": { en: "DF", fa: "مدافع" },
  "pos.MF": { en: "MF", fa: "هافبک" },
  "pos.FW": { en: "FW", fa: "مهاجم" },
};

export function translate(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  const entry = DICT[key];
  if (!entry) return key;
  let out = entry[lang];
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      out = out.split(`{${k}}`).join(String(v));
    }
  }
  return out;
}

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  dir: "ltr" | "rtl";
}

const LangContext = createContext<LangContextValue | null>(null);

function readStoredLang(): Lang {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "fa" ? "fa" : "en";
}

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStoredLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "fa" ? "rtl" : "ltr";
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore private-mode failures
    }
  }, [lang]);

  const value = useMemo<LangContextValue>(
    () => ({
      lang,
      setLang: (l) => setLangState(l),
      toggle: () => setLangState((p) => (p === "fa" ? "en" : "fa")),
      t: (key, vars) => translate(lang, key, vars),
      dir: lang === "fa" ? "rtl" : "ltr",
    }),
    [lang],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
}

/** Small inline language switcher used in headers. */
export function LangToggle({ className }: { className?: string }) {
  const { lang, setLang } = useLang();
  return (
    <button
      type="button"
      onClick={() => setLang(lang === "fa" ? "en" : "fa")}
      className={
        className ??
        "flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
      }
      aria-label={translate(lang, "lang.toggle")}
      title={translate(lang, "lang.toggle")}
    >
      <span aria-hidden>{lang === "fa" ? "EN" : "FA"}</span>
      <span>{lang === "fa" ? "فارسی" : "English"}</span>
    </button>
  );
}
