'use client';

import { FormEvent, useState } from 'react';
import { SupportPanel } from '@/components/safety/support-panel';

type CheckInResult = { message: string; supportLevel: 'green' | 'yellow' | 'red'; showEmergencySupport: boolean };
const scaleLabels = ['Rất thấp', 'Thấp', 'Vừa', 'Khá nhiều', 'Rất nhiều'];

function ScaleQuestion({ id, label, value, onChange, low, high }: { id: string; label: string; value: number; onChange: (value: number) => void; low: string; high: string }) {
  return (
    <fieldset>
      <legend className="font-bold text-ink">{label}</legend>
      <div className="mt-3 grid grid-cols-5 gap-2">
        {scaleLabels.map((scale, index) => {
          const numeric = index + 1;
          return <label key={numeric} className={`cursor-pointer rounded-xl border p-2 text-center text-xs font-semibold ${value === numeric ? 'border-moss-700 bg-moss-700 text-white' : 'border-moss-100 bg-white text-slate-700 hover:bg-moss-50'}`}><input className="sr-only" type="radio" name={id} value={numeric} checked={value === numeric} onChange={() => onChange(numeric)} />{numeric}<span className="sr-only"> — {scale}</span></label>;
        })}
      </div>
      <div className="mt-2 flex justify-between text-xs text-slate-500"><span>{low}</span><span>{high}</span></div>
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
      const response = await fetch('/api/check-in', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mood, pressure, connected, feelsSafe, note }) });
      const body = (await response.json()) as CheckInResult;
      if (!response.ok) throw new Error();
      setResult(body);
    } catch {
      setResult({ message: 'Mình chưa thể xử lý check-in lúc này. Nếu bạn cần nói chuyện, bạn có thể tìm một người lớn mà bạn tin tưởng hoặc mở phần Trò chuyện.', supportLevel: 'yellow', showEmergencySupport: false });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="card mt-8 space-y-7 p-5 sm:p-8" onSubmit={submit}>
      <ScaleQuestion id="mood" label="Ngay lúc này, tâm trạng của bạn thế nào?" value={mood} onChange={setMood} low="Rất nặng nề" high="Khá ổn" />
      <ScaleQuestion id="pressure" label="Bạn đang cảm thấy áp lực ở mức nào?" value={pressure} onChange={setPressure} low="Rất ít" high="Rất nhiều" />
      <ScaleQuestion id="connected" label="Bạn cảm thấy mình có người để kết nối không?" value={connected} onChange={setConnected} low="Hầu như không" high="Có khá nhiều" />
      <fieldset>
        <legend className="font-bold text-ink">Ngay lúc này bạn có cảm thấy an toàn không?</legend>
        <div className="mt-3 flex flex-wrap gap-3"><label className={`cursor-pointer rounded-xl border px-4 py-3 font-semibold ${feelsSafe ? 'border-moss-700 bg-moss-700 text-white' : 'border-moss-100'}`}><input className="sr-only" type="radio" checked={feelsSafe} onChange={() => setFeelsSafe(true)} />Có, mình đang an toàn</label><label className={`cursor-pointer rounded-xl border px-4 py-3 font-semibold ${!feelsSafe ? 'border-[#9d403f] bg-[#9d403f] text-white' : 'border-moss-100'}`}><input className="sr-only" type="radio" checked={!feelsSafe} onChange={() => setFeelsSafe(false)} />Không chắc / không an toàn</label></div>
      </fieldset>
      <label className="block font-bold text-ink">Nếu muốn, bạn có thể ghi vài từ về điều đang nặng nhất<textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} rows={3} className="mt-2 w-full rounded-xl border border-moss-100 p-3 font-normal outline-none focus:border-moss-600" placeholder="Không bắt buộc" /></label>
      <button className="button-primary" disabled={submitting}>{submitting ? 'Đang xem lại…' : 'Xem bước tiếp theo'}</button>
      {result ? <div className="space-y-4 rounded-2xl bg-moss-50 p-5" aria-live="polite"><p className="font-semibold leading-7 text-ink">{result.message}</p>{result.supportLevel !== 'green' ? <SupportPanel emergency={result.supportLevel === 'red'} /> : null}</div> : null}
    </form>
  );
}
