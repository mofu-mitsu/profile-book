"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { toPng } from "html-to-image";
import Script from "next/script";

type Template = "book" | "minimal" | "pop" | "diary" | "holes" | "sticker" | "notebook" | "scrap";
type FontKey = "sans" | "rounded" | "serif" | "mono" | "cute" | "hand";
type Kind = "text"|"long"|"check"|"chips"|"stance";
type Item = { id:string; label:string; value:string; kind:Kind; custom?:boolean };
type Profile = { name:string; username:string; intro:string; items:Item[] };
type CustomDef = { id:string; label:string; kind:Kind };

const presets = {
  sakura:{bg:"#fff7fb",main:"#ff8fb3",accent:"#ffd5e2",text:"#4b3540",sub:"#fff0f5"},
  soda:{bg:"#f3fbff",main:"#63bde8",accent:"#c9efff",text:"#29414d",sub:"#e9f8ff"},
  lemon:{bg:"#fffdf0",main:"#e6bd38",accent:"#fff0a8",text:"#514a2b",sub:"#fff8d6"},
  lavender:{bg:"#faf7ff",main:"#a98be8",accent:"#e2d5ff",text:"#423853",sub:"#f1ebff"},
  mint:{bg:"#f3fffa",main:"#55b99a",accent:"#c7f0df",text:"#2d4a40",sub:"#e3f9ef"},
  yami:{bg:"#f7f3fa",main:"#9a6fa8",accent:"#dec9e5",text:"#332a38",sub:"#eee4f1"}
};
const fontMap:Record<FontKey,string> = {
  sans:"Arial,'Hiragino Kaku Gothic ProN',sans-serif",
  rounded:"'Trebuchet MS','Hiragino Maru Gothic ProN',sans-serif",
  serif:"Georgia,'Yu Mincho',serif",
  mono:"'Courier New',monospace",
  cute:"'Comic Sans MS','Hiragino Maru Gothic ProN',sans-serif",
  hand:"Yomogi,'Klee One','Hiragino Maru Gothic ProN',cursive"
};

const stanceOptions = [
  ["follow","フォロー歓迎"],["followBack","フォロバOK"],["dm","DM OK"],
  ["mutual","相互希望"],["silentFollow","無言フォローします"],["rt","RT歓迎"],["like","いいね歓迎"],["reply","リプ歓迎"],["casual","タメ口OK"],["nicknameOK","呼び捨てOK"]
] as const;

async function persistAvatar(image:string){
  if(typeof indexedDB==="undefined")return;
  const db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open("profile-book",1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains("assets"))r.result.createObjectStore("assets")};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
  await new Promise<void>((resolve,reject)=>{const tx=db.transaction("assets","readwrite");const store=tx.objectStore("assets");if(image)store.put(image,"avatar");else store.delete("avatar");tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)});db.close();
}
async function restoreAvatar(){
  if(typeof indexedDB==="undefined")return "";
  const db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open("profile-book",1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains("assets"))r.result.createObjectStore("assets")};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
  const image=await new Promise<string>((resolve,reject)=>{const r=db.transaction("assets","readonly").objectStore("assets").get("avatar");r.onsuccess=()=>resolve(typeof r.result==="string"?r.result:"");r.onerror=()=>reject(r.error)});db.close();return image;
}
function crc32(bytes:Uint8Array){
  let c=0xffffffff;
  for(const b of bytes){c^=b;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0);}
  return (c^0xffffffff)>>>0;
}
function withMetadata(dataUrl:string,payload:unknown){
  const raw=atob(dataUrl.split(",")[1]);const src=new Uint8Array(raw.length);
  for(let i=0;i<raw.length;i++)src[i]=raw.charCodeAt(i);
  const enc=new TextEncoder();const type=enc.encode("tEXt");const body=enc.encode("profile-book\0"+JSON.stringify(payload));
  const data=new Uint8Array(4+type.length+body.length+4);new DataView(data.buffer).setUint32(0,body.length);
  data.set(type,4);data.set(body,8);const crcInput=new Uint8Array(type.length+body.length);crcInput.set(type);crcInput.set(body,4);
  new DataView(data.buffer).setUint32(8+body.length,crc32(crcInput));
  const pos=src.length-12;const out=new Uint8Array(src.length+data.length);out.set(src.slice(0,pos));out.set(data,pos);out.set(src.slice(pos),pos+data.length);
  let s="";for(let i=0;i<out.length;i+=0x8000)s+=String.fromCharCode(...out.subarray(i,i+0x8000));
  return "data:image/png;base64,"+btoa(s);
}
async function readMetadata(file:File){
  const buf=new Uint8Array(await file.arrayBuffer());
  if(buf[0]!==137||buf[1]!==80||buf[2]!==78||buf[3]!==71)return null;
  let p=8;
  while(p+12<=buf.length){
    const len=new DataView(buf.buffer).getUint32(p);const type=String.fromCharCode(...buf.slice(p+4,p+8));
    if(type==="tEXt"){
      const data=buf.slice(p+8,p+8+len);const zero=data.indexOf(0);
      if(new TextDecoder().decode(data.slice(0,zero))==="profile-book"){
        try{return JSON.parse(new TextDecoder().decode(data.slice(zero+1)))}catch{return null}
      }
    }
    p+=12+len;if(type==="IEND")break;
  }
  return null;
}

