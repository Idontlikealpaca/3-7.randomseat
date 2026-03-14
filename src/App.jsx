import { useState, useMemo } from "react";
import "./App.css";

const ZONE_COLORS = {
  미지정: { bg: "#f4efe1", text: "#7d6b52", border: "#cdba98" },
  앞좌석: { bg: "#f3d0b0", text: "#8d4722", border: "#c48a60" },
  사이드: { bg: "#d2e6f3", text: "#2f6088", border: "#90b3d1" },
  일반: { bg: "#e5e2d0", text: "#6d5f44", border: "#b4a27f" },
};
const COL_ROWS = [5, 5, 5, 5, 6];
const SHUFFLE_PHASE = { IDLE: "idle", PREVIEW: "preview", FINAL: "final", DONE: "done" };
const SEAT_ZONES = ["앞좌석", "사이드", "일반"];

function getDefaultSeatZone(col, row) {
  if (col === 0 || col === 4) return "사이드";
  if (row <= 1) return "앞좌석";
  return "일반";
}

function buildDefaultLayout() {
  const layout = [];
  for (let col = 0; col < 5; col++) {
    for (let row = 0; row < COL_ROWS[col]; row++) {
      layout.push({ col, row, zone: getDefaultSeatZone(col, row) });
    }
  }
  return layout;
}
const DEFAULT_LAYOUT = buildDefaultLayout();

