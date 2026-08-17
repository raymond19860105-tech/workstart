"use client";

import { useEffect, useMemo, useState } from "react";

type RecordItem = { id: number; date: string; weekday: string; start: string; end: string; hours: string; status: string };

const history: RecordItem[] = [
  { id: 1, date: "8月14日", weekday: "週五", start: "09:02", end: "18:07", hours: "8小時 05分", status: "準時" },
  { id: 2, date: "8月13日", weekday: "週四", start: "08:56", end: "18:12", hours: "8小時 16分", status: "準時" },
  { id: 3, date: "8月12日", weekday: "週三", start: "09:08", end: "18:01", hours: "7小時 53分", status: "補登" },
];

function pad(value: number) { return String(value).padStart(2, "0"); }
function timeText(date = new Date()) { return `${pad(date.getHours())}:${pad(date.getMinutes())}`; }

export default function Home() {
  const [now, setNow] = useState<Date | null>(null);
  const [clockIn, setClockIn] = useState<string | null>(null);
  const [clockOut, setClockOut] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const initialize = window.setTimeout(() => {
      setNow(new Date());
      setClockIn(localStorage.getItem("pulse-clock-in"));
      setClockOut(localStorage.getItem("pulse-clock-out"));
    }, 0);
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => {
      window.clearTimeout(initialize);
      window.clearInterval(timer);
    };
  }, []);

  const dateLabel = useMemo(() => now?.toLocaleDateString("zh-TW", {
    year: "numeric", month: "long", day: "numeric", weekday: "long",
  }) ?? "正在同步時間…", [now]);

  const punch = () => {
    const value = timeText();
    if (!clockIn) {
      setClockIn(value); localStorage.setItem("pulse-clock-in", value); setToast(`上班打卡成功 · ${value}`);
    } else if (!clockOut) {
      setClockOut(value); localStorage.setItem("pulse-clock-out", value); setToast(`下班打卡成功 · ${value}`);
    }
    window.setTimeout(() => setToast(""), 2800);
  };

  const workStatus = clockOut ? "今日已完成" : clockIn ? "工作中" : "尚未打卡";
  const buttonText = clockOut ? "今日已完成" : clockIn ? "下班打卡" : "上班打卡";

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Pulse 首頁"><span className="brand-mark"><i /><i /><i /></span><b>Pulse</b></a>
        <nav aria-label="主要導覽"><a className="active" href="#today">今日打卡</a><a href="#records">出勤紀錄</a><a href="#summary">工時統計</a></nav>
        <div className="profile"><button className="bell" aria-label="通知">●</button><span className="avatar">YL</span><div><b>雅玲</b><small>產品設計師</small></div><span className="chevron">⌄</span></div>
      </header>

      <section id="top" className="hero">
        <div className="hero-copy"><p className="eyebrow">REMOTE WORKSPACE</p><h1>早安，雅玲 <span>☀</span></h1><p>新的一天，專注做好重要的事。</p></div>
        <div className="connection"><span /><div><b>連線狀態良好</b><small>台北市 · 居家辦公</small></div></div>
      </section>

      <div className="content-grid">
        <section id="today" className="clock-card">
          <div className="date-line"><span>{dateLabel}</span><em className={clockIn && !clockOut ? "working" : ""}>{workStatus}</em></div>
          <div className="clock" aria-live="polite">{now ? `${pad(now.getHours())}:${pad(now.getMinutes())}` : "--:--"}<sup>{now ? pad(now.getSeconds()) : "--"}</sup></div>
          <p className="timezone">台北標準時間 GMT+8</p>
          <button className="punch" onClick={punch} disabled={Boolean(clockOut)}><span className="fingerprint">◎</span>{buttonText}</button>
          <p className="hint">打卡即代表你目前位於所登記的遠端工作地點</p>
          <div className="today-row">
            <div><span className="dot green" /><p>上班時間</p><b>{clockIn ?? "尚未打卡"}</b></div>
            <i />
            <div><span className="dot coral" /><p>下班時間</p><b>{clockOut ?? "— —"}</b></div>
          </div>
        </section>

        <aside id="summary" className="side-column">
          <div className="week-card">
            <div className="card-heading"><div><p>本週工時</p><h2>32<span>小時</span> 14<span>分</span></h2></div><span className="trend">↗ 6%</span></div>
            <div className="goal"><span>本週目標</span><b>40 小時</b></div><div className="progress"><i /></div>
            <div className="bars" aria-label="本週每日工時圖"><div><i style={{height:"72%"}}/><span>一</span></div><div><i style={{height:"88%"}}/><span>二</span></div><div><i style={{height:"81%"}}/><span>三</span></div><div><i style={{height:"92%"}}/><span>四</span></div><div className="today"><i style={{height:"12%"}}/><span>五</span></div></div>
          </div>
          <div className="quote"><span>“</span><p>專注不是對所有事說好，<br/>而是對最重要的事說好。</p><small>— Steve Jobs</small></div>
        </aside>
      </div>

      <section id="records" className="records">
        <div className="section-title"><div><p className="eyebrow">RECENT ACTIVITY</p><h2>近期出勤</h2></div><button>查看完整紀錄 <span>→</span></button></div>
        <div className="table-wrap"><table><thead><tr><th>日期</th><th>上班</th><th>下班</th><th>總工時</th><th>狀態</th></tr></thead><tbody>{history.map(item => <tr key={item.id}><td><b>{item.date}</b><small>{item.weekday}</small></td><td>{item.start}</td><td>{item.end}</td><td>{item.hours}</td><td><span className={item.status === "補登" ? "tag amber" : "tag"}>{item.status}</span></td></tr>)}</tbody></table></div>
      </section>

      <footer><span>Pulse</span><p>讓每個工作日，都有清晰的開始與結束。</p><small>© 2026 Pulse Workspace</small></footer>
      {toast && <div className="toast" role="status"><span>✓</span>{toast}</div>}
    </main>
  );
}
