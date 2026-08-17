"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Attendance = { id: number; date: string; weekday: string; start: string; end: string; hours: string; status: string };
type LeaveRequest = { id: number; type: string; start: string; end: string; days: number; reason: string; status: string };

const history: Attendance[] = [
  { id: 1, date: "8月14日", weekday: "週五", start: "09:02", end: "18:07", hours: "8小時 05分", status: "準時" },
  { id: 2, date: "8月13日", weekday: "週四", start: "08:56", end: "18:12", hours: "8小時 16分", status: "準時" },
  { id: 3, date: "8月12日", weekday: "週三", start: "09:08", end: "18:01", hours: "7小時 53分", status: "補登" },
];

const leaveTypes = [
  { name: "特別休假", limit: "依年資計算", pay: "工資照給", tone: "green" },
  { name: "普通傷病假", limit: "未住院每年 30 日", pay: "30 日內工資折半", tone: "blue" },
  { name: "事假", limit: "每年 14 日", pay: "不給工資", tone: "amber" },
  { name: "婚假", limit: "8 日", pay: "工資照給", tone: "rose" },
  { name: "喪假", limit: "依親屬關係 3–8 日", pay: "工資照給", tone: "slate" },
  { name: "公假", limit: "依實際需要", pay: "工資照給", tone: "purple" },
];

function pad(value: number) { return String(value).padStart(2, "0"); }
function timeText(date = new Date()) { return `${pad(date.getHours())}:${pad(date.getMinutes())}`; }
function dateDiff(start: string, end: string) {
  if (!start || !end) return 0;
  return Math.max(1, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1);
}
function tenureSince(hireDate: string, now = new Date()) {
  const start = new Date(`${hireDate}T00:00:00`);
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  if (now.getDate() < start.getDate()) months -= 1;
  if (months < 0) { years -= 1; months += 12; }
  const totalMonths = Math.max(0, years * 12 + months);
  return { years: Math.floor(totalMonths / 12), months: totalMonths % 12, totalMonths };
}
function annualLeaveDays(totalMonths: number) {
  if (totalMonths < 6) return 0;
  if (totalMonths < 12) return 3;
  const years = Math.floor(totalMonths / 12);
  if (years < 2) return 7;
  if (years < 3) return 10;
  if (years < 5) return 14;
  if (years < 10) return 15;
  return Math.min(30, 16 + (years - 10));
}

