import {TASKS, type Task} from './master.ts';
export type Region = 'global' | 'custom';
export interface Config {region: Region; resetHourJst: number; weeklyDay: number; characterId:string; serverId:string; accountId:string; level:number; subscription:boolean; automatic:boolean; }
export interface Entry {value:number; anchor:string; period:string; updatedAt:string;}
export interface Store {version:1; config:Config; entries: Record<string,Entry>; disabled:string[]; view:{tab:'all'|'daily'|'weekly'|'timer'; search:string; optional:boolean};}
export const DEFAULT:Store = {version:1,config:{region:'custom',resetHourJst:16,weeklyDay:3,characterId:'main',serverId:'server1',accountId:'account1',level:45,subscription:false,automatic:false},entries:{},disabled:[],view:{tab:'all',search:'',optional:false}};
const DAY=86400000;
export const safeNum=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,Number.isFinite(n)?n:min));
// UTC date shifted such that JST reset aligns with a UTC midnight boundary.
export function resetIndex(now:number, hourJst:number): number {return Math.floor((now+(9-hourJst)*3600000)/DAY);}
export function periodKey(task:Task,now:number,c:Config):string {
 const d=resetIndex(now,c.resetHourJst);
 if(task.cycle==='daily') return `d:${d}`;
 if(task.cycle==='weekly') {const weekday=new Date(d*DAY).getUTCDay();return `w:${d-((weekday-c.weeklyDay+7)%7)}`;}
 return 'timer';
}
export function nextReset(now:number,c:Config,weekly=false):number {
 const d=resetIndex(now,c.resetHourJst), next=d+1;
 const day=weekly?next+((c.weeklyDay-new Date(next*DAY).getUTCDay()+7)%7):next;
 return day*DAY-(9-c.resetHourJst)*3600000;
}
export const scopeId=(task:Task,c:Config)=> JSON.stringify(task.scope==='server'?['server',c.accountId,c.serverId]:task.scope==='account'?['account',c.accountId]:['character',c.accountId,c.serverId,c.characterId]);
export const entryKey=(task:Task,c:Config)=>`${scopeId(task,c)}|${task.id}`;
export function capacity(task:Task,c:Config){return task.id==='od-energy'&&c.subscription?840:task.limit??1;}
export function project(task:Task,entry:Entry|undefined,now:number,c:Config):Entry{
 const period=periodKey(task,now,c), cap=capacity(task,c);
 if(!entry) return {value:0,period,anchor:new Date(now).toISOString(),updatedAt:new Date(now).toISOString()};
 if(!c.automatic) return {...entry,value:safeNum(entry.value,0,cap)};
 let value=safeNum(entry.value,0,cap); let anchor=entry.anchor;
 if(task.mode==='stock') {
   const then=resetIndex(Date.parse(entry.anchor),c.resetHourJst), current=resetIndex(now,c.resetHourJst);
   const steps=Math.max(0,current-then);
   if(steps){value=Math.min(cap,value+steps*(task.refill??0));anchor=new Date(now).toISOString();}
 } else if(task.mode==='resource') {
   const interval=(task.refillHours??3)*3600000;const elapsed=Math.max(0,now-Date.parse(anchor));
   const steps=Math.floor(elapsed/interval);
   if(steps){value=Math.min(cap,value+steps*(task.refill??0));anchor=new Date(Date.parse(anchor)+steps*interval).toISOString();}
 }else if(period!==entry.period){
   // A clock correction into an earlier period must not erase a recorded check.
   if(Number(period.slice(2))<Number(entry.period.slice(2))) return {...entry,value};
   value=0;anchor=new Date(now).toISOString();
 }
 return {...entry,value,anchor,period};
}
export function change(task:Task,store:Store,newValue:number,now:number):Store {
 const key=entryKey(task,store.config),base=project(task,store.entries[key],now,store.config);
 return {...store,entries:{...store.entries,[key]:{...base,value:Math.floor(safeNum(newValue,0,capacity(task,store.config))),updatedAt:new Date(now).toISOString()}}};
}
export function configure(store:Store,part:Partial<Config>,now:number):Store {
 const config={...store.config,...part}, entries:Record<string,Entry>={};
 const clockChanged=part.automatic!==undefined||part.resetHourJst!==undefined||part.weeklyDay!==undefined;
 for(const [key,entry] of Object.entries(store.entries)) {
   const task=TASKS.find(t=>key.endsWith('|'+t.id));
   if(!task) continue;
   // Settle every character using the old clock/cap before applying new settings.
   const settled=project(task,entry,now,store.config);
   settled.value=safeNum(settled.value,0,capacity(task,config));
   entries[key]=clockChanged?{...settled,anchor:new Date(now).toISOString(),period:periodKey(task,now,config)}:settled;
 }
 return {...store,entries,config};
}
export function readStore(raw:string|null):Store {
 if(raw===null) return structuredClone(DEFAULT);
 if(new TextEncoder().encode(raw).length>1048576) throw Error('JSONは1 MiBまでです。');
 const obj=JSON.parse(raw);
 const fail=()=>{throw Error('コンテンツ管理の保存形式が不正です。元データは上書きしません。')};
 if(obj?.version!==1||!obj.config||typeof obj.config!=='object'||Array.isArray(obj.config)||!obj.entries||typeof obj.entries!=='object'||Array.isArray(obj.entries)) return fail();
 const c={...DEFAULT.config,...obj.config};
 for(const k of ['accountId','serverId','characterId'] as const) if(typeof c[k]!=='string'||!c[k].trim()||c[k].length>40||[...c[k]].some(s=>s.charCodeAt(0)<32)) return fail();
 for(const [n,min,max] of [[c.resetHourJst,0,23],[c.weeklyDay,0,6],[c.level,1,100]]) if(!Number.isInteger(n)||n<min||n>max) return fail();
 if(typeof c.automatic!=='boolean'||typeof c.subscription!=='boolean'||!['custom','global'].includes(c.region)) return fail();
 if(!Array.isArray(obj.disabled)||obj.disabled.some((id:unknown)=>typeof id!=='string'||!TASKS.some(t=>t.id===id))) return fail();
 const entries:Record<string,Entry>={};
 if(Object.keys(obj.entries).length>10000) return fail();
 for(const [key,e] of Object.entries(obj.entries) as [string,Entry][]) {
   if(key.length>300||!e||!Number.isInteger(e.value)||e.value<0||e.value>100000||typeof e.period!=='string'||e.period.length>40||![e.anchor,e.updatedAt].every(d=>typeof d==='string'&&Number.isFinite(Date.parse(d)))) return fail();
   const split=key.lastIndexOf('|');
   const task=TASKS.find(t=>t.id===key.slice(split+1));
   if(!task||e.value>capacity(task,c)||!(task.cycle==='timer'?e.period==='timer':new RegExp('^'+(task.cycle==='daily'?'d':'w')+':-?\\d+$').test(e.period))) return fail();
   let scope; try{scope=JSON.parse(key.slice(0,split))}catch{return fail()}
   if(!Array.isArray(scope)||scope[0]!==task.scope||scope.length!==({character:4,server:3,account:2} as Record<string,number>)[scope[0]]||scope.some((v:unknown)=>typeof v!=='string'||!v||v.length>40)) return fail();
   entries[key]={value:e.value,anchor:e.anchor,period:e.period,updatedAt:e.updatedAt};
 }
 const v=obj.view??DEFAULT.view;
 if(!['all','daily','weekly','timer'].includes(v.tab)||typeof v.search!=='string'||v.search.length>120||typeof v.optional!=='boolean') return fail();
 return {version:1,config:{region:c.region,resetHourJst:c.resetHourJst,weeklyDay:c.weeklyDay,accountId:c.accountId,serverId:c.serverId,characterId:c.characterId,level:c.level,subscription:c.subscription,automatic:c.automatic},entries,disabled:[...new Set<string>(obj.disabled)],view:{tab:v.tab,search:v.search,optional:v.optional}};
}
