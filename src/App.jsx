import { useState, useCallback } from "react";

const ZONES = ["미지정", "앞좌석", "사이드", "일반"];
const ZONE_COLORS = {
  미지정: { bg: "#2a2a2a", text: "#666", border: "#333" },
  앞좌석: { bg: "#1a2a1a", text: "#4ade80", border: "#2d5a2d" },
  사이드: { bg: "#1a1a2a", text: "#60a5fa", border: "#2d2d5a" },
  일반: { bg: "#2a2a2a", text: "#d4d4d4", border: "#444" },
};

// Seat layout: 5 columns, rows per col: 5,5,5,5,6
// col index 0 = 열1 (사이드), col 4 = 열5 (사이드)
// col 1,2,3 rows 0,1 = 앞좌석, rest = 일반
const COL_ROWS = [5, 5, 5, 5, 6];

function getSeatZone(col, row) {
  if (col === 0 || col === 4) return "사이드";
  if (row <= 1) return "앞좌석";
  return "일반";
}

function buildSeats() {
  const seats = [];
  for (let col = 0; col < 5; col++) {
    for (let row = 0; row < COL_ROWS[col]; row++) {
      seats.push({ col, row, zone: getSeatZone(col, row), student: null });
    }
  }
  return seats;
}

const INITIAL_SEATS = buildSeats();

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function SeatingApp() {
  const FIXED_STUDENTS = [
    "고다은","김보미","김수진","김예은","김예주","김유민","김지송",
    "박고나","박민주","박서윤","박서현","박지혜","박채연","성지은",
    "안소윤","유경연","윤예지","윤정원","이영채","장하선","전서연",
    "조민선","주현경","한다솜","최서희","홍태희"
  ].map((name, i) => ({ id: i, name, zone: "미지정" }));

  const [step, setStep] = useState("assign");
  const [students, setStudents] = useState(FIXED_STUDENTS);
  const [seats, setSeats] = useState(INITIAL_SEATS);
  const [animating, setAnimating] = useState(false);

  const animating_placeholder = false; // keep for ref

  const cycleZone = (id) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, zone: ZONES[(ZONES.indexOf(s.zone) + 1) % ZONES.length] }
          : s
      )
    );
  };

  const setZone = (id, zone) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, zone } : s))
    );
  };

  const handleRandomize = () => {
    setAnimating(true);
    setTimeout(() => {
      // Group students by zone
      const byZone = { 앞좌석: [], 사이드: [], 일반: [], 미지정: [] };
      students.forEach((s) => byZone[s.zone].push(s));

      // Shuffle each group
      Object.keys(byZone).forEach((z) => (byZone[z] = shuffle(byZone[z])));

      // Assign to seats by zone
      const newSeats = INITIAL_SEATS.map((seat) => ({ ...seat, student: null }));
      const seatsByZone = { 앞좌석: [], 사이드: [], 일반: [] };
      newSeats.forEach((seat, i) => seatsByZone[seat.zone].push(i));

      // Place students
      ["앞좌석", "사이드", "일반"].forEach((zone) => {
        const zoneStudents = [...byZone[zone], ...byZone["미지정"].splice(0)];
        // only place up to available seats
        seatsByZone[zone].forEach((seatIdx, i) => {
          if (i < zoneStudents.length) {
            newSeats[seatIdx] = { ...newSeats[seatIdx], student: zoneStudents[i] };
          }
        });
      });

      setSeats(newSeats);
      setStep("result");
      setAnimating(false);
    }, 600);
  };

  const countByZone = (zone) => students.filter((s) => s.zone === zone).length;
  const seatCountByZone = {
    앞좌석: INITIAL_SEATS.filter((s) => s.zone === "앞좌석").length,
    사이드: INITIAL_SEATS.filter((s) => s.zone === "사이드").length,
    일반: INITIAL_SEATS.filter((s) => s.zone === "일반").length,
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      color: "#e5e5e5",
      fontFamily: "'DM Mono', 'Courier New', monospace",
      padding: "32px 24px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=DM+Sans:wght@300;400;600&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #111; }
        ::-webkit-scrollbar-thumb { background: #333; }
        .zone-badge { cursor: pointer; transition: all 0.15s; user-select: none; }
        .zone-badge:hover { filter: brightness(1.3); transform: scale(1.05); }
        .seat-cell { transition: all 0.3s; }
        .seat-cell:hover { filter: brightness(1.2); }
        .btn { cursor: pointer; transition: all 0.2s; border: none; }
        .btn:hover { filter: brightness(1.15); transform: translateY(-1px); }
        .btn:active { transform: translateY(0); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.4s ease forwards; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.6s linear infinite; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 32, borderBottom: "1px solid #1f1f1f", paddingBottom: 24 }}>
        <div style={{ fontSize: 11, color: "#444", letterSpacing: 3, marginBottom: 8 }}>
          CLASSROOM OPTIMIZER
        </div>
        <h1 style={{ margin: 0, fontSize: 28, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, letterSpacing: -1 }}>
          자리 배치기
        </h1>
        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          {["구역 지정", "배치 결과"].map((label, i) => (
            <div key={i} style={{
              padding: "4px 12px",
              fontSize: 11,
              letterSpacing: 1,
              borderRadius: 2,
              background: step === ["assign","result"][i] ? "#e5e5e5" : "#1a1a1a",
              color: step === ["assign","result"][i] ? "#0a0a0a" : "#444",
            }}>{label}</div>
          ))}
        </div>
      </div>

      {/* STEP 2: Assign zones */}
      {step === "assign" && (
        <div className="fade-in">
          <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
            {/* Student list */}
            <div style={{ flex: "1 1 300px" }}>
              <div style={{ fontSize: 11, color: "#444", letterSpacing: 2, marginBottom: 16 }}>
                학생 목록 — 클릭해서 구역 변경
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {students.map((s) => (
                  <div key={s.id} style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    background: "#111",
                    border: "1px solid #1f1f1f",
                    borderRadius: 3,
                  }}>
                    <span style={{ fontSize: 13, color: "#ccc" }}>{s.name}</span>
                    <div style={{ display: "flex", gap: 4 }}>
                      {["앞좌석", "사이드", "일반"].map((zone) => (
                        <div key={zone} className="zone-badge" onClick={() => setZone(s.id, zone)} style={{
                          padding: "3px 8px",
                          fontSize: 10,
                          borderRadius: 2,
                          letterSpacing: 0.5,
                          border: `1px solid ${s.zone === zone ? ZONE_COLORS[zone].border : "#222"}`,
                          background: s.zone === zone ? ZONE_COLORS[zone].bg : "transparent",
                          color: s.zone === zone ? ZONE_COLORS[zone].text : "#333",
                        }}>{zone}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Zone summary */}
            <div style={{ flex: "0 0 200px" }}>
              <div style={{ fontSize: 11, color: "#444", letterSpacing: 2, marginBottom: 16 }}>
                구역 현황
              </div>
              {["앞좌석", "사이드", "일반", "미지정"].map((zone) => (
                <div key={zone} style={{
                  padding: "12px 16px",
                  marginBottom: 8,
                  background: ZONE_COLORS[zone].bg,
                  border: `1px solid ${ZONE_COLORS[zone].border}`,
                  borderRadius: 3,
                }}>
                  <div style={{ fontSize: 10, color: ZONE_COLORS[zone].text, letterSpacing: 1, marginBottom: 4 }}>
                    {zone}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 500, color: ZONE_COLORS[zone].text }}>
                    {countByZone(zone)}
                    <span style={{ fontSize: 11, color: "#444", marginLeft: 6 }}>
                      / {seatCountByZone[zone] ?? "—"}석
                    </span>
                  </div>
                </div>
              ))}

              <button className="btn" onClick={handleRandomize} disabled={animating} style={{
                marginTop: 16,
                width: "100%",
                padding: "14px",
                background: animating ? "#1a1a1a" : "#e5e5e5",
                color: animating ? "#444" : "#0a0a0a",
                borderRadius: 2,
                fontSize: 13,
                fontFamily: "'DM Mono', monospace",
                fontWeight: 500,
                letterSpacing: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}>
                {animating ? (
                  <><span className="spin" style={{ display: "inline-block" }}>⟳</span> 배치 중...</>
                ) : "🎲 랜덤 배치"}
              </button>

            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Result */}
      {step === "result" && (
        <div className="fade-in">
          <div style={{ marginBottom: 20, display: "flex", gap: 12, alignItems: "center" }}>
            <button className="btn" onClick={handleRandomize} style={{
              padding: "10px 20px",
              background: "#e5e5e5",
              color: "#0a0a0a",
              borderRadius: 2,
              fontSize: 12,
              fontFamily: "'DM Mono', monospace",
              letterSpacing: 1,
            }}>
              🎲 다시 돌리기
            </button>
            <button className="btn" onClick={() => setStep("assign")} style={{
              padding: "10px 20px",
              background: "transparent",
              color: "#666",
              borderRadius: 2,
              fontSize: 12,
              fontFamily: "'DM Mono', monospace",
              letterSpacing: 1,
              border: "1px solid #222",
            }}>
              ← 구역 수정
            </button>
            <div style={{ fontSize: 11, color: "#333", marginLeft: "auto", letterSpacing: 1 }}>
              {["앞좌석","사이드","일반"].map(z => (
                <span key={z} style={{ marginRight: 16, color: ZONE_COLORS[z].text }}>
                  {z} {seats.filter(s=>s.zone===z && s.student).length}
                </span>
              ))}
            </div>
          </div>

          {/* Seating grid */}
          <div style={{ overflowX: "auto" }}>
            {/* Blackboard */}
            <div style={{
              width: "fit-content",
              margin: "0 auto 8px",
              padding: "6px 80px",
              background: "#1a2a1a",
              border: "1px solid #2d5a2d",
              borderRadius: 2,
              fontSize: 10,
              color: "#4ade80",
              letterSpacing: 3,
              textAlign: "center",
            }}>칠판</div>

            <div style={{
              display: "flex",
              gap: 6,
              justifyContent: "center",
              alignItems: "flex-start",
              padding: "8px 0",
            }}>
              {/* Label: 복도 */}
              <div style={{ writingMode: "vertical-rl", fontSize: 9, color: "#333", letterSpacing: 2, paddingTop: 8 }}>복도</div>

              {/* Columns */}
              {[0,1,2,3,4].map((col) => {
                const colSeats = seats.filter(s => s.col === col).sort((a,b) => a.row - b.row);
                return (
                  <div key={col} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {colSeats.map((seat) => {
                      const zc = ZONE_COLORS[seat.zone];
                      return (
                        <div key={`${col}-${seat.row}`} className="seat-cell" style={{
                          width: 80,
                          height: 52,
                          background: seat.student ? zc.bg : "#111",
                          border: `1px solid ${seat.student ? zc.border : "#1a1a1a"}`,
                          borderRadius: 3,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: 4,
                        }}>
                          {seat.student ? (
                            <>
                              <div style={{ fontSize: 9, color: zc.text, letterSpacing: 0.5, opacity: 0.7 }}>
                                {seat.zone}
                              </div>
                              <div style={{ fontSize: 13, color: zc.text, fontWeight: 500, textAlign: "center", lineHeight: 1.2 }}>
                                {seat.student.name}
                              </div>
                            </>
                          ) : (
                            <div style={{ fontSize: 9, color: "#2a2a2a" }}>빈 자리</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {/* Label: 창문 */}
              <div style={{ writingMode: "vertical-rl", fontSize: 9, color: "#333", letterSpacing: 2, paddingTop: 8 }}>창문</div>
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 16 }}>
            {["앞좌석","사이드","일반"].map(zone => (
              <div key={zone} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                <div style={{ width: 10, height: 10, background: ZONE_COLORS[zone].bg, border: `1px solid ${ZONE_COLORS[zone].border}`, borderRadius: 1 }}/>
                <span style={{ color: "#444" }}>{zone}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