const getStance = (value:string) => {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed as string[] : [];
  } catch {
    return [];
  }
};

const itemOptions = [
  ["nickname","呼び名","text"],["age","年齢","text"],["birthday","誕生日","text"],["mbti","MBTI","text"],
  ["from","出身","text"],["gender","性別","text"],
  ["favorite","好きなもの","chips"],["hobby","趣味","long"],["stance","SNSスタンス","stance"],
  ["landmine","地雷","long"],["connection","繋がり希望","long"],["free","フリースペース","long"]
] as const;

export default function Home(){
  const [template,setTemplate]=useState<Template>("book");
  const [font,setFont]=useState<FontKey>("rounded");
  const [colors,setColors]=useState(presets.sakura);
  const [avatarImage,setAvatarImage]=useState<string>("");
  const [avatarFileName,setAvatarFileName]=useState<string>("");
  const [profile,setProfile]=useState<Profile>({name:"",username:"",intro:"",items:[]});
  const [customLabel,setCustomLabel]=useState("");
  const [customKind,setCustomKind]=useState<Kind>("text");
  const [customDefs,setCustomDefs]=useState<CustomDef[]>([]);
  const [aboutOpen,setAboutOpen]=useState(false);
  const [mobileSaveUrl,setMobileSaveUrl]=useState<string>("");
  const cardRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{let active=true;void restoreAvatar().then(image=>{if(active&&image)setAvatarImage(image)}).catch(()=>{});const s=localStorage.getItem("profile-book-data");const savedAvatar=sessionStorage.getItem("profile-book-avatar");if(savedAvatar)setAvatarImage(savedAvatar);if(s){try{const x=JSON.parse(s);if(x.profile)setProfile(x.profile);if(x.customDefs)setCustomDefs(x.customDefs);if(x.avatarImage)setAvatarImage(x.avatarImage);if(x.avatarFileName)setAvatarFileName(x.avatarFileName);if(x.colors)setColors(x.colors);if(x.template)setTemplate(x.template);if(x.font)setFont(x.font)}catch{}}return()=>{active=false}},[]);
  useEffect(()=>{try{localStorage.setItem("profile-book-data",JSON.stringify({profile,customDefs,avatarFileName,colors,template,font}))}catch{}},[profile,customDefs,avatarFileName,colors,template,font]);
  useEffect(()=>{void persistAvatar(avatarImage).catch(()=>{});try{if(avatarImage)sessionStorage.setItem("profile-book-avatar",avatarImage);else sessionStorage.removeItem("profile-book-avatar")}catch{}},[avatarImage]);
  const selected=useMemo(()=>new Set(profile.items.map(x=>x.id)),[profile.items]);
  const update=(p:Partial<Profile>)=>setProfile(x=>({...x,...p}));
  const updateItem=(id:string,value:string)=>setProfile(x=>({...x,items:x.items.map(i=>i.id===id?{...i,value}:i)}));
  const addItem=(id:string,label:string,kind:Kind)=>{
    if(selected.has(id))return;
    setProfile(x=>{
      const added={id,label,value:kind==="check"?"ON":kind==="stance"?"[]":"",kind};
      const next=[...x.items,added];
      if(id!=="free"){const free=next.find(i=>i.id==="free");return {...x,items:free?next.filter(i=>i.id!=="free").concat(free):next}}
      return {...x,items:next};
    });
  };
  const addCustom=()=>{
    const label=customLabel.trim();if(!label)return;
    const id="custom-"+Date.now();
    setProfile(x=>({...x,items:[...x.items,{id,label,value:customKind==="stance"?"[]":"",kind:customKind,custom:true}]}));
    setCustomLabel("");
  };
  const moveItem=(index:number,direction:-1|1)=>{
    setProfile(x=>{const next=[...x.items];const target=index+direction;if(target<0||target>=next.length)return x;[next[index],next[target]]=[next[target],next[index]];return {...x,items:next}});
  };
  const toggleStance=(itemId:string,stanceId:string)=>{
    const item=profile.items.find(i=>i.id===itemId);
    if(!item)return;
    const current=getStance(item.value);
    const next=current.includes(stanceId)?current.filter(x=>x!==stanceId):[...current,stanceId];
    updateItem(itemId,JSON.stringify(next));
  };
  const removeItem=(id:string)=>setProfile(x=>({...x,items:x.items.filter(i=>i.id!==id)}));
  const addDefinedCustom=(def:CustomDef)=>addItem(def.id,def.label,def.kind);
  const isTall=(item:Item)=>item.kind==="long" ? (item.value.split("\n").length>3 || item.value.length>110) : item.kind==="stance" ? getStance(item.value).length>4 : false;
  const makePayload=()=>({version:1,profile,customDefs,avatarImage,avatarFileName,colors,template,font});
  const makePng=async()=>{if(!cardRef.current)return null;const png=await toPng(cardRef.current,{pixelRatio:2,cacheBust:true});return withMetadata(png,makePayload())};
  const exportCard=async()=>{const url=await makePng();if(!url)return;const mobile=/iPhone|iPad|iPod|Android/i.test(navigator.userAgent);if(mobile){setMobileSaveUrl(url);return;}const a=document.createElement("a");a.download="profile-book.png";a.href=url;a.click()};
  const shareCard=async()=>{const url=await makePng();if(!url)return;try{const res=await fetch(url);const blob=await res.blob();const file=new File([blob],"profile-book.png",{type:"image/png"});if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){await navigator.share({title:"SNSプロフィールカードを作成しました！｜Profile Book",text:"プロフィールカードを作成したよ！\n#プロフィールブック #プロフィールカード #ProfileBook",files:[file]});}else{await navigator.clipboard?.writeText("プロフィールカードを作成したよ！\n"+location.href+"\n#プロフィールブック #プロフィールカード #ProfileBook");alert("共有文とリンクをコピーしました！");}}catch{}};
  const handleImage=(e:React.ChangeEvent<HTMLInputElement>)=>{const file=e.target.files?.[0];if(!file)return;if(!file.type.startsWith("image/"))return;const reader=new FileReader();reader.onload=()=>{setAvatarImage(String(reader.result));setAvatarFileName(file.name)};reader.readAsDataURL(file)};
  const importPng=async(e:React.ChangeEvent<HTMLInputElement>)=>{
    const file=e.target.files?.[0];if(!file)return;
    const data=await readMetadata(file);
    if(!data?.profile){alert("Profile Bookで書き出したPNGではないようです。");return}
    setProfile(data.profile);if(data.customDefs)setCustomDefs(data.customDefs);if(data.avatarImage)setAvatarImage(data.avatarImage);if(data.avatarFileName)setAvatarFileName(data.avatarFileName);if(data.colors)setColors(data.colors);if(data.template)setTemplate(data.template);if(data.font)setFont(data.font);
    alert("プロフィールを復元しました！");e.target.value="";
  };


  return <main className="app">
    <Script src="https://www.googletagmanager.com/gtag/js?id=G-GNTX973GET" strategy="afterInteractive" />
    <Script id="google-analytics" strategy="afterInteractive">{`window.dataLayer = window.dataLayer || []; function gtag(){window.dataLayer.push(arguments);} gtag("js", new Date()); gtag("config", "G-GNTX973GET");`}</Script>
    <nav className="breadcrumb"><a href="https://mofu-mitsu.github.io/">ホーム</a><span>＜</span><a href="https://mofu-mitsu.github.io/contents.html">コンテンツ一覧</a><span>＜</span><strong>Profile Book</strong></nav>
    <header className="topbar"><div><span className="eyebrow">SNS PROFILE MAKER</span><h1>Profile Book <small>プロフィール帳</small></h1><p>必要な項目だけ選んで、自分だけのプロフィールカードを作ろう。</p><button className="about-open" onClick={()=>setAboutOpen(true)}>ⓘ このツールについて</button></div><div className="top-actions"><button className="share" onClick={shareCard}>共有する ↗</button><button className="export" onClick={exportCard}>PNGを書き出す ↗</button></div></header>
    <div className="workspace">
      <aside className="panel">
        <section className="restore-section"><h2>PNGから復元</h2><label className="upload-box restore-box">前回のPNGを読み込む<input type="file" accept="image/png" onChange={importPng}/></label><p className="hint">Profile Bookから書き出したPNGなら、入力内容・デザイン・画像まで復元できます。</p></section>
        <section><h2>基本情報</h2>
          <label>名前<input value={profile.name} onChange={e=>update({name:e.target.value})} placeholder="あなたの名前を入力してね"/></label>
          <label>ID<input value={profile.username} onChange={e=>update({username:e.target.value})} placeholder="@username など"/></label>
          <label>ひとこと<textarea rows={2} value={profile.intro} onChange={e=>update({intro:e.target.value})} placeholder="好きなことや一言をどうぞ…"/></label>
        </section>
        <section><div className="section-title"><h2>項目を追加</h2><span>{profile.items.length} selected</span></div>
          <div className="option-grid">{itemOptions.map(([id,label,kind])=><button key={id} className={selected.has(id)?"option selected":"option"} onClick={()=>selected.has(id)?removeItem(id):addItem(id,label,kind as Item["kind"])}><span>{selected.has(id)?"✓":"+"}</span>{label}</button>)}{customDefs.map(def=><button key={def.id} className={selected.has(def.id)?"option selected":"option custom-option"} onClick={()=>selected.has(def.id)?removeItem(def.id):addDefinedCustom(def)}><span>{selected.has(def.id)?"✓":"+"}</span>{def.label}</button>)}</div>
          <div className="custom-add"><h3>独自項目</h3><div className="custom-row"><input value={customLabel} onChange={e=>setCustomLabel(e.target.value)} placeholder="項目名を入力"/><select value={customKind} onChange={e=>setCustomKind(e.target.value as Kind)}><option value="text">一行</option><option value="long">長文</option><option value="chips">複数項目</option></select></div><button className="add-custom" onClick={addCustom}>＋ 新たに項目を追加</button></div>
        </section>
        <section><div className="section-title"><h2>選択した項目</h2><span>↑↓で並べ替え</span></div>
          {!profile.items.length&&<p className="hint">下の「項目を追加」から好きな項目を選んでね。</p>}
          {profile.items.map((item,index)=><div className="item-editor" key={item.id}>
            <div className="item-head"><strong>{item.label}</strong><div className="item-actions"><button disabled={index===0} onClick={()=>moveItem(index,-1)}>↑</button><button disabled={index===profile.items.length-1} onClick={()=>moveItem(index,1)}>↓</button><button className="delete" onClick={()=>removeItem(item.id)}>削除</button></div></div>
            {item.kind==="stance"?<div className="stance-checks">
              {stanceOptions.map(([id,label])=>{
                const checked=getStance(item.value).includes(id);
                return <label className="stance-check" key={id}><input type="checkbox" checked={checked} onChange={()=>toggleStance(item.id,id)}/><span>{label}</span></label>;
              })}
            </div>:
             item.kind==="check"?<div className="check-row"><button className={item.value==="ON"?"toggle on":"toggle"} onClick={()=>updateItem(item.id,item.value==="ON"?"OFF":"ON")}>{item.value==="ON"?"ON":"OFF"}</button><span>ONならカードに表示</span></div>:
             item.kind==="chips"?<div className="favorite-editor">{(item.value?item.value.split("\n"):[""]).map((v,i)=>{const values=item.value?item.value.split("\n"):[""];return <div className="repeat-row" key={i}><input value={v} onChange={e=>{values[i]=e.target.value;updateItem(item.id,values.join("\n"))}} placeholder={`項目${i+1}`}/><button onClick={()=>{values.splice(i,1);updateItem(item.id,values.join("\n"))}}>×</button></div>})}<button className="add-row" onClick={()=>updateItem(item.id,item.value+(item.value?"\n":""))}>＋ 項目を増やす</button></div>:
             item.kind==="long"?<textarea rows={2} value={item.value} onChange={e=>updateItem(item.id,e.target.value)} placeholder={item.label+"を入力…"} />:
             <input value={item.value} onChange={e=>updateItem(item.id,e.target.value)} placeholder={item.label+"を入力…"} />}
          </div>)}
        </section>
        <section><h2>デザイン</h2>
          <div className="design-grid">{(["book","minimal","pop","diary","holes","sticker","notebook","scrap"] as Template[]).map(t=><button key={t} className={template===t?"choice active":"choice"} onClick={()=>setTemplate(t)}>{t==="book"?"Profile Book":t==="minimal"?"Minimal":t==="pop"?"Pop":t==="diary"?"Diary":t==="holes"?"穴あき帳":t==="sticker"?"Sticker":t==="notebook"?"Notebook":"Scrap"}</button>)}</div>
          <h3 className="subheading">カラー</h3>
          <div className="choice-row">{Object.keys(presets).map(k=><button aria-label={k} key={k} className="color-dot" style={{background:presets[k as keyof typeof presets].main}} onClick={()=>setColors(presets[k as keyof typeof presets])}/>)}</div>
          <div className="color-inputs">{(["bg","main","accent","text"] as const).map(k=><label key={k}>{k}<input type="color" value={colors[k]} onChange={e=>setColors(c=>({...c,[k]:e.target.value}))}/></label>)}</div>
          <h3 className="subheading">フォント</h3>
          <select value={font} onChange={e=>setFont(e.target.value as FontKey)}><option value="sans">Clean Sans</option><option value="rounded">Rounded</option><option value="serif">Classic Serif</option><option value="mono">Mono</option><option value="cute">Cute Pop</option><option value="hand">手書き・雑文字</option></select>
        </section>
        <section><h2>プロフィール画像</h2>
          <label className="upload-box">{avatarImage ? "画像を変更する" : "画像を選ぶ"}<input type="file" accept="image/*" onChange={handleImage}/></label>
          {avatarImage&&<div className="uploaded-image-info"><span className="uploaded-image-check">✓</span><span className="uploaded-image-name" title={avatarFileName}>{avatarFileName || "画像を読み込み済み"}</span><button className="clear-image" onClick={()=>{setAvatarImage("");setAvatarFileName("")}}>削除</button></div>}
          <p className="hint">正方形に近い画像がおすすめ。カードの丸いアイコンに入ります。</p>
        </section>
        <section className="rakuten-widget"><h2>おすすめアイテム</h2><iframe title="楽天アフィリエイト" src="/rakuten-widget.html" width="468" height="180" loading="lazy" scrolling="no" /></section>
      </aside>
      <section className="preview-area"><div className="preview-label"><span>LIVE PREVIEW</span><span>1200px × 可変高</span></div>
        <div className="card-wrap"><div ref={cardRef} className={"profile-card template-"+template} style={{"--bg":colors.bg,"--main":colors.main,"--accent":colors.accent,"--text":colors.text,"--sub":colors.sub,"--font":fontMap[font]} as CSSProperties}>
          <div className="card-deco">✦</div><div className="card-top"><div className="avatar">{avatarImage?<img src={avatarImage} alt="" />:<span>{profile.name.slice(0,1)||"♡"}</span>}</div>
          <div className="identity"><div className="name">{profile.name||"Your Name"}</div><div className="handle">{profile.username||"@username"}</div><div className="intro">{profile.intro}</div></div>
          <div className="book-mark">PROFILE<br/>BOOK</div></div>
          <div className="items">{profile.items.map(item=><div className={"profile-item kind-"+item.kind+" "+(item.id==="free"?"is-free ":"")+((item.kind==="stance"?getStance(item.value).length:item.value.trim().length)>0?"has-value":"is-empty")+" "+(isTall(item)?"is-tall":"is-compact")} key={item.id}><div className="item-label"><span className="field-icon" aria-hidden="true">{item.id==="favorite"||item.label==="好きなもの"?"♡":item.id==="hobby"||item.label==="趣味"?"✦":item.id==="stance"||item.label==="SNSスタンス"?"⌘":item.id==="connection"||item.label==="繋がり希望"?"↔":item.id==="landmine"||item.label==="地雷"?"⚑":item.id==="free"||item.label==="フリースペース"?"✎":item.id==="birthday"?"✿":item.id==="mbti"?"◇":"♡"}</span>{item.label}</div>
            {item.kind==="stance"?<div className="stance-values">{getStance(item.value).map(id=>{const found=stanceOptions.find(x=>x[0]===id);return found?<span key={id}>✓ {found[1]}</span>:null})}{!getStance(item.value).length&&<span className="muted-value">—</span>}</div>:
             item.kind==="check"?<div className="check-value">{item.value==="ON"?"✓ OK":"—"}</div>:
             item.kind==="chips"?<div className="chips">{item.value.split("\n").map((x,i)=>x.trim()&&<span key={i}>{x.trim()}</span>)}</div>:
             <div className="item-value">{item.value||"—"}</div>}
          </div>)}</div>
          {!profile.items.length&&<div className="empty-card">左の「項目を追加」から<br/>好きなページを選んでね ♡</div>}
          <div className="card-footer"><span>♡ let’s be friends!</span><span>profile-book</span></div>
        </div></div>
      </section>
    </div>
    {mobileSaveUrl&&<div className="modal-backdrop save-backdrop" role="presentation" onClick={()=>setMobileSaveUrl("")}>
      <div className="about-modal save-modal" role="dialog" aria-modal="true" aria-labelledby="save-title" onClick={e=>e.stopPropagation()}>
        <button className="modal-close" onClick={()=>setMobileSaveUrl("")} aria-label="閉じる">×</button>
        <h2 id="save-title">画像を長押しして保存してね ♡</h2>
        <p>下のプロフィール画像を長押しして、「写真に保存」または「画像を保存」を選んでね。</p>
        <div className="save-image-scroll"><img src={mobileSaveUrl} alt="作成したプロフィールカード。画像を長押しして保存できます。" /></div>
        <p className="about-note">画像が大きいときは、枠の中をスクロールして確認できます。</p>
        <button className="save-close-button" onClick={()=>setMobileSaveUrl("")}>閉じる</button>
      </div>
    </div>}
    {aboutOpen&&<div className="modal-backdrop" role="presentation" onClick={()=>setAboutOpen(false)}>
      <div className="about-modal" role="dialog" aria-modal="true" aria-labelledby="about-title" onClick={e=>e.stopPropagation()}>
        <button className="modal-close" onClick={()=>setAboutOpen(false)} aria-label="閉じる">×</button>
        <h2 id="about-title"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 0 9 9A9 9 0 0 0 12 3Zm0 4.1a1.2 1.2 0 1 1-1.2 1.2A1.2 1.2 0 0 1 12 7.1Zm1.5 10h-3v-1.5h.75v-4h-.75v-1.5h2.25v5.5h.75Z"/></svg>このツールについて</h2>
        <p>Profile Bookは、SNSで使える横長のプロフィールカードを、プロフィール帳みたいに好きな項目だけ選んで作れるメーカーです。</p>
        <ul><li>使いたい項目だけ追加・削除できます。</li><li>好きなものや独自項目は、必要な数だけ増やせます。</li><li>デザイン・カラー・フォント・画像を自由に組み合わせられます。</li><li>PNGには編集データを埋め込むので、あとから「PNGから復元」できます。</li></ul>
        <p className="about-note">入力した内容はブラウザに自動保存されます。共有時はPNG画像をそのまま送れます。</p>
      </div>
    </div>}
  </main>
}