function cycleZone(current) {
  const idx = SEAT_ZONES.indexOf(current);
  return SEAT_ZONES[(idx + 1) % SEAT_ZONES.length];
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function assignByZone(allStudents, layout) {
  const newSeats = layout.map((s) => ({ ...s, student: null }));

  // 미지정 students go to 일반
  const pools = { 앞좌석: [], 사이드: [], 일반: [] };
  allStudents.forEach((s) => {
    const zone = s.zone === "미지정" ? "일반" : s.zone;
    pools[zone].push(s);
  });

  Object.keys(pools).forEach((z) => {
    pools[z] = shuffle(pools[z]);
  });

  const seatsByZone = { 앞좌석: [], 사이드: [], 일반: [] };
  newSeats.forEach((seat, i) => {
    if (seatsByZone[seat.zone] !== undefined) seatsByZone[seat.zone].push(i);
  });

  Object.keys(seatsByZone).forEach((zone) => {
    seatsByZone[zone].forEach((idx, si) => {
      if (si < pools[zone].length) newSeats[idx].student = pools[zone][si];
    });
  });

  return newSeats;
}

export default function SeatingApp() {
  const FIXED_STUDENTS = useMemo(
    () =>
      [
        "고다은", "김보미", "김수진", "김예은", "김예주", "김유민", "김지송",
        "박고나", "박민주", "박서윤", "박서현", "박지혜", "박채연", "성지은",
        "안소윤", "유경연", "윤예지", "윤정원", "이영채", "장하선", "전서연",
        "조민선", "주현경", "한다솜", "최서희", "홍태희",
      ].map((name, i) => ({ id: i, name, zone: "미지정" })),
    []
  );

  const [step, setStep] = useState("zone");
  const [students, setStudents] = useState(FIXED_STUDENTS);
  const [zoneLayout, setZoneLayout] = useState(DEFAULT_LAYOUT);
  const [seats, setSeats] = useState(() => DEFAULT_LAYOUT.map((s) => ({ ...s, student: null })));
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [isShuffling, setIsShuffling] = useState(false);
  const [shuffleStage, setShuffleStage] = useState(SHUFFLE_PHASE.IDLE);
  const [shuffleProgress, setShuffleProgress] = useState(0);
  const [toast, setToast] = useState("");

  const countByZone = useMemo(() => {
    return ["미지정", "앞좌석", "사이드", "일반"].reduce((acc, zone) => {
      acc[zone] = students.filter((s) => s.zone === zone).length;
      return acc;
    }, {});
  }, [students]);

  const seatCountByZone = useMemo(() => {
    return zoneLayout.reduce((acc, s) => {
      acc[s.zone] = (acc[s.zone] || 0) + 1;
      return acc;
    }, {});
  }, [zoneLayout]);

  const layoutByCol = useMemo(() => {
    return [0, 1, 2, 3, 4].map((col) =>
      zoneLayout.filter((s) => s.col === col).sort((a, b) => a.row - b.row)
    );
  }, [zoneLayout]);

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

  const runFinalAssignment = (layout) => {
    const finalSeats = assignByZone(students, layout);
    setSeats(finalSeats);
    setShuffleProgress(100);
    setShuffleStage(SHUFFLE_PHASE.DONE);
    showToast("최종 자리 배치 완료!", SHUFFLE_PHASE.DONE);
    setTimeout(() => setStep("result"), 300);
    setIsShuffling(false);
  };

  const animateShuffle = () => {
    if (isShuffling) return;
    const currentLayout = zoneLayout;
    setSelectedSeat(null);
    setIsShuffling(true);
    setShuffleStage(SHUFFLE_PHASE.PREVIEW);
    setShuffleProgress(0);
    setToast("첫 셔플 시작...");

    const rounds = 5;
    let current = 0;

    const runRound = () => {
      current += 1;
      const previewSeats = assignByZone(shuffle(students), currentLayout);
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
            runFinalAssignment(currentLayout);
          }, 250);
        }, 260);
      }
    };
    runRound();
  };

  const setStudentZone = (id, zone) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        return { ...s, zone: s.zone === zone ? "미지정" : zone };
      })
    );
  };

  const toggleSeatZone = (col, row) => {
    setZoneLayout((prev) =>
      prev.map((s) => (s.col === col && s.row === row ? { ...s, zone: cycleZone(s.zone) } : s))
    );
  };

  const handleSeatClick = (seat) => {
    if (selectedSeat && selectedSeat.col === seat.col && selectedSeat.row === seat.row) {
      setSelectedSeat(null);
    } else if (selectedSeat) {
      setSeats((prev) => {
        const next = prev.map((s) => ({ ...s }));
        const aIdx = next.findIndex((s) => s.col === selectedSeat.col && s.row === selectedSeat.row);
        const bIdx = next.findIndex((s) => s.col === seat.col && s.row === seat.row);
        if (aIdx !== -1 && bIdx !== -1) {
          [next[aIdx].student, next[bIdx].student] = [next[bIdx].student, next[aIdx].student];
        }
        return next;
      });
      setSelectedSeat(null);
    } else {
      setSelectedSeat({ col: seat.col, row: seat.row });
    }
  };

  const isSelected = (seat) =>
    selectedSeat && selectedSeat.col === seat.col && selectedSeat.row === seat.row;

  const seatCellClass = (seat) => {
    let cls = "seat-cell";
    if (isShuffling) cls += " preview";
    else if (shuffleStage === SHUFFLE_PHASE.FINAL) cls += " finalize";
    if (step === "result") {
      cls += " clickable";
      if (isSelected(seat)) cls += " selected";
    }
    return cls;
  };

  const STEPS = [
    { key: "zone", label: "구역 범위 설정" },
    { key: "assign", label: "구역 지정" },
    { key: "result", label: "배치 결과" },
  ];
  const currentStepIdx = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="classroom-app">
      {toast && <div className={`shuffle-toast ${shuffleStage}`}>{toast}</div>}
      <div className="frame">
        <div className="retro-header">
          <h1>랜덤 자리 배치기</h1>
          <div className="step-indicator">
            {STEPS.map((s, i) => (
              <span key={s.key} className={`step-item${i === currentStepIdx ? " active" : i < currentStepIdx ? " done" : ""}`}>
                {i > 0 && <span className="step-arrow">→</span>}
                {s.label}
              </span>
            ))}
          </div>
        </div>

        <div className="progress">
          <div className="progress-inner" style={{ width: `${shuffleProgress}%` }} />
        </div>

        {/* STEP 1: Zone range selection */}
        {step === "zone" && (
          <div className="panel seating-area">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
              <h2 style={{ margin: 0 }}>구역 범위 설정</h2>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="btn-retro"
                  style={{ fontSize: 12, padding: "5px 10px", background: "#ffe59f", boxShadow: "0 3px 0 #8d622f" }}
                  onClick={() => setZoneLayout(DEFAULT_LAYOUT)}
                >
                  초기화
                </button>
                <button
                  className="btn-retro btn-next"
                  onClick={() => setStep("assign")}
                >
                  다음 →
                </button>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap", alignItems: "center" }}>
              {SEAT_ZONES.map((zone) => (
                <span
                  key={zone}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    background: ZONE_COLORS[zone].bg, color: ZONE_COLORS[zone].text,
                    border: `1px solid ${ZONE_COLORS[zone].border}`,
                    borderRadius: 6, padding: "3px 8px", fontSize: "0.8rem",
                  }}
                >
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: ZONE_COLORS[zone].border, display: "inline-block" }} />
                  {zone}
                </span>
              ))}
              <span style={{ fontSize: "0.75rem", color: "#7a6040" }}>클릭 시 앞좌석 → 사이드 → 일반 순환</span>
            </div>
            <div className="seating-grid">
              <div style={{ writingMode: "vertical-rl", color: "#5a4223", fontSize: 12, marginRight: 6 }}>복도</div>
              {layoutByCol.map((colSeats) => (
                <div key={`col-${colSeats[0]?.col}`} className="seat-col">
                  {colSeats.map((seat) => (
                    <div
                      key={`${seat.col}-${seat.row}`}
                      className="seat-cell zone-edit"
                      style={{
                        borderColor: ZONE_COLORS[seat.zone].border,
                        background: ZONE_COLORS[seat.zone].bg,
                        cursor: "pointer",
                      }}
                      onClick={() => toggleSeatZone(seat.col, seat.row)}
                    >
                      <div className="seat-zone" style={{ color: ZONE_COLORS[seat.zone].text, fontSize: "0.72rem" }}>
                        {seat.zone}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              <div style={{ writingMode: "vertical-rl", color: "#5a4223", fontSize: 12, marginLeft: 6 }}>창문</div>
            </div>
          </div>
        )}

        {/* STEP 2: Student zone assignment */}
        {step === "assign" && (
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
                        onClick={() => setStudentZone(s.id, zone)}
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
              {["앞좌석", "사이드", "일반"].map((zone) => (
                <div className="status-row" key={zone}>
                  <div
                    className="status-box"
                    style={{ background: ZONE_COLORS[zone].bg, color: ZONE_COLORS[zone].text, borderColor: ZONE_COLORS[zone].border }}
                  >
                    {zone}: {countByZone[zone] ?? 0} / {seatCountByZone[zone] ?? 0}
                  </div>
                </div>
              ))}
              <div className="status-row">
                <div
                  className="status-box"
                  style={{ background: ZONE_COLORS["미지정"].bg, color: ZONE_COLORS["미지정"].text, borderColor: ZONE_COLORS["미지정"].border }}
                >
                  미지정 (→일반): {countByZone["미지정"] ?? 0}명
                </div>
              </div>
              <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  className="btn-retro"
                  style={{ fontSize: 12, padding: "5px 10px", background: "#ffe59f", boxShadow: "0 3px 0 #8d622f" }}
                  onClick={() => setStep("zone")}
                >
                  ← 구역 설정
                </button>
                <button className="btn-retro" onClick={animateShuffle} disabled={isShuffling}>
                  {isShuffling ? "셔플 중..." : "🎲 랜덤 배치"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Result controls */}
        {step === "result" && (
          <div className="panel" style={{ marginTop: 8 }}>
            <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
              <button className="btn-retro" onClick={animateShuffle} disabled={isShuffling}>
                🎲 다시 셔플
              </button>
              <button
                className="btn-retro"
                style={{ background: "linear-gradient(180deg, #c0e0a8 0%, #88bb66 100%)", boxShadow: "0 4px 0 #4a8a2a" }}
                onClick={() => setStep("assign")}
              >
                ✏️ 구역 수정
              </button>
              <div style={{ marginLeft: "auto", color: "#5a4223", fontSize: "0.85rem" }}>
                배정 완료: {seats.filter((s) => s.student).length} / {seats.length}
              </div>
            </div>
            <div style={{ marginTop: 6, fontSize: "0.82rem", color: "#6a4e26" }}>
              {selectedSeat ? "이동할 자리를 클릭하세요" : "자리를 클릭해서 서로 교환할 수 있습니다"}
            </div>
          </div>
        )}

        {/* Seating grid - shown in assign and result steps */}
        {step !== "zone" && (
          <div className="panel seating-area" style={{ marginTop: 16 }}>
            <h2>교실 배치</h2>
            <div className="seating-grid">
              <div style={{ writingMode: "vertical-rl", color: "#5a4223", fontSize: 12, marginRight: 6 }}>복도</div>
              {seatsByCol.map((colSeats) => (
                <div key={`col-${colSeats[0]?.col ?? Math.random()}`} className="seat-col">
                  {colSeats.map((seat) => (
                    <div
                      key={`${seat.col}-${seat.row}`}
                      className={seatCellClass(seat)}
                      style={{
                        borderColor: isSelected(seat) ? "#ffffff" : seat.student ? ZONE_COLORS[seat.zone].border : "#987a56",
                        background: seat.student ? ZONE_COLORS[seat.zone].bg : "#f7f2df",
                        boxShadow: isSelected(seat) ? "0 0 0 3px #ffffff, 0 0 0 5px #c07a30" : undefined,
                      }}
                      onClick={step === "result" ? () => handleSeatClick(seat) : undefined}
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
        )}
      </div>
    </div>
  );
}
