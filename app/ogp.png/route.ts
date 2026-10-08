import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Profile Book SNSプロフィールカードメーカー";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function GET() {
  return new ImageResponse(
    <div style={{ width: "1200px", height: "630px", display: "flex", position: "relative", overflow: "hidden", background: "linear-gradient(135deg,#fff6fb 0%,#f8f0ff 55%,#eaf7ff 100%)", color: "#473848", fontFamily: "sans-serif" }}>
      <div style={{ position: "absolute", right: "-45px", top: "-95px", width: "310px", height: "310px", borderRadius: "50%", background: "#ffffff99" }} />
      <div style={{ position: "absolute", left: "-70px", bottom: "-115px", width: "330px", height: "330px", borderRadius: "50%", background: "#ffd7e966" }} />
      <div style={{ display: "flex", flexDirection: "column", padding: "72px 0 0 76px", width: "600px", zIndex: 2 }}>
        <div style={{ color: "#b16e98", fontSize: 17, fontWeight: 700, letterSpacing: 5 }}>SNS PROFILE MAKER</div>
        <div style={{ fontSize: 64, fontWeight: 800, marginTop: 24 }}>Profile Book</div>
        <div style={{ color: "#8f718c", fontSize: 27, marginTop: 8 }}>プロフィール帳メーカー</div>
        <div style={{ color: "#665669", fontSize: 20, marginTop: 28, width: 510, lineHeight: 1.5 }}>好きな項目を選んで、わたしだけのプロフィールカードに。</div>
        <div style={{ display: "flex", gap: 10, marginTop: 38 }}>
          {["♡ 自由にカスタム", "✦ 8 designs", "PNG export"].map((label, i) => <div key={label} style={{ display: "flex", alignItems: "center", border: "1px solid " + ["#efc8dc","#d9c9ef","#c8e3ef"][i], background: "#ffffffdd", color: ["#a15c83","#8465a8","#56849b"][i], borderRadius: 24, padding: "12px 15px", fontSize: 14, fontWeight: 700 }}>{label}</div>)}
        </div>
        <div style={{ marginTop: 70, color: "#ad7e9a", fontSize: 15, fontWeight: 700, letterSpacing: 2 }}>MAKE YOUR OWN PROFILE BOOK  ♡</div>
      </div>
      <div style={{ position: "absolute", right: 95, top: 84, width: 430, height: 455, transform: "rotate(3deg)", borderRadius: 24, background: "#fffdf1", border: "2px solid #e8bd43", boxShadow: "0 18px 35px #8b6d942e", display: "flex", flexDirection: "column", padding: "28px 25px 24px 52px", gap: 12 }}>
        <div style={{ position: "absolute", left: 13, top: 20, display: "flex", flexDirection: "column", gap: 32 }}>{[0,1,2,3,4,5,6].map(n => <div key={n} style={{ width: 15, height: 15, borderRadius: 99, border: "2px solid #e8bd43", background: "#fff" }} />)}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 18, background: "#fff", border: "1px solid #f1dfa0", borderRadius: 15, padding: 18, height: 110 }}>
          <div style={{ width: 58, height: 58, borderRadius: 40, background: "linear-gradient(135deg,#ff9fca,#c59be9)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 32 }}>♡</div>
          <div style={{ display: "flex", flexDirection: "column" }}><div style={{ color: "#c68d24", fontSize: 12, fontWeight: 700 }}>MY PROFILE</div><div style={{ color: "#57475a", fontSize: 24, fontWeight: 700, marginTop: 4 }}>Your Name ♡</div><div style={{ color: "#98869b", fontSize: 13, marginTop: 3 }}>@your_id</div></div>
        </div>
        <div style={{ display: "flex", gap: 10, height: 78 }}>
          <div style={{ display: "flex", flexDirection: "column", flex: 1, background: "#fff", border: "1px solid #f1dfa0", borderRadius: 12, padding: 12 }}><div style={{ color: "#d99c35", fontSize: 12, fontWeight: 700 }}>♡ FAVORITE</div><div style={{ display: "flex", gap: 5, marginTop: 12 }}><div style={{ background: "#fff0a9", borderRadius: 14, padding: "5px 10px", fontSize: 10 }}>music</div><div style={{ background: "#fff0a9", borderRadius: 14, padding: "5px 10px", fontSize: 10 }}>games</div></div></div>
          <div style={{ display: "flex", flexDirection: "column", flex: 1, background: "#fff", border: "1px solid #f1dfa0", borderRadius: 12, padding: 12 }}><div style={{ color: "#d99c35", fontSize: 12, fontWeight: 700 }}>⌘ SNS STYLE</div><div style={{ display: "flex", gap: 5, marginTop: 12 }}><div style={{ background: "#fff0a9", borderRadius: 14, padding: "5px 10px", fontSize: 10 }}>Follow OK</div><div style={{ background: "#fff0a9", borderRadius: 14, padding: "5px 10px", fontSize: 10 }}>DM OK</div></div></div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", height: 86, background: "#fff", border: "1px solid #f1dfa0", borderRadius: 12, padding: 12 }}><div style={{ color: "#d99c35", fontSize: 12, fontWeight: 700 }}>✦ ABOUT ME</div><div style={{ height: 5, background: "#f1dca0", borderRadius: 8, marginTop: 13, width: "92%" }} /><div style={{ height: 5, background: "#f1dca0", borderRadius: 8, marginTop: 9, width: "76%" }} /></div>
        <div style={{ display: "flex", flexDirection: "column", height: 70, background: "#fff", border: "1px solid #f1dfa0", borderRadius: 12, padding: 12 }}><div style={{ color: "#d99c35", fontSize: 12, fontWeight: 700 }}>↔ LET'S CONNECT!</div><div style={{ height: 5, background: "#f1dca0", borderRadius: 8, marginTop: 12, width: "84%" }} /></div>
      </div>
    </div>,
    { ...size }
  );
}
