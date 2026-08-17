const byId = (id) => document.getElementById(id);
const pad = (value) => String(value).padStart(2, "0");
let requests = JSON.parse(localStorage.getItem("pulse-leave-requests") || "[]");
let corrections = JSON.parse(localStorage.getItem("pulse-correction-requests") || "[]");

function annualDays(months) {
  if (months < 6) return 0;
  if (months < 12) return 3;
  const years = Math.floor(months / 12);
  if (years < 2) return 7;
  if (years < 3) return 10;
  if (years < 5) return 14;
  if (years < 10) return 15;
  return Math.min(30, 16 + years - 10);
}

function refreshTenure() {
  const hire = new Date(`${byId("hire-date").value}T00:00:00`);
  const now = new Date();
  let years = now.getFullYear() - hire.getFullYear();
  let months = now.getMonth() - hire.getMonth() - (now.getDate() < hire.getDate() ? 1 : 0);
  if (months < 0) { years -= 1; months += 12; }
  const totalMonths = Math.max(0, years * 12 + months);
  const total = annualDays(totalMonths);
  const used = requests.filter(item => item.type === "特別休假").reduce((sum, item) => sum + item.days, 0);
  byId("years").textContent = Math.floor(totalMonths / 12);
  byId("months").textContent = totalMonths % 12;
  byId("annual-total").textContent = `${total} 日`;
  byId("annual-used").textContent = `${used} 日`;
  byId("annual-left").textContent = `${Math.max(0, total - used)} 日`;
}

function refreshRequests() {
  byId("request-list").hidden = requests.length === 0;
  byId("request-items").innerHTML = requests.slice(0, 3).map(item => `<div class="request-item"><span class="request-date">${item.start}<small>至 ${item.end}</small></span><b>${item.type}</b><span>${item.days} 日</span><em>待審核</em></div>`).join("");
  refreshTenure();
}

function refreshClock() {
  const now = new Date();
  byId("clock").textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  byId("seconds").textContent = pad(now.getSeconds());
  byId("date").textContent = now.toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric", weekday: "long" });
}

function refreshStatus() {
  const clockIn = localStorage.getItem("pulse-clock-in");
  const clockOut = localStorage.getItem("pulse-clock-out");
  const clockInAt = Number(localStorage.getItem("pulse-clock-in-at") || 0);
  const cooldown = clockInAt ? Math.max(0, 60 - Math.floor((Date.now() - clockInAt) / 1000)) : 0;
  byId("clock-in").textContent = clockIn || "尚未打卡";
  byId("clock-out").textContent = clockOut || "— —";
  byId("status").textContent = clockOut ? "今日已完成" : clockIn ? "工作中" : "尚未打卡";
  byId("status").classList.toggle("working", Boolean(clockIn && !clockOut));
  byId("punch").querySelector("b").textContent = clockOut ? "今日已完成" : cooldown > 0 ? `防誤觸 ${cooldown} 秒` : clockIn ? "下班打卡" : "上班打卡";
  byId("punch").disabled = Boolean(clockOut) || cooldown > 0;
  document.querySelector(".hint").textContent = cooldown > 0 ? "已鎖定下班按鈕，避免連續點擊誤打卡" : clockIn && !clockOut ? "下班打卡前會再次請你確認" : "打卡即代表你目前位於所登記的遠端工作地點";
}

byId("punch").addEventListener("click", () => {
  const value = `${pad(new Date().getHours())}:${pad(new Date().getMinutes())}`;
  const clockIn = localStorage.getItem("pulse-clock-in");
  const clockOut = localStorage.getItem("pulse-clock-out");
  if (!clockIn) {
    localStorage.setItem("pulse-clock-in", value);
    localStorage.setItem("pulse-clock-in-at", String(Date.now()));
  } else if (!clockOut) {
    if (!confirm("確定要下班打卡嗎？送出後將無法再次修改。")) return;
    localStorage.setItem("pulse-clock-out", value);
  }
  refreshStatus();
  const toast = byId("toast");
  toast.textContent = `✓ 打卡成功 · ${value}`;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2600);
});

byId("hire-date").value = localStorage.getItem("pulse-hire-date") || "2023-04-17";
byId("hire-date").addEventListener("change", (event) => { localStorage.setItem("pulse-hire-date", event.target.value); refreshTenure(); });
byId("leave-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(event.target);
  const start = String(data.get("start"));
  const end = String(data.get("end"));
  const days = Math.max(1, Math.round((new Date(end) - new Date(start)) / 86400000) + 1);
  requests.unshift({ type: String(data.get("type")), start, end, days, reason: String(data.get("reason")) });
  localStorage.setItem("pulse-leave-requests", JSON.stringify(requests));
  event.target.reset(); refreshRequests();
  const toast = byId("toast"); toast.textContent = "✓ 請假申請已送出"; toast.classList.add("show"); setTimeout(() => toast.classList.remove("show"), 2600);
});

function refreshCorrections() {
  const list = byId("correction-list");
  list.hidden = corrections.length === 0;
  if (corrections.length) {
    const item = corrections[0];
    list.innerHTML = `<div><span>更正申請</span><b>${item.date} · ${item.kind}</b><small>更正為 ${item.correctTime}</small></div><em>待審核</em>`;
  }
}

byId("correction-toggle").addEventListener("click", () => {
  const form = byId("correction-form");
  form.hidden = !form.hidden;
  byId("correction-toggle").textContent = form.hidden ? "申請打卡更正" : "取消";
  if (!form.hidden) form.elements.date.value = new Date().toISOString().slice(0, 10);
});
byId("correction-cancel").addEventListener("click", () => {
  byId("correction-form").hidden = true; byId("correction-toggle").textContent = "申請打卡更正";
});
byId("correction-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(event.target);
  corrections.unshift({ date: String(data.get("date")), kind: String(data.get("kind")), correctTime: String(data.get("correctTime")), reason: String(data.get("reason")) });
  localStorage.setItem("pulse-correction-requests", JSON.stringify(corrections));
  event.target.reset(); event.target.hidden = true; byId("correction-toggle").textContent = "申請打卡更正"; refreshCorrections();
  const toast = byId("toast"); toast.textContent = "✓ 打卡更正申請已送出"; toast.classList.add("show"); setTimeout(() => toast.classList.remove("show"), 2600);
});

refreshClock();
refreshStatus();
refreshRequests();
refreshCorrections();
setInterval(refreshClock, 1000);
setInterval(refreshStatus, 1000);
