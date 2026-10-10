export type Cycle = 'daily' | 'weekly' | 'timer';
export type Mode = 'check' | 'progress' | 'stock' | 'resource';
export type Scope = 'character' | 'server' | 'account';
export interface Task {
  id: string; title: string; cycle: Cycle; mode: Mode; scope: Scope;
  category: string; level: number; limit?: number; refill?: number; refillHours?: number;
  enabled: boolean; verified: 'client' | 'secondary' | 'manual'; note?: string;
}
const make = (id:string,title:string,cycle:Cycle,mode:Mode,category:string,level=45,limit?:number,refill?:number,scope:Scope='character',note?:string,enabled=true,verified:Task['verified']='secondary'):Task=>({id,title,cycle,mode,category,level,limit,refill,scope,note,enabled,verified});
export const TASKS: Task[] = [
 make('duty','指令任務（一般）','daily','progress','クエスト',45,5,undefined,'server'),
 make('command','指令書クエスト消化','daily','check','クエスト',45,undefined,undefined,'character','受注上限20件・消化上限なし。日ごとの実施確認用',false),
 make('nightmare','悪夢','daily','stock','ダンジョン',45,14,2),
 ...[['krao','クラオ洞窟'],['urugugu','ウルググ峡谷'],['fire','炎の神殿'],['draupnir','ドラウプニル'],['vakron','ヴァクロン空島'],['horn','猛角の巣窟']].map(([id,title])=>make(`conquest-${id}`,`遠征・征服：${title}`,'daily','stock','遠征・征服',45,14,2)),
 make('trans-deus','超越：デウス研究基地','daily','stock','超越',45,4,2),
 make('trans-arkanis','超越：砕けたアルカニス','daily','stock','超越',45,4,2),
 make('invasion','次元侵略の報酬キー','daily','stock','イベント',45,7,1,'server'),
 make('shugo-server','シューゴフェスタ（サーバー枠）','daily','stock','イベント',13,12,3,'server'),
 make('shugo-character','シューゴフェスタ（キャラ枠）','daily','stock','イベント',13,28,4),
 make('attendance','出席報酬','daily','check','ログイン',10),
 ...[['krao','クラオ洞窟',20],['urugugu','ウルググ峡谷',28],['fire','炎の神殿',35],['draupnir','ドラウプニル',45],['vakron','ヴァクロン空島',45],['horn','猛角の巣窟',45]].map(([id,title,level])=>make(`explore-${id}`,`遠征・探検：${title}`,'weekly','progress','遠征・探検',Number(level),7)),
 make('sanctuary-attempt','聖域・深淵の鍛冶場：挑戦','weekly','progress','レイド',45,4),
 make('sanctuary-reward','聖域・深淵の鍛冶場：最終ボス報酬','weekly','progress','レイド',45,1),
 make('subjugation','討伐（対象共通）','weekly','progress','レイド',45,3),
 make('ascension','昇天の試練（対象共通）','weekly','progress','レイド',45,3),
 make('daily-dungeon','デイリーダンジョン（共通入場枠）','weekly','progress','ダンジョン',30,14),
 ...[['lower','下層'],['middle','中層'],['upper','上層']].map(([id,name])=>make(`abyss-${id}`,`アビス${name}・基本利用時間（分）`,'weekly','progress','PvP',45,420,undefined,'character','消費した分数を入力。延長分は別管理')),
 ...[['solo','個人',30,10],['team','団体',30,10],['strategy','戦略',3,3]].flatMap(([id,name,wins,joins])=>[
 make(`arena-${id}-wins`,`闘技場${name}・報酬対象勝利`,'weekly','progress','PvP',45,Number(wins)),
 make(`arena-${id}-joins`,`闘技場${name}・報酬対象参加`,'weekly','progress','PvP',45,Number(joins))]),
 make('supply','アビス補給依頼（週枠）','weekly','check','クエスト',25,undefined,undefined,'character','当週の納品対象・件数はゲーム内で確認'),
 ...[['century','次元侵略トークン交換'],['command-a','指令書交換所'],['command-b','指令書交換所02'],['abyss-command','アビス指令書交換'],['mid-command','アビス中層指令書交換'],['abyss','アビス交換所'],['nightmare','悪夢交換所'],['arena','闘技場交換所']].map(([id,title])=>make(`shop-${id}`,title,'weekly','check','交換所',1,undefined,undefined,'character','商品別購入上限と共有範囲は商品ごとに異なるため店舗単位の確認チェック',false)),
 make('weekly-ap','週間アビスポイント上限確認','weekly','check','PvP',45,undefined,undefined,'character','上限値はゲーム内で確認',false),
 make('season','シーズン任務報酬確認','weekly','check','イベント',1,undefined,undefined,'character','イベント開催状況により変動',false),
 make('substance','物質変換週間枠','weekly','check','製作',1,undefined,undefined,'character','レシピごとに上限が異なる',false),
 make('od-energy','オードエネルギー','timer','resource','資源',1,560,15,'character','3時間ごとに15回復。サブスクリプションで上限840'),
];
export const DATA_SOURCE = 'https://aion2data.com/checklist';
export const MASTER_BUILD = '2.0.6.0 hotfix 1 / 2026-10-09';
export const NAME_SOURCE = 'https://aion2.ncsoft.jp/ja/contents';
// Official Japanese site confirms these dungeon names, not the limits or mode suffixes.
export const CONFIRMED_DUNGEONS = ['クラオ洞窟', 'ウルググ峡谷', '炎の神殿', 'ドラウプニル'];
