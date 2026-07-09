export interface YakuTableEntry {
  key: string;
  name: string;
  hanClosed: number;
  hanOpen: number; // 面前と同じ場合はhanClosedと同値
  menzenOnly?: boolean;
}

// 状況役(立直・一発・自摸・海底・河底・嶺上・槍槓・天和・地和)は共通条件から自動計算するため、
// ここでは形に依存する通常役のみを扱う
export const YAKU_TABLE: YakuTableEntry[] = [
  { key: 'pinfu', name: '平和', hanClosed: 1, hanOpen: 1, menzenOnly: true },
  { key: 'tanyao', name: '断幺九', hanClosed: 1, hanOpen: 1 },
  { key: 'yakuhai_seat', name: '役牌(自風)', hanClosed: 1, hanOpen: 1 },
  { key: 'yakuhai_round', name: '役牌(場風)', hanClosed: 1, hanOpen: 1 },
  { key: 'yakuhai_haku', name: '役牌(白)', hanClosed: 1, hanOpen: 1 },
  { key: 'yakuhai_hatsu', name: '役牌(發)', hanClosed: 1, hanOpen: 1 },
  { key: 'yakuhai_chun', name: '役牌(中)', hanClosed: 1, hanOpen: 1 },
  { key: 'iipeiko', name: '一盃口', hanClosed: 1, hanOpen: 1, menzenOnly: true },
  { key: 'sanshoku_doukou', name: '三色同刻', hanClosed: 2, hanOpen: 2 },
  { key: 'sankantsu', name: '三槓子', hanClosed: 2, hanOpen: 2 },
  { key: 'toitoi', name: '対々和', hanClosed: 2, hanOpen: 2 },
  { key: 'sanankou', name: '三暗刻', hanClosed: 2, hanOpen: 2 },
  { key: 'shousangen', name: '小三元', hanClosed: 2, hanOpen: 2 },
  { key: 'honroutou', name: '混老頭', hanClosed: 2, hanOpen: 2 },
  { key: 'chanta', name: '混全帯幺九', hanClosed: 2, hanOpen: 1 },
  { key: 'ittsuu', name: '一気通貫', hanClosed: 2, hanOpen: 1 },
  { key: 'sanshoku_doujun', name: '三色同順', hanClosed: 2, hanOpen: 1 },
  { key: 'junchan', name: '純全帯幺九', hanClosed: 3, hanOpen: 2 },
  { key: 'honitsu', name: '混一色', hanClosed: 3, hanOpen: 2 },
  { key: 'ryanpeikou', name: '二盃口', hanClosed: 3, hanOpen: 3, menzenOnly: true },
  { key: 'chinitsu', name: '清一色', hanClosed: 6, hanOpen: 5 },
];

export interface YakumanTableEntry {
  key: string;
  name: string;
  multiplier: number; // 1=役満、2=ダブル役満
}

export const YAKUMAN_TABLE: YakumanTableEntry[] = [
  { key: 'kokushi', name: '国士無双', multiplier: 1 },
  { key: 'kokushi13', name: '国士無双十三面待ち', multiplier: 2 },
  { key: 'suuankou', name: '四暗刻', multiplier: 1 },
  { key: 'suuankou_tanki', name: '四暗刻単騎', multiplier: 2 },
  { key: 'daisangen', name: '大三元', multiplier: 1 },
  { key: 'shousuushii', name: '小四喜', multiplier: 1 },
  { key: 'daisuushii', name: '大四喜', multiplier: 2 },
  { key: 'tsuiisou', name: '字一色', multiplier: 1 },
  { key: 'ryuiisou', name: '緑一色', multiplier: 1 },
  { key: 'chinroutou', name: '清老頭', multiplier: 1 },
  { key: 'chuuren', name: '九蓮宝燈', multiplier: 1 },
  { key: 'junsei_chuuren', name: '純正九蓮宝燈', multiplier: 2 },
  { key: 'suukantsu', name: '四槓子', multiplier: 1 },
  { key: 'tenho', name: '天和', multiplier: 1 },
  { key: 'chiho', name: '地和', multiplier: 1 },
];
