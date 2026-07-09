export type Ruleset = 'yonma' | 'sanma';
export type WinType = 'tsumo' | 'ron';
export type MeldType = 'chi' | 'pon' | 'minkan' | 'ankan';
export type Wind = 1 | 2 | 3 | 4; // 1=東 2=南 3=西 4=北

export interface Meld {
  id: string;
  type: MeldType;
  tiles: string[]; // 構成牌 (chi/pon/minkan/ankanで3~4枚)
}

// 全モード共通の入力条件
export interface CommonConditions {
  winType: WinType;
  isRiichi: boolean;
  isDoubleRiichi: boolean;
  isIppatsu: boolean;
  isHaitei: boolean; // 海底摸月
  isHoutei: boolean; // 河底撈魚
  isRinshan: boolean; // 嶺上開花
  isChankan: boolean; // 槍槓
  isTenho: boolean; // 天和
  isChiho: boolean; // 地和
  seatWind: Wind;
  roundWind: Wind;
  honba: number;
  kyotaku: number; // 供託(リーチ棒)本数
  ruleset: Ruleset;
}

export function defaultCommonConditions(ruleset: Ruleset = 'yonma'): CommonConditions {
  return {
    winType: 'ron',
    isRiichi: false,
    isDoubleRiichi: false,
    isIppatsu: false,
    isHaitei: false,
    isHoutei: false,
    isRinshan: false,
    isChankan: false,
    isTenho: false,
    isChiho: false,
    seatWind: 1,
    roundWind: 1,
    honba: 0,
    kyotaku: 0,
    ruleset,
  };
}

// 初心者モード用: 手牌そのものから計算する
export interface HandInput {
  concealedTiles: string[]; // 和了牌を含まない、鳴きに使われていない手牌
  winningTile: string;
  melds: Meld[];
  common: CommonConditions;
  doraIndicators: string[]; // ドラ表示牌
  uraDoraIndicators: string[]; // 裏ドラ表示牌(リーチ時のみ有効)
}

// 中級者モード用: 符の要素を個数で入力する
export type WaitTypeInput = 'ryanmen' | 'kanchan' | 'penchan' | 'tanki' | 'shanpon';
export type PairFuType = 'none' | 'yakuhai_single' | 'yakuhai_double';

export interface FuFactors {
  isMenzen: boolean;
  isPinfu: boolean;
  isChiitoitsu: boolean;
  simpleOpenTriplet: number; // 明刻(中張牌)
  simpleClosedTriplet: number; // 暗刻(中張牌)
  terminalOpenTriplet: number; // 明刻(么九牌)
  terminalClosedTriplet: number; // 暗刻(么九牌)
  simpleOpenQuad: number; // 明槓(中張牌)
  simpleClosedQuad: number; // 暗槓(中張牌)
  terminalOpenQuad: number; // 明槓(么九牌)
  terminalClosedQuad: number; // 暗槓(么九牌)
  pairFuType: PairFuType;
  waitType: WaitTypeInput;
}

export function defaultFuFactors(): FuFactors {
  return {
    isMenzen: true,
    isPinfu: false,
    isChiitoitsu: false,
    simpleOpenTriplet: 0,
    simpleClosedTriplet: 0,
    terminalOpenTriplet: 0,
    terminalClosedTriplet: 0,
    simpleOpenQuad: 0,
    simpleClosedQuad: 0,
    terminalOpenQuad: 0,
    terminalClosedQuad: 0,
    pairFuType: 'none',
    waitType: 'ryanmen',
  };
}

// 手動での翻符入力(上級者モード・中級者モードの最終計算に利用)
export interface ManualDora {
  dora: number;
  uraDora: number;
  akaDora: number;
}

export function defaultManualDora(): ManualDora {
  return { dora: 0, uraDora: 0, akaDora: 0 };
}

export interface YakuResult {
  name: string;
  han: number;
  isYakuman: boolean;
}

export interface FuDetail {
  label: string;
  fu: number;
}

export interface ScoreBreakdown {
  han: number;
  fu: number;
  baseTenBucket: number; // 基本点
  scoreName: string | null; // 満貫/跳満/倍満/三倍満/役満 など
  totalPoints: number; // 和了者が受け取る合計点(本場・供託含む)
  paymentDetail: string; // 支払い内訳の文字列
  yakuList: YakuResult[];
  fuDetails: FuDetail[];
  isYakuman: boolean;
  yakumanMultiplier: number;
}

export interface CalcError {
  message: string;
}
