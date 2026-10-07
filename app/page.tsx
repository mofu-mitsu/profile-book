"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";

type Template = "book" | "minimal" | "pop" | "diary";
type FontKey = "sans" | "rounded" | "serif" | "mono" | "cute";
type Item = { id:string; label:string; value:string; kind:"text"|"long"|"check"|"chips" };
type Profile = { name:string; username:string; intro:string; items:Item[] };

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
  cute:"'Comic Sans MS','Hiragino Maru Gothic ProN',sans-serif"
};
const itemOptions = [
  ["nickname","呼び名","text"],["age","年齢","text"],["birthday","誕生日","text"],["mbti","MBTI","text"],
  ["socionics","ソシオニクス","text"],["enneagram","エニアグラム","text"],["from","出身","text"],["gender","性別","text"],
  ["favorite","好きなもの","chips"],["hobby","趣味","long"],["stance","SNSスタンス","long"],
  ["follow","フォロー","check"],["followBack","フォロバ","check"],["reply","リプ","check"],["dm","DM","check"],["mutual","相互","check"],
  ["landmine","地雷","long"],["connection","繋がり希望","long"],["free","フリースペース","long"]
] as const;

export default function Home(){
  const [template,setTemplate]=useState<Template>("book");
  const [font,setFont]=useState<FontKey>("rounded");
  const [colors,setColors]=useState(presets.sakura);
  const [profile,setProfile]=useState<Profile>({
    name:"みつき",username:"@mofu_mitsu",intro:"好きなものを好きなだけ。",
    items:[
      {id:"mbti",label:"MBTI",value:"INTJ",kind:"text"},
      {id:"favorite",label:"好きなもの",value:"Web制作 / ゲーム / かわいいもの",kind:"chips"},
      {id:"connection",label:"繋がり希望",value:"気軽に話しかけてください！",kind:"long"}
    ]
  });
  const cardRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{const s=localStorage.getItem("profile-book-data");if(s){try{const x=JSON.parse(s);if(x.profile)setProfile(x.profile);if(x.colors)setColors(x.colors);if(x.template)setTemplate(x.template);if(x.font)setFont(x.font)}catch{}}},[]);
  useEffect(()=>{localStorage.setItem("profile-book-data",JSON.stringify({profile,colors,template,font}))},[profile,colors,template,font]);
  const selected=useMemo(()=>new Set(profile.items.map(x=>x.id)),[profile.items]);
  const update=(p:Partial<Profile>)=>setProfile(x=>({...x,...p}));
  const updateItem=(id:string,value:string)=>setProfile(x=>({...x,items:x.items.map(i=>i.id===id?{...i,value}:i)}));
  const addItem=(id:string,label:string,kind:Item["kind"])=>{if(selected.has(id))return;setProfile(x=>({...x,items:[...x.items,{id,label,value:kind==="check"?"ON":"",kind}]}))};
  const removeItem=(id:string)=>setProfile(x=>({...x,items:x.items.filter(i=>i.id!==id)}));
  const exportCard=async()=>{if(!cardRef.current)return;const url=await toPng(cardRef.current,{pixelRatio:2,cacheBust:true});const a=document.createElement("a");a.download="profile-book.png";a.href=url;a.click()};

  return <main className="app">
    <header className="topbar"><div><span className="eyebrow">SNS PROFILE MAKER</span><h1>Profile Book <small>プロフィール帳</small></h1><p>必要な項目だけ選んで、自分だけのプロフィールカードを作ろう。</p></div><button className="export" onClick={exportCard}>PNGを書き出す ↗</button></header>
    <div className="workspace">
      <aside className="panel">
        <section><h2>基本情報</h2>
          <label>名前<input value={profile.name} onChange={e=>update({name:e.target.value})} placeholder="名前"/></label>
          <label>ID<input value={profile.username} onChange={e=>update({username:e.target.value})} placeholder="@username"/></label>
          <label>ひとこと<textarea rows={2} value={profile.intro} onChange={e=>update({intro:e.target.value})}/></label>
        </section>
        <section><div className="section-title"><h2>項目を追加</h2><span>{profile.items.length} selected</span></div>
          <div className="option-grid">{itemOptions.map(([id,label,kind])=><button key={id} className={selected.has(id)?"option selected":"option"} onClick={()=>selected.has(id)?removeItem(id):addItem(id,label,kind as Item["kind"])}><span>{selected.has(id)?"✓":"+"}</span>{label}</button>)}</div>
        </section>
        <section><h2>選択した項目</h2>
          {!profile.items.length&&<p className="hint">上から好きな項目を選んでね。</p>}
          {profile.items.map(item=><div className="item-editor" key={item.id}>
            <div className="item-head"><strong>{item.label}</strong><button onClick={()=>removeItem(item.id)}>削除</button></div>
            {item.kind==="check"?<div className="check-row"><button className={item.value==="ON"?"toggle on":"toggle"} onClick={()=>updateItem(item.id,item.value==="ON"?"OFF":"ON")}>{item.value==="ON"?"ON":"OFF"}</button><span>ONならカードに表示</span></div>:
             item.kind==="chips"?<input value={item.value} onChange={e=>updateItem(item.id,e.target.value)} placeholder="好きなものを / で区切る"/>:
             item.kind==="long"?<textarea rows={4} value={item.value} onChange={e=>updateItem(item.id,e.target.value)} placeholder={item.label+"を入力…"} />:
             <input value={item.value} onChange={e=>updateItem(item.id,e.target.value)} placeholder={item.label+"を入力…"} />}
          </div>)}
        </section>
        <section><h2>デザイン</h2>
          <div className="choice-row">{(["book","minimal","pop","diary"] as Template[]).map(t=><button key={t} className={template===t?"choice active":"choice"} onClick={()=>setTemplate(t)}>{t==="book"?"Profile Book":t==="minimal"?"Minimal":t==="pop"?"Pop":"Diary"}</button>)}</div>
          <div className="choice-row">{Object.keys(presets).map(k=><button key={k} className="color-dot" style={{background:presets[k as keyof typeof presets].main}} onClick={()=>setColors(presets[k as keyof typeof presets])}/>)}</div>
          <div className="color-inputs">{(["bg","main","accent","text"] as const).map(k=><label key={k}>{k}<input type="color" value={colors[k]} onChange={e=>setColors(c=>({...c,[k]:e.target.value}))}/></label>)}</div>
          <select value={font} onChange={e=>setFont(e.target.value as FontKey)}><option value="sans">Clean Sans</option><option value="rounded">Rounded</option><option value="serif">Classic Serif</option><option value="mono">Mono</option><option value="cute">Cute Pop</option></select>
        </section>
      </aside>
      <section className="preview-area"><div className="preview-label"><span>LIVE PREVIEW</span><span>1200 × 630</span></div>
        <div className="card-wrap"><div ref={cardRef} className={"profile-card template-"+template} style={{"--bg":colors.bg,"--main":colors.main,"--accent":colors.accent,"--text":colors.text,"--sub":colors.sub,"--font":fontMap[font]} as React.CSSProperties}>
          <div className="card-deco">✦</div><div className="card-top"><div className="avatar"><span>{profile.name.slice(0,1)||"♡"}</span></div>
          <div className="identity"><div className="name">{profile.name||"Your Name"}</div><div className="handle">{profile.username||"@username"}</div><div className="intro">{profile.intro}</div></div>
          <div className="book-mark">PROFILE<br/>BOOK</div></div>
          <div className="items">{profile.items.map(item=><div className={"profile-item kind-"+item.kind} key={item.id}><div className="item-label">{item.label}</div>
            {item.kind==="check"?<div className="check-value">{item.value==="ON"?"✓ OK":"—"}</div>:item.kind==="chips"?<div className="chips">{item.value.split("/").map((x,i)=>x.trim()&&<span key={i}>{x.trim()}</span>)}</div>:<div className="item-value">{item.value||"—"}</div>}
          </div>)}</div>
          {!profile.items.length&&<div className="empty-card">左の「項目を追加」から<br/>好きなページを選んでね ♡</div>}
          <div className="card-footer"><span>♡ let’s be friends!</span><span>profile-book</span></div>
        </div></div>
      </section>
    </div>
  </main>
}