export default function Home() {
  const [now, setNow] = useState<Date | null>(null);
  const [clockIn, setClockIn] = useState<string | null>(null);
  const [clockOut, setClockOut] = useState<string | null>(null);
  const [clockInAt, setClockInAt] = useState<number | null>(null);
  const [hireDate, setHireDate] = useState("2023-04-17");
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const initialize = window.setTimeout(() => {
      setNow(new Date());
      setClockIn(localStorage.getItem("pulse-clock-in"));
      setClockOut(localStorage.getItem("pulse-clock-out"));
      const storedClockInAt = localStorage.getItem("pulse-clock-in-at");
      setClockInAt(storedClockInAt ? Number(storedClockInAt) : null);
      setHireDate(localStorage.getItem("pulse-hire-date") || "2023-04-17");
      const stored = localStorage.getItem("pulse-leave-requests");
      if (stored) setRequests(JSON.parse(stored));
    }, 0);
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => { window.clearTimeout(initialize); window.clearInterval(timer); };
  }, []);

  const tenure = useMemo(() => tenureSince(hireDate, now || new Date()), [hireDate, now]);
  const annualTotal = annualLeaveDays(tenure.totalMonths);
  const annualUsed = requests.filter(item => item.type === "特別休假").reduce((sum, item) => sum + item.days, 0);
  const annualRemaining = Math.max(0, annualTotal - annualUsed);
  const cooldownRemaining = clockInAt && now ? Math.max(0, 60 - Math.floor((now.getTime() - clockInAt) / 1000)) : 0;
  const dateLabel = now?.toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric", weekday: "long" }) ?? "正在同步時間…";

  const punch = () => {
    const value = timeText();
    if (!clockIn) {
      const timestamp = Date.now();
      setClockIn(value); setClockInAt(timestamp);
      localStorage.setItem("pulse-clock-in", value); localStorage.setItem("pulse-clock-in-at", String(timestamp));
      setToast(`上班打卡成功 · ${value}`);
    } else if (!clockOut && cooldownRemaining === 0) {
      if (!window.confirm("確定要下班打卡嗎？送出後將無法再次修改。")) return;
      setClockOut(value); localStorage.setItem("pulse-clock-out", value); setToast(`下班打卡成功 · ${value}`);
    }
    window.setTimeout(() => setToast(""), 2800);
  };

  const updateHireDate = (value: string) => { setHireDate(value); localStorage.setItem("pulse-hire-date", value); };
  const submitLeave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const start = String(form.get("start"));
    const end = String(form.get("end"));
    const next: LeaveRequest = {
      id: Date.now(), type: String(form.get("type")), start, end,
      days: dateDiff(start, end), reason: String(form.get("reason")), status: "待審核",
    };
    const updated = [next, ...requests];
    setRequests(updated); localStorage.setItem("pulse-leave-requests", JSON.stringify(updated));
    event.currentTarget.reset(); setToast("請假申請已送出"); window.setTimeout(() => setToast(""), 2800);
  };

  const workStatus = clockOut ? "今日已完成" : clockIn ? "工作中" : "尚未打卡";
  const buttonText = clockOut ? "今日已完成" : cooldownRemaining > 0 ? `防誤觸 ${cooldownRemaining} 秒` : clockIn ? "下班打卡" : "上班打卡";

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Pulse 首頁"><span className="brand-mark"><i /><i /><i /></span><b>Pulse</b></a>
        <nav aria-label="主要導覽"><a className="active" href="#today">今日打卡</a><a href="#leave">請假管理</a><a href="#records">出勤紀錄</a><a href="#summary">工時統計</a></nav>
        <div className="profile"><span className="avatar">RY</span><div><b>Raymond</b><small>產品設計師</small></div><span className="chevron">⌄</span></div>
      </header>

      <section id="top" className="hero">
        <div className="hero-copy"><p className="eyebrow">REMOTE WORKSPACE</p><h1>早安，Raymond <span>☀</span></h1><p>新的一天，專注做好重要的事。</p></div>
        <div className="connection"><span /><div><b>連線狀態良好</b><small>台北市 · 居家辦公</small></div></div>
      </section>

      <div className="content-grid">
        <section id="today" className="clock-card">
          <div className="date-line"><span>{dateLabel}</span><em className={clockIn && !clockOut ? "working" : ""}>{workStatus}</em></div>
          <div className="clock" aria-live="polite">{now ? `${pad(now.getHours())}:${pad(now.getMinutes())}` : "--:--"}<sup>{now ? pad(now.getSeconds()) : "--"}</sup></div>
          <p className="timezone">台北標準時間 GMT+8</p>
          <button className="punch" onClick={punch} disabled={Boolean(clockOut) || cooldownRemaining > 0}><span className="fingerprint">◎</span>{buttonText}</button>
          <p className="hint">{cooldownRemaining > 0 ? "已鎖定下班按鈕，避免連續點擊誤打卡" : clockIn && !clockOut ? "下班打卡前會再次請你確認" : "打卡即代表你目前位於所登記的遠端工作地點"}</p>
          <div className="today-row"><div><span className="dot green" /><p>上班時間</p><b>{clockIn ?? "尚未打卡"}</b></div><i /><div><span className="dot coral" /><p>下班時間</p><b>{clockOut ?? "— —"}</b></div></div>
        </section>

        <aside id="summary" className="side-column">
          <div className="tenure-card">
            <div className="tenure-top"><div><p>服務年資</p><h2>{tenure.years}<span>年</span> {tenure.months}<span>個月</span></h2></div><span className="tenure-badge">在職中</span></div>
            <label>到職日<input type="date" value={hireDate} onChange={e => updateHireDate(e.target.value)} /></label>
            <div className="annual-summary"><div><small>法定特休</small><b>{annualTotal} 日</b></div><div><small>已申請</small><b>{annualUsed} 日</b></div><div><small>剩餘</small><b>{annualRemaining} 日</b></div></div>
          </div>
          <div className="week-card"><div className="card-heading"><div><p>本週工時</p><h2>32<span>小時</span> 14<span>分</span></h2></div><span className="trend">↗ 6%</span></div><div className="goal"><span>本週目標</span><b>40 小時</b></div><div className="progress"><i /></div></div>
        </aside>
      </div>

      <section id="leave" className="leave-section">
        <div className="section-title"><div><p className="eyebrow">LEAVE MANAGEMENT</p><h2>請假與假別</h2></div><span className="law-note">依台灣現行法定最低標準整理</span></div>
        <div className="leave-layout">
          <div className="leave-catalog">
            {leaveTypes.map(item => <article className="leave-type" key={item.name}><span className={`leave-icon ${item.tone}`}>{item.name.slice(0, 1)}</span><div><h3>{item.name}</h3><p>{item.limit}</p><small>{item.pay}</small></div></article>)}
            <p className="legal-disclaimer">實際可請日數、證明文件與給薪方式仍依個別情況及公司優於法令之規定辦理。</p>
          </div>
          <form className="leave-form" onSubmit={submitLeave}>
            <div><p className="eyebrow">NEW REQUEST</p><h3>提出請假申請</h3></div>
            <label>假別<select name="type" required>{leaveTypes.map(item => <option key={item.name}>{item.name}</option>)}</select></label>
            <div className="form-row"><label>開始日期<input name="start" type="date" required /></label><label>結束日期<input name="end" type="date" required /></label></div>
            <label>請假原因<textarea name="reason" rows={3} placeholder="簡要說明請假原因" required /></label>
            <button type="submit">送出申請 <span>→</span></button>
          </form>
        </div>
        {requests.length > 0 && <div className="request-list"><h3>近期申請</h3>{requests.slice(0, 3).map(item => <div className="request-item" key={item.id}><span className="request-date">{item.start}<small>至 {item.end}</small></span><b>{item.type}</b><span>{item.days} 日</span><em>{item.status}</em></div>)}</div>}
        <div className="law-links"><b>法規參考</b><a href="https://laws.mol.gov.tw/FLAW/PrintFLAWDAT0201.aspx?id=FL014930&ldate=20240731" target="_blank" rel="noreferrer">勞動基準法第 38 條 ↗</a><a href="https://laws.mol.gov.tw/FLAW/FLAWDAT05.aspx?id=FL014935" target="_blank" rel="noreferrer">勞工請假規則 ↗</a><span>資訊僅供管理參考，不構成法律意見。</span></div>
      </section>

      <section id="records" className="records">
        <div className="section-title"><div><p className="eyebrow">RECENT ACTIVITY</p><h2>近期出勤</h2></div></div>
        <div className="table-wrap"><table><thead><tr><th>日期</th><th>上班</th><th>下班</th><th>總工時</th><th>狀態</th></tr></thead><tbody>{history.map(item => <tr key={item.id}><td><b>{item.date}</b><small>{item.weekday}</small></td><td>{item.start}</td><td>{item.end}</td><td>{item.hours}</td><td><span className={item.status === "補登" ? "tag amber" : "tag"}>{item.status}</span></td></tr>)}</tbody></table></div>
      </section>

      <footer><span>Pulse</span><p>讓每個工作日，都有清晰的開始與結束。</p><small>© 2026 Pulse Workspace</small></footer>
      {toast && <div className="toast" role="status"><span>✓</span>{toast}</div>}
    </main>
  );
}
