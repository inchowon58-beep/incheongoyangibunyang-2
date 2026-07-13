"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface BlogConfig {
  siteKey: string;
  siteUrl: string;
  brandName: string;
  phone: string;
  naverId: string;
  hasPassword: boolean;
  basePrompt: string;
  writingStyle: "info" | "review";
  dailyCount: number;
  publishMode: "random" | "continuous";
  windowStartHour: number;
  windowEndHour: number;
  enabled: boolean;
  keywordsText: string;
  keywordQueueCount: number;
  publishedToday: number;
  publishedDate: string;
  dailyRemaining: number;
  linkedNaverIdFromSite: string | null;
  updatedAt: string;
}

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, h) => h);

const emptyForm: {
  naverId: string;
  naverPassword: string;
  basePrompt: string;
  writingStyle: "info" | "review";
  dailyCount: number;
  publishMode: "random" | "continuous";
  windowStartHour: number;
  windowEndHour: number;
  enabled: boolean;
  keywordsText: string;
} = {
  naverId: "",
  naverPassword: "",
  basePrompt: "",
  writingStyle: "info",
  dailyCount: 1,
  publishMode: "random",
  windowStartHour: 9,
  windowEndHour: 21,
  enabled: false,
  keywordsText: "",
};

export default function BlogWritingClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [config, setConfig] = useState<BlogConfig | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [clearPassword, setClearPassword] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/blog-writing", { cache: "no-store" });
      if (res.status === 401) {
        window.location.href = "/";
        return;
      }
      const data = await res.json();
      if (res.ok && data.config) {
        const c = data.config as BlogConfig;
        setConfig(c);
        setForm({
          naverId: c.naverId || c.linkedNaverIdFromSite || "",
          naverPassword: "",
          basePrompt: c.basePrompt || "",
          writingStyle: c.writingStyle || "info",
          dailyCount: c.dailyCount || 1,
          publishMode: c.publishMode || "random",
          windowStartHour: c.windowStartHour ?? 9,
          windowEndHour: c.windowEndHour ?? 21,
          enabled: !!c.enabled,
          keywordsText: c.keywordsText || "",
        });
        setClearPassword(false);
      } else {
        setMessage(data.error || "설정 로드 실패");
      }
    } catch {
      setMessage("설정 로드 중 오류");
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("저장 중...");
    try {
      const res = await fetch("/api/admin/blog-writing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          dailyCount: Number(form.dailyCount) || 0,
          naverPassword: clearPassword ? "" : form.naverPassword,
          clearPassword,
          appendKeywords: false,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage(data.message || "저장되었습니다.");
        if (data.config) {
          const c = data.config as BlogConfig;
          setConfig(c);
          setForm((f) => ({
            ...f,
            naverId: c.naverId,
            naverPassword: "",
            basePrompt: c.basePrompt,
            writingStyle: c.writingStyle,
            dailyCount: c.dailyCount,
            publishMode: c.publishMode,
            windowStartHour: c.windowStartHour ?? 9,
            windowEndHour: c.windowEndHour ?? 21,
            enabled: c.enabled,
            keywordsText: c.keywordsText,
          }));
          setClearPassword(false);
        }
      } else {
        setMessage(data.error || "저장 실패");
      }
    } catch {
      setMessage("저장 중 오류");
    }
    setSaving(false);
  }

  const inputClass =
    "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-dark">블로그작성</h1>
            <p className="text-sm text-gray-500 mt-1">
              VM이 받아 네이버 블로그에 자동 발행할 설정입니다.
            </p>
          </div>
          <div className="flex gap-3 text-sm">
            <Link href="/admin" className="text-orange font-medium hover:underline">
              ← 관리자
            </Link>
          </div>
        </div>

        {message && (
          <p className="mb-4 text-sm text-dark bg-orange/10 p-3 rounded-xl">{message}</p>
        )}

        {loading ? (
          <p className="text-gray-400 text-sm">불러오는 중...</p>
        ) : (
          <form onSubmit={handleSave} className="space-y-5">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-bold text-dark">자동작성 설정</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    사이트 등록 시 연결한 네이버 아이디의 VM에서 발행합니다.
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.enabled}
                    onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
                    className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span className="font-medium text-dark">발행 사용</span>
                </label>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>네이버 아이디</label>
                  <input
                    className={inputClass}
                    value={form.naverId}
                    onChange={(e) => setForm((f) => ({ ...f, naverId: e.target.value }))}
                    placeholder="사이트 등록 시 연결한 아이디"
                    autoComplete="off"
                  />
                  {config?.linkedNaverIdFromSite && (
                    <p className="text-[11px] text-gray-400 mt-1">
                      사이트 연결 계정: {config.linkedNaverIdFromSite}
                      {form.naverId !== config.linkedNaverIdFromSite && (
                        <button
                          type="button"
                          className="ml-2 text-sky-600 hover:underline"
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              naverId: config.linkedNaverIdFromSite || "",
                            }))
                          }
                        >
                          불러오기
                        </button>
                      )}
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>네이버 비밀번호</label>
                  <input
                    type="password"
                    className={inputClass}
                    value={form.naverPassword}
                    onChange={(e) => {
                      setClearPassword(false);
                      setForm((f) => ({ ...f, naverPassword: e.target.value }));
                    }}
                    placeholder={
                      config?.hasPassword
                        ? "저장됨 · 변경 시에만 입력"
                        : "VM 전달용 (선택, VM 로컬 비번 권장)"
                    }
                    autoComplete="new-password"
                  />
                  {config?.hasPassword && (
                    <label className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] text-gray-500">
                      <input
                        type="checkbox"
                        checked={clearPassword}
                        onChange={(e) => setClearPassword(e.target.checked)}
                      />
                      저장된 비밀번호 삭제 (VM 로컬만 사용)
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label className={labelClass}>글작성 기본 프롬프트</label>
                <textarea
                  className={`${inputClass} min-h-[120px] resize-y`}
                  value={form.basePrompt}
                  onChange={(e) => setForm((f) => ({ ...f, basePrompt: e.target.value }))}
                  placeholder="예: 폼스키 분양 상담 톤으로, 과장 없이 신뢰감 있게 작성. 끝에 연락처 안내."
                />
              </div>

              <div>
                <label className={labelClass}>작성 키워드 · 대량등록</label>
                <textarea
                  className={`${inputClass} min-h-[160px] font-mono text-xs resize-y`}
                  value={form.keywordsText}
                  onChange={(e) => setForm((f) => ({ ...f, keywordsText: e.target.value }))}
                  placeholder={"한 줄에 하나씩 또는 쉼표 구분\n인천 폼스키 분양\n파주 폼스키 분양"}
                />
                <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed">
                  대량 등록해도 <strong className="font-medium text-gray-600">하루 발행 개수</strong>만
                  당일 VM에 넘기고, 나머지는 다음날부터 이어서 발행합니다. 대기{" "}
                  {config?.keywordQueueCount ?? 0}건 · 오늘 배정{" "}
                  {config?.publishedToday ?? 0}/{config?.dailyCount ?? 0} · 남은 한도{" "}
                  {config?.dailyRemaining ?? 0}
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>하루 발행 개수</label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    className={inputClass}
                    value={form.dailyCount}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, dailyCount: Number(e.target.value) || 0 }))
                    }
                  />
                </div>
                <div>
                  <label className={labelClass}>발행 방식</label>
                  <select
                    className={inputClass}
                    value={form.publishMode}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        publishMode: e.target.value as "random" | "continuous",
                      }))
                    }
                  >
                    <option value="random">랜덤 (시간대 안 분산)</option>
                    <option value="continuous">연속발행 (시간대 안 순차)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>발행 시간대 (한국시간)</label>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    className={`${inputClass} w-auto min-w-[100px]`}
                    value={form.windowStartHour}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        windowStartHour: Number(e.target.value),
                      }))
                    }
                  >
                    {HOUR_OPTIONS.map((h) => (
                      <option key={`s-${h}`} value={h}>
                        {h}시
                      </option>
                    ))}
                  </select>
                  <span className="text-sm text-gray-500">~</span>
                  <select
                    className={`${inputClass} w-auto min-w-[100px]`}
                    value={form.windowEndHour}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        windowEndHour: Number(e.target.value),
                      }))
                    }
                  >
                    {HOUR_OPTIONS.map((h) => (
                      <option key={`e-${h}`} value={h}>
                        {h}시
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed">
                  예: 1시~5시 → 그날 01:00~05:00 사이에만 실행.
                  {form.windowEndHour < form.windowStartHour
                    ? " 종료가 시작보다 이르면 자정을 넘겨 다음날까지로 처리합니다."
                    : ""}{" "}
                  랜덤/연속 모두 이 시간대 안에서만 스케줄됩니다.
                </p>
              </div>

              <div>
                <label className={labelClass}>글작성 방식</label>
                <div className="flex flex-wrap gap-3">
                  {(
                    [
                      { id: "info", label: "정보형", desc: "안내·비교·팁 중심" },
                      { id: "review", label: "후기형", desc: "체험·상담 후기 톤" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, writingStyle: opt.id }))}
                      className={`flex-1 min-w-[140px] text-left px-4 py-3 rounded-xl border transition ${
                        form.writingStyle === opt.id
                          ? "border-sky-500 bg-sky-50 ring-1 ring-sky-500"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span className="block text-sm font-semibold text-dark">{opt.label}</span>
                      <span className="block text-[11px] text-gray-500 mt-0.5">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
              <h2 className="font-bold text-dark">자동 삽입 정보</h2>
              <p className="text-xs text-gray-500">사이트 설정에서 자동으로 가져옵니다. 수정은 마스터·사이트 설정에서.</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>전화번호</label>
                  <input className={inputClass} value={config?.phone || ""} readOnly disabled />
                </div>
                <div>
                  <label className={labelClass}>사이트 링크</label>
                  <input className={inputClass} value={config?.siteUrl || ""} readOnly disabled />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-60"
              >
                {saving ? "저장 중..." : "설정 저장"}
              </button>
              <p className="text-[11px] text-gray-400">
                VM: <code className="bg-gray-100 px-1 rounded">/api/blog-worker/jobs?naverId=...</code>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
