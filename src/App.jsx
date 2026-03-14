import { useState, useMemo } from "react";
import "./App.css";

const ZONES = ["미지정", "앞좌석", "사이드", "일반"];
const ZONE_COLORS = {
  미지정: { bg: "#f4efe1", text: "#7d6b52", border: "#cdba98" },
  앞좌석: { bg: "#f3d0b0", text: "#8d4722", border: "#c48a60" },
  사이드: { bg: "#d2e6f3", text: "#2f6088", border: "#90b3d1" },
  일반: { bg: "#e5e2d0", text: "#6d5f44", border: "#b4a27f" },
};
const COL_ROWS = [5, 5, 5, 5, 6];
const SHUFFLE_PHASE = { IDLE: "idle", PREVIEW: "preview", FINAL: "final", DONE: "done" };

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

function assignByZone(allStudents) {
  const newSeats = INITIAL_SEATS.map((seat) => ({ ...seat, student: null }));
  const zoneStudent = { 앞좌석: [], 사이드: [], 일반: [], 미지정: [] };
  allStudents.forEach((s) => zoneStudent[s.zone].push(s));
  ["앞좌석", "사이드", "일반", "미지정"].forEach((z) => {
    zoneStudent[z] = shuffle(zoneStudent[z]);
  });

  const seatIndices = { 앞좌석: [], 사이드: [], 일반: [] };
  newSeats.forEach((seat, i) => {
    if (seat.zone !== "미지정") seatIndices[seat.zone].push(i);
  });

  ["앞좌석", "사이드", "일반"].forEach((z) => {
    const candidates = [...zoneStudent[z], ...zoneStudent["미지정"]];
    seatIndices[z].forEach((idx, si) => {
      if (si < candidates.length) newSeats[idx].student = candidates[si];
    });
  });

  return newSeats;
}

