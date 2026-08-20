 "use client";

import { useEffect, useMemo, useState } from "react";

type DayExpense = {
  lunch: number;
  dinner: number;
  extras: number;
  extrasLabel: string;
};

type PocketExpense = {
  id: string;
  date: string;
  amount: number;
  note: string;
};

type Store = {
  daily: Record<string, DayExpense>;
  pocket: {
    amount: number;
    start: string;
    end: string;
    expenses: PocketExpense[];
  };
};

const DAILY_LIMIT = 70;

const emptyDay = (): DayExpense => ({ lunch: 0, dinner: 0, extras: 0, extrasLabel: "" });

function money(n: number) {
  return `¥${Number(n || 0).toFixed(1).replace(".0", "")}`;
}

function isoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function monthLabel(d: Date) {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function Home() {
  const now = new Date();
  const today = isoDate(now);
  const [month, setMonth] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [selected, setSelected] = useState(today);
  const [store, setStore] = useState<Store>({
    daily: {},
    pocket: { amount: 0, start: today, end: today, expenses: [] },
  });
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<"daily" | "pocket">("daily");

  useEffect(() => {
    const raw = localStorage.getItem("pocket-pink-tracker");
    if (raw) {
      try { setStore(JSON.parse(raw)); } catch {}
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem("pocket-pink-tracker", JSON.stringify(store));
  }, [store, loaded]);

  const current = store.daily[selected] || emptyDay();
  const selectedTotal = current.lunch + current.dinner + current.extras;
  const selectedDiff = selectedTotal - DAILY_LIMIT;

  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const blanks = first.getDay();
    return Array.from({ length: blanks + last.getDate() }, (_, i) =>
      i < blanks ? null : new Date(month.getFullYear(), month.getMonth(), i - blanks + 1)
    );
  }, [month]);

  const monthStats = useMemo(() => {
    let spent = 0, budget = 0;
    const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;
    Object.entries(store.daily).forEach(([date, x]) => {
      if (date.startsWith(monthKey) && date <= today) {
        spent += x.lunch + x.dinner + x.extras;
        budget += DAILY_LIMIT;
      }
    });
    return { spent, budget, diff: budget - spent };
  }, [store.daily, month, today]);

  function updateDay(field: keyof DayExpense, value: string) {
    setStore(s => ({
      ...s,
      daily: {
        ...s.daily,
        [selected]: { ...(s.daily[selected] || emptyDay()), [field]: field === "extrasLabel" ? value : Number(value) || 0 }
      }
    }));
  }

  function changeMonth(delta: number) {
    setMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1));
  }

  const pocketSpent = store.pocket.expenses.reduce((sum, x) => sum + x.amount, 0);
  const pocketLeft = store.pocket.amount - pocketSpent;
  const start = store.pocket.start ? new Date(store.pocket.start + "T12:00:00") : null;
  const end = store.pocket.end ? new Date(store.pocket.end + "T12:00:00") : null;
  const elapsedRatio = start && end && end >= start
    ? Math.min(1, Math.max(0, (now.getTime() - start.getTime()) / Math.max(1, end.getTime() - start.getTime())))
    : 0;
  const remainingRatio = store.pocket.amount > 0 ? pocketLeft / store.pocket.amount : 1;
  const pocketWarning = elapsedRatio > 0 && elapsedRatio < 0.5 && remainingRatio < 0.5 && pocketLeft >= 0;

  function addPocketExpense() {
    const amount = window.prompt("How much did you spend? (¥)");
    if (!amount) return;
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return;
    const note = window.prompt("What was it for?") || "little treat";
    setStore(s => ({
      ...s,
      pocket: {
        ...s.pocket,
        expenses: [...s.pocket.expenses, { id: crypto.randomUUID(), date: today, amount: value, note }]
      }
    }));
  }

  return (
    <main className="page">
      <div className="sparkle sparkle1">✦</div>
      <div className="sparkle sparkle2">♡</div>
      <div className="appShell">
        <header className="header">
          <div>
            <div className="eyebrow">♡ my little money diary</div>
            <h1>Pocket Pink</h1>
            <p>small choices, softer spending ✧</p>
          </div>
          <div className="todayPill">today · {today.slice(5).replace("-", ".")}</div>
        </header>

        <nav className="tabs">
          <button className={tab === "daily" ? "active" : ""} onClick={() => setTab("daily")}>♡ daily diary</button>
          <button className={tab === "pocket" ? "active" : ""} onClick={() => setTab("pocket")}>🎀 my pocket money</button>
        </nav>

        {tab === "daily" ? (
          <section className="grid">
            <div className="card calendarCard">
              <div className="cardTop">
                <button className="iconBtn" onClick={() => changeMonth(-1)}>‹</button>
                <h2>{monthLabel(month)}</h2>
                <button className="iconBtn" onClick={() => changeMonth(1)}>›</button>
              </div>
              <div className="legend">
                <span><i className="dot green" /> saved / just right</span>
                <span><i className="dot red" /> over 70</span>
              </div>
              <div className="weekdays">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(x => <span key={x}>{x}</span>)}</div>
              <div className="calendar">
                {days.map((d, i) => {
                  if (!d) return <div className="emptyDay" key={i} />;
                  const date = isoDate(d);
                  const x = store.daily[date];
                  const total = x ? x.lunch + x.dinner + x.extras : 0;
                  const hasEntry = !!x;
                  const over = total > DAILY_LIMIT;
                  return (
                    <button
                      key={date}
                      className={`dateCell ${selected === date ? "selected" : ""} ${hasEntry ? (over ? "over" : "ok") : ""} ${date === today ? "isToday" : ""}`}
                      onClick={() => setSelected(date)}
                    >
                      <span>{d.getDate()}</span>
                      {hasEntry && <small>{money(total)}</small>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="card entryCard">
              <div className="entryHeader">
                <div>
                  <div className="eyebrow">{selected === today ? "TODAY ♡" : selected}</div>
                  <h2>How did today go?</h2>
                </div>
                <div className={`diffBadge ${selectedDiff > 0 ? "bad" : "good"}`}>
                  {selectedDiff > 0 ? `+${money(selectedDiff)}` : `−${money(Math.abs(selectedDiff))}`}
                </div>
              </div>

              <label>🍱 lunch <span>target ¥30</span></label>
              <input type="number" step="0.1" value={current.lunch || ""} onChange={e => updateDay("lunch", e.target.value)} placeholder="0" />

              <label>🥤 dinner <span>target ¥25</span></label>
              <input type="number" step="0.1" value={current.dinner || ""} onChange={e => updateDay("dinner", e.target.value)} placeholder="0" />

              <label>☕ coffee / 🧋 milk tea / 🛒 supermarket <span>extras</span></label>
              <div className="twoInputs">
                <input type="number" step="0.1" value={current.extras || ""} onChange={e => updateDay("extras", e.target.value)} placeholder="0" />
                <input value={current.extrasLabel} onChange={e => updateDay("extrasLabel", e.target.value)} placeholder="what was it? ♡" />
              </div>

              <div className={`dailyTotal ${selectedDiff > 0 ? "badText" : "goodText"}`}>
                <span>today's total</span>
                <strong>{money(selectedTotal)}</strong>
                <small>{selectedDiff > 0 ? `¥${selectedDiff.toFixed(1)} over your ¥70 goal` : `¥${Math.abs(selectedDiff).toFixed(1)} under your ¥70 goal`}</small>
              </div>
            </div>

            <div className={`card monthlySummary ${monthStats.diff >= 0 ? "softGreen" : "softRed"}`}>
              <div>
                <div className="eyebrow">♡ this month</div>
                <h2>{monthStats.diff >= 0 ? `you've saved ${money(monthStats.diff)} ✧` : `you've spent ${money(Math.abs(monthStats.diff))} over ✧`}</h2>
                <p>{money(monthStats.spent)} spent · {money(monthStats.budget)} budgeted from recorded days</p>
              </div>
              <div className="bigFlower">{monthStats.diff >= 0 ? "🌷" : "🥺"}</div>
            </div>
          </section>
        ) : (
          <section className="pocketSection">
            <div className="card pocketSetup">
              <div className="eyebrow">♡ pocket money</div>
              <h2>Your little allowance</h2>
              <p className="muted">You can change this every half-month — it doesn't have to be the same amount.</p>
              <div className="setupGrid">
                <div><label>amount you received</label><input type="number" value={store.pocket.amount || ""} onChange={e => setStore(s => ({...s, pocket:{...s.pocket, amount:Number(e.target.value)||0}}))} placeholder="¥1200" /></div>
                <div><label>period starts</label><input type="date" value={store.pocket.start} onChange={e => setStore(s => ({...s, pocket:{...s.pocket, start:e.target.value}}))} /></div>
                <div><label>period ends</label><input type="date" value={store.pocket.end} onChange={e => setStore(s => ({...s, pocket:{...s.pocket, end:e.target.value}}))} /></div>
              </div>
              {pocketWarning && <div className="warning">🎀 tiny warning: more than half of your allowance is gone, but the period is not halfway yet. Maybe slow down a little, pretty girl ♡</div>}
              <div className="pocketNumbers">
                <div><span>spent</span><strong>{money(pocketSpent)}</strong></div>
                <div><span>left</span><strong>{money(pocketLeft)}</strong></div>
                <div><span>remaining</span><strong>{store.pocket.amount ? `${Math.max(0, remainingRatio * 100).toFixed(0)}%` : "—"}</strong></div>
              </div>
              <div className="progress"><div style={{width:`${store.pocket.amount ? Math.max(0, Math.min(100, remainingRatio * 100)) : 0}%`}} /></div>
            </div>

            <div className="card pocketList">
              <div className="entryHeader">
                <div><div className="eyebrow">♡ little purchases</div><h2>Where did it go?</h2></div>
                <button className="pinkButton" onClick={addPocketExpense}>＋ add expense</button>
              </div>
              {store.pocket.expenses.length === 0 ? (
                <div className="emptyPocket">No little purchases yet ✧<br/><span>coffee, records, snacks, anything you buy with your own money.</span></div>
              ) : (
                <div className="expenseList">
                  {[...store.pocket.expenses].reverse().map(x => (
                    <div className="expenseRow" key={x.id}>
                      <div><strong>{x.note}</strong><small>{x.date}</small></div>
                      <span>−{money(x.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}