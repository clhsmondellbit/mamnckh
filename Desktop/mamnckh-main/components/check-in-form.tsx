'use client';

import { FormEvent, useState } from 'react';
import { SupportPanel } from '@/components/safety/support-panel';

type CheckInResult = { message: string; supportLevel: 'green' | 'yellow' | 'red'; showEmergencySupport: boolean };
const scaleLabels = ['Rất thấp', 'Thấp', 'Vừa', 'Khá nhiều', 'Rất nhiều'];

function ScaleQuestion({ id, label, value, onChange, low, high }: { id: string; label: string; value: number; onChange: (value: number) => void; low: string; high: string }) {
  return (
    <fieldset className="space-y-2">
      <legend className="font-bold text-[#2c4a24] text-base">{label}</legend>
      <div className="mt-3 grid grid-cols-5 gap-2 sm:gap-3">
        {scaleLabels.map((scale, index) => {
          const numeric = index + 1;
          const isSelected = value === numeric;
          return (
            <label
              key={numeric}
              className={`cursor-pointer rounded-2xl border px-2 py-3 text-center text-xs sm:text-sm font-bold transition-all duration-200 select-none ${
                isSelected
                  ? 'border-[#2d4a22] bg-[#2d4a22] text-white shadow-xs scale-[1.02]'
                  : 'border-[#d5e5cf] bg-white text-[#38582d] hover:bg-[#e4efdf] hover:border-[#82a875]'
              }`}
            >
              <input
                className="sr-only"
                type="radio"
                name={id}
                value={numeric}
                checked={isSelected}
                onChange={() => onChange(numeric)}
              />
              <span className="text-base sm:text-lg block mb-0.5">{numeric}</span>
              <span className="text-[10px] sm:text-xs font-normal opacity-80 block truncate">{scale}</span>
            </label>
          );
        })}
      </div>
      <div className="mt-1 flex justify-between text-xs text-slate-400 font-medium px-1">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </fieldset>
  );
}

export function CheckInForm() {
  const [mood, setMood] = useState(3);
  const [pressure, setPressure] = useState(3);
  const [connected, setConnected] = useState(3);
  const [feelsSafe, setFeelsSafe] = useState(true);
  const [note, setNote] = useState('');
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch('/api/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood, pressure, connected, feelsSafe, note }),
      });
      const body = (await response.json()) as CheckInResult;
      if (!response.ok) throw new Error();
      setResult(body);
    } catch {
      setResult({
        message: 'Mình chưa thể xử lý check-in lúc này. Nếu bạn cần nói chuyện, bạn có thể tìm một người lớn mà bạn tin tưởng hoặc mở phần Trò chuyện.',
        supportLevel: 'yellow',
        showEmergencySupport: false,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      className="card mx-auto mt-6 max-w-3xl space-y-8 rounded-3xl border border-[#e2ebd8] bg-white p-6 shadow-xs sm:p-10 transition-all duration-300 animate-slideUp"
      onSubmit={submit}
    >
      <ScaleQuestion
        id="mood"
        label="1. Ngay lúc này, tâm trạng của bạn thế nào?"
        value={mood}
        onChange={setMood}
        low="Rất nặng nề"
        high="Khá ổn"
      />

      <ScaleQuestion
        id="pressure"
        label="2. Bạn đang cảm thấy áp lực ở mức nào?"
        value={pressure}
        onChange={setPressure}
        low="Rất ít"
        high="Rất nhiều"
      />

      <ScaleQuestion
        id="connected"
        label="3. Bạn cảm thấy mình có người để kết nối không?"
        value={connected}
        onChange={setConnected}
        low="Hầu như không"
        high="Có khá nhiều"
      />

      <fieldset className="space-y-2">
        <legend className="font-bold text-[#2c4a24] text-base">4. Ngay lúc này bạn có cảm thấy an toàn không?</legend>
        <div className="mt-3 flex flex-wrap gap-3">
          <label
            className={`cursor-pointer rounded-2xl border px-5 py-3 text-sm font-bold transition-all duration-200 select-none ${
              feelsSafe
                ? 'border-[#2d4a22] bg-[#2d4a22] text-white shadow-xs scale-[1.01]'
                : 'border-[#d5e5cf] bg-white text-[#38582d] hover:bg-[#e4efdf]'
            }`}
          >
            <input className="sr-only" type="radio" checked={feelsSafe} onChange={() => setFeelsSafe(true)} />
            Có, mình đang an toàn 🌿
          </label>
          <label
            className={`cursor-pointer rounded-2xl border px-5 py-3 text-sm font-bold transition-all duration-200 select-none ${
              !feelsSafe
                ? 'border-[#9d403f] bg-[#9d403f] text-white shadow-xs scale-[1.01]'
                : 'border-[#d5e5cf] bg-white text-[#8a3939] hover:bg-[#fcefee]'
            }`}
          >
            <input className="sr-only" type="radio" checked={!feelsSafe} onChange={() => setFeelsSafe(false)} />
            Không chắc / Không an toàn 🆘
          </label>
        </div>
      </fieldset>

      <label className="block font-bold text-[#2c4a24] text-base space-y-2">
        <span>5. Nếu muốn, bạn có thể ghi vài từ về điều đang nặng nhất:</span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={500}
          rows={3}
          className="w-full rounded-2xl border border-slate-300 p-4 font-normal text-slate-800 outline-none transition-all focus:border-[#2d4a22] focus:ring-2 focus:ring-[#2d4a22]/20 placeholder-slate-400 text-sm"
          placeholder="Không bắt buộc..."
        />
      </label>

      <button
        className="w-full rounded-2xl bg-[#2d4a22] py-4 text-base font-bold text-white transition-all duration-200 hover:bg-[#1f3617] hover:shadow-md hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
        disabled={submitting}
      >
        {submitting ? 'Đang xem lại…' : 'Xem bước tiếp theo 🚀'}
      </button>

      {result ? (
        <div className="space-y-4 rounded-3xl bg-[#e4efdf] p-6 text-[#2c4a24] animate-fadeIn" aria-live="polite">
          <p className="font-semibold leading-7">{result.message}</p>
          {result.supportLevel !== 'green' ? <SupportPanel emergency={result.supportLevel === 'red'} /> : null}
        </div>
      ) : null}
    </form>
  );
}