export default function SeatingApp() {
  const FIXED_STUDENTS = useMemo(
    () =>
      [
        "고다은","김보미","김수진","김예은","김예주","김유민","김지송",
        "박고나","박민주","박서윤","박서현","박지혜","박채연","성지은",
        "안소윤","유경연","윤예지","윤정원","이영채","장하선","전서연",
        "조민선","주현경","한다솜","최서희","홍태희",
      ].map((name, i) => ({ id: i, name, zone: "미지정" })),
    []
  );

  const [step, setStep] = useState("assign");
  const [students, setStudents] = useState(FIXED_STUDENTS);
  const [seats, setSeats] = useState(INITIAL_SEATS);
  const [isShuffling, setIsShuffling] = useState(false);
  const [shuffleStage, setShuffleStage] = useState(SHUFFLE_PHASE.IDLE);
  const [shuffleProgress, setShuffleProgress] = useState(0);
  const [toast, setToast] = useState("");

  const countByZone = useMemo(() => {
    return ZONES.reduce((acc, zone) => {
      acc[zone] = students.filter((s) => s.zone === zone).length;
      return acc;
    }, {});
  }, [students]);

  const seatCountByZone = useMemo(() => {
    return INITIAL_SEATS.reduce((acc, s) => {
      acc[s.zone] = (acc[s.zone] || 0) + 1;
      return acc;
    }, {});
  }, []);

  const seatsByCol = useMemo(() => {
    return [0, 1, 2, 3, 4].map((col) =>
      seats.filter((s) => s.col === col).sort((a, b) => a.row - b.row)
    );
  }, [seats]);

  const showToast = (message, phase) => {
    setToast(message);
    setShuffleStage(phase);
    setTimeout(() => {
      setToast("");
      if (phase === SHUFFLE_PHASE.DONE) setShuffleStage(SHUFFLE_PHASE.IDLE);
    }, 1100);
  };

  const runFinalAssignment = () => {
    const finalSeats = assignByZone(students);
    setSeats(finalSeats);
    setShuffleProgress(100);
    setShuffleStage(SHUFFLE_PHASE.DONE);
    showToast("최종 자리 배치 완료!", SHUFFLE_PHASE.DONE);
    setTimeout(() => setStep("result"), 300);
    setIsShuffling(false);
  };

  const animateShuffle = () => {
    if (isShuffling) return;
    setIsShuffling(true);
    setShuffleStage(SHUFFLE_PHASE.PREVIEW);
    setShuffleProgress(0);
    setToast("첫 셔플 시작...");

    const rounds = 5;
    let current = 0;

    const runRound = () => {
      current += 1;
      const previewSeats = assignByZone(shuffle(students));
      setSeats(previewSeats);
      setShuffleProgress(Math.round((current / rounds) * 55));

      if (current < rounds) {
        setTimeout(runRound, 90);
      } else {
        showToast("첫 셔플 완료! 최종 셔플 준비 중...", SHUFFLE_PHASE.PREVIEW);
        setTimeout(() => {
          setShuffleStage(SHUFFLE_PHASE.FINAL);
          setToast("최종 셔플 중...");
          setShuffleProgress(65);
          setTimeout(() => {
            runFinalAssignment();
          }, 250);
        }, 260);
      }
    };
    runRound();
  };

  const setZone = (id, zone) => {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, zone } : s)));
  };

  const displayClass = () =>
    `seat-cell${isShuffling ? " preview" : shuffleStage === SHUFFLE_PHASE.FINAL ? " finalize" : ""}`;

  return (
    <div className="classroom-app">
      {toast && <div className={`shuffle-toast ${shuffleStage}`}>{toast}</div>}
      <div className="frame">
        <div className="retro-header">
          <h1>랜덤 자리 배치기</h1>
          <div className="status-chip">{step === "assign" ? "구역 지정" : "결과 확인"}</div>
        </div>

        <div className="progress">
          <div className="progress-inner" style={{ width: `${shuffleProgress}%` }} />
        </div>

        <div className="top-area">
          <div className="panel">
            <h2>학생 목록 (클릭하여 구역 변경)</h2>
            {students.map((s) => (
              <div className="student-row" key={s.id}>
                <span>{s.name}</span>
                <div style={{ display: "flex", gap: 5 }}>
                  {["앞좌석", "사이드", "일반"].map((zone) => (
                    <div
                      key={`${s.id}-${zone}`}
                      className={`zone-badge${s.zone === zone ? " active" : ""}`}
                      onClick={() => setZone(s.id, zone)}
                    >
                      {zone}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="panel">
            <h2>구역 현황</h2>
            {["앞좌석", "사이드", "일반", "미지정"].map((zone) => (
              <div className="status-row" key={zone}>
                <div
                  className="status-box"
                  style={{ background: ZONE_COLORS[zone].bg, color: ZONE_COLORS[zone].text, borderColor: ZONE_COLORS[zone].border }}
                >
                  {zone}: {countByZone[zone] ?? 0} / {seatCountByZone[zone] ?? 0}
                </div>
              </div>
            ))}
            <div style={{ marginTop: 12 }}>
              <button className="btn-retro" onClick={animateShuffle} disabled={isShuffling}>
                {isShuffling ? "셔플 중..." : "🎲 랜덤 배치"}
              </button>
            </div>
          </div>
        </div>

        {step === "result" && (
          <div className="panel" style={{ marginTop: 14 }}>
            <h2>배치 결과</h2>
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 10 }}>
              <button className="btn-retro" onClick={animateShuffle} disabled={isShuffling}>🎲 다시 셔플</button>
              <button className="btn-retro" style={{ background: "#c0e0a8" }} onClick={() => setStep("assign")}>✏️ 구역 수정</button>
              <div style={{ marginLeft: "auto", color: "#5a4223" }}>
                배정 완료: {seats.filter((s) => s.student).length} / {INITIAL_SEATS.length}
              </div>
            </div>
          </div>
        )}

        <div className="panel seating-area">
          <h2>교실 배치</h2>
          <div className="seating-grid">
            <div style={{ writingMode: "vertical-rl", color: "#5a4223", fontSize: 12, marginRight: 6 }}>복도</div>
            {seatsByCol.map((colSeats) => (
              <div key={`col-${colSeats[0]?.col ?? Math.random()}`} className="seat-col">
                {colSeats.map((seat) => (
                  <div
                    key={`${seat.col}-${seat.row}`}
                    className={displayClass()}
                    style={{ borderColor: seat.student ? ZONE_COLORS[seat.zone].border : "#987a56", background: seat.student ? ZONE_COLORS[seat.zone].bg : "#f7f2df" }}
                  >
                    {seat.student ? (
                      <>
                        <div className="seat-zone">{seat.zone}</div>
                        <div className="seat-name">{seat.student.name}</div>
                      </>
                    ) : (
                      <div className="seat-empty">빈 자리</div>
                    )}
                  </div>
                ))}
              </div>
            ))}
            <div style={{ writingMode: "vertical-rl", color: "#5a4223", fontSize: 12, marginLeft: 6 }}>창문</div>
          </div>
        </div>

      </div>
    </div>
  );
}
