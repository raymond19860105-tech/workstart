const byId = (id) => document.getElementById(id);
const pad = (value) => String(value).padStart(2, "0");

function refreshClock() {
  const now = new Date();
  byId("clock").textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  byId("seconds").textContent = pad(now.getSeconds());
  byId("date").textContent = now.toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric", weekday: "long" });
}

function refreshStatus() {
  const clockIn = localStorage.getItem("pulse-clock-in");
  const clockOut = localStorage.getItem("pulse-clock-out");
  byId("clock-in").textContent = clockIn || "尚未打卡";
  byId("clock-out").textContent = clockOut || "— —";
  byId("status").textContent = clockOut ? "今日已完成" : clockIn ? "工作中" : "尚未打卡";
  byId("status").classList.toggle("working", Boolean(clockIn && !clockOut));
  byId("punch").querySelector("b").textContent = clockOut ? "今日已完成" : clockIn ? "下班打卡" : "上班打卡";
  byId("punch").disabled = Boolean(clockOut);
}

byId("punch").addEventListener("click", () => {
  const value = `${pad(new Date().getHours())}:${pad(new Date().getMinutes())}`;
  const clockIn = localStorage.getItem("pulse-clock-in");
  const clockOut = localStorage.getItem("pulse-clock-out");
  if (!clockIn) localStorage.setItem("pulse-clock-in", value);
  else if (!clockOut) localStorage.setItem("pulse-clock-out", value);
  refreshStatus();
  const toast = byId("toast");
  toast.textContent = `✓ 打卡成功 · ${value}`;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2600);
});

refreshClock();
refreshStatus();
setInterval(refreshClock, 1000);
