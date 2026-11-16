'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

type ToolId =
  | 'calm'
  | 'emotion'
  | 'thought'
  | 'stress'
  | 'communication'
  | 'scenario'
  | 'growth'
  | 'wellbeing';

const tools: Array<{ id: ToolId; title: string; description: string; icon: string }> = [
  { id: 'calm', title: 'Calm Space', description: 'Một khoảng nghỉ và bài tập chú ý hiện tại.', icon: '🌿' },
  { id: 'emotion', title: 'Emotion Explorer', description: 'Gọi tên cảm xúc và nhận ra cảm xúc pha trộn.', icon: '💛' },
  { id: 'thought', title: 'Thought Explorer', description: 'Tách sự kiện, suy nghĩ và góc nhìn khác.', icon: '💭' },
  { id: 'stress', title: 'Stress Planner', description: 'Lập một kế hoạch ứng phó áp lực nhỏ.', icon: '🧭' },
  { id: 'communication', title: 'Communication Coach', description: 'Chuẩn bị điều muốn nói theo cách tôn trọng.', icon: '💬' },
  { id: 'scenario', title: 'Scenario Practice', description: 'Tự luyện một tình huống giao tiếp học đường.', icon: '🎭' },
  { id: 'growth', title: 'Growth Journey', description: 'Chia mục tiêu thành những bước vừa sức.', icon: '🌱' },
  { id: 'wellbeing', title: 'Sleep & Wellbeing Reflection', description: 'Nhìn lại nghỉ ngơi và năng lượng theo cảm nhận.', icon: '☁️' },
];

const emotionDescriptions: Record<string, string> = {
  'Lo lắng': 'Có thể xuất hiện khi bạn đang chờ đợi, chưa chắc chắn hoặc quan tâm nhiều đến một kết quả.',
  'Buồn': 'Có thể liên quan đến mất mát, thất vọng, mệt mỏi hoặc một điều quan trọng với bạn.',
  'Bực bội': 'Đôi khi xuất hiện khi có điều không công bằng, một giới hạn bị vượt qua hoặc nhu cầu chưa được lắng nghe.',
  'Bối rối': 'Có thể xuất hiện khi có nhiều thông tin, lựa chọn hoặc cảm xúc cùng lúc.',
  'Cô đơn': 'Có thể là cảm giác thiếu kết nối, kể cả khi xung quanh vẫn có người.',
  'Nhẹ nhõm': 'Có thể xuất hiện khi áp lực giảm xuống hoặc một việc khó đã qua.',
  'Vui': 'Có thể liên quan đến kết nối, sự hài lòng, hứng thú hoặc một điều có ý nghĩa với bạn.',
  'Khác / chưa rõ': 'Bạn không cần phải gọi tên chính xác. Có thể bắt đầu bằng việc mô tả cảm giác hoặc điều đang xảy ra.',
};

const scenarios = [
  {
    title: 'Làm rõ một hiểu lầm với bạn cùng lớp',
    prompt: 'Một người bạn hiểu nhầm ý bạn trong một cuộc trò chuyện. Bạn muốn làm rõ mà không đổ lỗi.',
    questions: ['Điều gì đã xảy ra mà bạn trực tiếp biết?', 'Bạn muốn người kia hiểu điều gì?', 'Có thể bắt đầu bằng một câu trung tính nào?'],
  },
  {
    title: 'Từ chối một lời đề nghị không phù hợp',
    prompt: 'Một người bạn rủ bạn làm điều bạn không thoải mái. Bạn muốn từ chối rõ ràng mà vẫn lịch sự.',
    questions: ['Ranh giới nào quan trọng với bạn?', 'Bạn có thể nói “không” ngắn gọn ra sao?', 'Bạn có thể tìm ai hỗ trợ nếu bị gây áp lực?'],
  },
  {
    title: 'Trao đổi với thầy cô về việc học',
    prompt: 'Bạn chưa hiểu một phần bài học và muốn xin thầy cô giải thích thêm.',
    questions: ['Phần nào bạn đang chưa rõ?', 'Bạn đã thử cách nào?', 'Bạn muốn nhờ thầy cô hỗ trợ cụ thể điều gì?'],
  },
];

export function StudentTools() {
  const [activeTool, setActiveTool] = useState<ToolId>('calm');
  const [showGrounding, setShowGrounding] = useState(false);
  const [emotion, setEmotion] = useState('Lo lắng');
  const [emotionNote, setEmotionNote] = useState('');
  const [thought, setThought] = useState({ situation: '', firstThought: '', feeling: '', facts: '', otherView: '' });
  const [showThoughtReflection, setShowThoughtReflection] = useState(false);
  const [stress, setStress] = useState({ source: '', control: '', step: '', support: '' });
  const [communication, setCommunication] = useState({ person: '', subject: '', need: '' });
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [scenarioResponse, setScenarioResponse] = useState('');
  const [goal, setGoal] = useState('');
  const [stepDraft, setStepDraft] = useState('');
  const [steps, setSteps] = useState<Array<{ id: number; text: string; done: boolean }>>([]);
  const [rest, setRest] = useState('');
  const [energy, setEnergy] = useState('');
  const [wellbeingNote, setWellbeingNote] = useState('');
  const activeDefinition = tools.find((tool) => tool.id === activeTool) || tools[0];
  const selectedScenario = scenarios[scenarioIndex];

  const communicationDraft = useMemo(() => {
    const parts = [
      communication.person.trim() ? `Mình muốn trao đổi với ${communication.person.trim()}.` : '',
      communication.subject.trim() ? `Mình muốn nói về ${communication.subject.trim()}.` : '',
      communication.need.trim() ? `Điều mình mong muốn là ${communication.need.trim()}.` : '',
    ].filter(Boolean);
    return parts.join(' ');
  }, [communication]);

  function addStep() {
    const text = stepDraft.trim();
    if (!text) return;
    setSteps((current) => [...current, { id: Date.now(), text, done: false }]);
    setStepDraft('');
  }

  function toggleStep(id: number) {
    setSteps((current) => current.map((step) => step.id === id ? { ...step, done: !step.done } : step));
  }

  function renderActiveTool() {
    switch (activeTool) {
      case 'calm':
        return (
          <div className="space-y-4">
            <p className="text-sm leading-6 text-slate-600">Chọn một bài tập nhẹ nhàng. Bạn có thể bỏ qua hoặc dừng bất cứ lúc nào; không cần cố điều chỉnh nhịp thở.</p>
            <button type="button" onClick={() => setShowGrounding((value) => !value)} className="button-primary">{showGrounding ? 'Ẩn hướng dẫn' : 'Bắt đầu bài tập chú ý hiện tại'}</button>
            {showGrounding ? <div className="rounded-2xl bg-moss-50 p-4 text-sm leading-7 text-slate-700"><p>1. Nhìn quanh và gọi tên vài vật bạn đang thấy.</p><p>2. Chú ý cảm giác bàn chân chạm sàn hoặc lưng tựa vào ghế, nếu điều đó dễ chịu.</p><p>3. Lắng nghe một vài âm thanh ở gần và xa.</p><p>4. Để nhịp thở diễn ra tự nhiên. Không cần hít sâu hay giữ hơi.</p><p className="mt-2 font-semibold">Nếu bài tập khiến bạn khó chịu, hãy dừng và chọn hoạt động khác phù hợp hơn.</p></div> : null}
          </div>
        );
      case 'emotion':
        return (
          <div className="space-y-4">
            <label className="block text-sm font-semibold">Cảm xúc bạn muốn khám phá<select value={emotion} onChange={(event) => setEmotion(event.target.value)} className="mt-1 w-full rounded-xl border border-moss-100 bg-white p-3 font-normal">{Object.keys(emotionDescriptions).map((item) => <option key={item}>{item}</option>)}</select></label>
            <div className="rounded-2xl bg-moss-50 p-4 text-sm leading-7 text-slate-700"><p>{emotionDescriptions[emotion]}</p><p className="mt-2 font-semibold">Đây chỉ là những mô tả có thể tham khảo, không phải kết luận về bạn.</p></div>
            <label className="block text-sm font-semibold">Có cảm xúc nào khác xuất hiện cùng lúc không?<textarea value={emotionNote} onChange={(event) => setEmotionNote(event.target.value)} maxLength={800} rows={3} className="mt-1 w-full rounded-xl border border-moss-100 p-3 font-normal" placeholder="Bạn có thể có nhiều cảm xúc cùng lúc…" /></label>
            <p className="text-sm text-slate-600">Gợi ý phản tư: “Điều gì đang quan trọng với mình trong tình huống này?”</p>
          </div>
        );
      case 'thought':
        return (
          <div className="space-y-3">
            {([
              ['situation', 'Tình huống: Điều gì đã xảy ra?', 'Mô tả những gì bạn quan sát được…'],
              ['firstThought', 'Suy nghĩ đầu tiên xuất hiện là gì?', 'Viết đúng điều bạn đã nghĩ, không cần chỉnh sửa…'],
              ['feeling', 'Bạn nhận thấy cảm xúc nào?', 'Có thể có nhiều cảm xúc…'],
              ['facts', 'Dữ kiện nào bạn biết chắc?', 'Điều gì có thể kiểm tra hoặc xác nhận?'],
              ['otherView', 'Có góc nhìn nào khác cũng hợp lý?', 'Một cách diễn giải khác có thể là…'],
            ] as const).map(([key, label, placeholder]) => <label key={key} className="block text-sm font-semibold">{label}<textarea value={thought[key]} onChange={(event) => { setThought((current) => ({ ...current, [key]: event.target.value })); setShowThoughtReflection(false); }} maxLength={1200} rows={2} className="mt-1 w-full rounded-xl border border-moss-100 p-3 font-normal" placeholder={placeholder} /></label>)}
            <button type="button" onClick={() => setShowThoughtReflection(true)} className="button-primary">Xem lại các ghi chú</button>
            {showThoughtReflection ? <div className="rounded-2xl bg-moss-50 p-4 text-sm leading-7 text-slate-700"><p><strong>Bạn đã ghi nhận:</strong> {thought.situation.trim() || 'Chưa ghi tình huống.'}</p><p><strong>Suy nghĩ:</strong> {thought.firstThought.trim() || 'Chưa ghi suy nghĩ.'}</p><p><strong>Dữ kiện:</strong> {thought.facts.trim() || 'Chưa ghi dữ kiện.'}</p><p><strong>Góc nhìn khác:</strong> {thought.otherView.trim() || 'Chưa ghi góc nhìn khác.'}</p><p className="mt-2">Bạn không cần ép mình phải nghĩ tích cực. Mục tiêu chỉ là nhận ra đâu là sự kiện và đâu là cách diễn giải.</p></div> : null}
            <p className="text-xs leading-5 text-slate-500">Bài tập phản tư tham khảo một số nguyên tắc nhận thức – hành vi; đây không phải liệu pháp CBT hay đánh giá chuyên môn.</p>
          </div>
        );
      case 'stress':
        return (
          <div className="space-y-3">
            {([
              ['source', 'Điều đang tạo áp lực là gì?', 'Chỉ cần mô tả ngắn…'],
              ['control', 'Phần nào nằm trong khả năng của bạn?', 'Ví dụ: một việc nhỏ bạn có thể chủ động…'],
              ['step', 'Bước nhỏ tiếp theo có thể là gì?', 'Chọn việc dễ bắt đầu, không cần hoàn hảo…'],
              ['support', 'Ai hoặc điều gì có thể hỗ trợ bạn?', 'Một người bạn tin tưởng, thầy cô hoặc người thân…'],
            ] as const).map(([key, label, placeholder]) => <label key={key} className="block text-sm font-semibold">{label}<textarea value={stress[key]} onChange={(event) => setStress((current) => ({ ...current, [key]: event.target.value }))} maxLength={800} rows={2} className="mt-1 w-full rounded-xl border border-moss-100 p-3 font-normal" placeholder={placeholder} /></label>)}
            <p className="rounded-xl bg-moss-50 p-3 text-sm leading-6 text-slate-700">Kế hoạch có thể thay đổi. Bạn không phải tự giải quyết mọi việc một mình.</p>
          </div>
        );
      case 'communication':
        return (
          <div className="space-y-3">
            <label className="block text-sm font-semibold">Bạn muốn nói chuyện với ai?<input value={communication.person} onChange={(event) => setCommunication((current) => ({ ...current, person: event.target.value }))} maxLength={100} className="mt-1 w-full rounded-xl border border-moss-100 p-3 font-normal" placeholder="Ví dụ: một người bạn…" /></label>
            <label className="block text-sm font-semibold">Chủ đề bạn muốn trao đổi<input value={communication.subject} onChange={(event) => setCommunication((current) => ({ ...current, subject: event.target.value }))} maxLength={180} className="mt-1 w-full rounded-xl border border-moss-100 p-3 font-normal" placeholder="Điều bạn muốn làm rõ…" /></label>
            <label className="block text-sm font-semibold">Bạn mong muốn điều gì sau cuộc trò chuyện?<textarea value={communication.need} onChange={(event) => setCommunication((current) => ({ ...current, need: event.target.value }))} maxLength={300} rows={2} className="mt-1 w-full rounded-xl border border-moss-100 p-3 font-normal" placeholder="Một sự lắng nghe, lời giải thích hoặc thỏa thuận…" /></label>
            {communicationDraft ? <div className="rounded-2xl bg-moss-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-moss-700">Câu mở đầu gợi ý</p><p className="mt-2 text-sm leading-7 text-slate-700">{communicationDraft}</p><p className="mt-2 text-xs text-slate-500">Hãy sửa lại để câu nói đúng với cách diễn đạt của bạn.</p></div> : null}
          </div>
        );
      case 'scenario':
        return (
          <div className="space-y-3">
            <label className="block text-sm font-semibold">Chọn tình huống<select value={scenarioIndex} onChange={(event) => { setScenarioIndex(Number(event.target.value)); setScenarioResponse(''); }} className="mt-1 w-full rounded-xl border border-moss-100 bg-white p-3 font-normal">{scenarios.map((scenario, index) => <option key={scenario.title} value={index}>{scenario.title}</option>)}</select></label>
            <div className="rounded-2xl bg-moss-50 p-4"><p className="text-sm leading-7 text-slate-700">{selectedScenario.prompt}</p><ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-600">{selectedScenario.questions.map((question) => <li key={question}>{question}</li>)}</ul></div>
            <label className="block text-sm font-semibold">Bạn sẽ thử nói hoặc làm gì?<textarea value={scenarioResponse} onChange={(event) => setScenarioResponse(event.target.value)} rows={4} maxLength={1200} className="mt-1 w-full rounded-xl border border-moss-100 p-3 font-normal" placeholder="Viết cách phản hồi của bạn…" /></label>
            {scenarioResponse.trim() ? <p className="rounded-xl border border-moss-100 p-3 text-sm leading-6 text-slate-600">Tự xem lại: Cách diễn đạt của bạn có rõ ràng, tôn trọng, nói đúng nhu cầu và giữ an toàn cho bản thân không?</p> : null}
            <p className="text-xs text-slate-500">Đây là bài luyện tập tự hướng dẫn, không phải cuộc hội thoại AI trực tiếp.</p>
          </div>
        );
      case 'growth':
        return (
          <div className="space-y-3">
            <label className="block text-sm font-semibold">Một mục tiêu bạn muốn thử<input value={goal} onChange={(event) => setGoal(event.target.value)} maxLength={160} className="mt-1 w-full rounded-xl border border-moss-100 p-3 font-normal" placeholder="Ví dụ: chủ động hỏi khi chưa hiểu bài…" /></label>
            <div className="flex gap-2"><input value={stepDraft} onChange={(event) => setStepDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addStep(); } }} maxLength={160} className="min-w-0 flex-1 rounded-xl border border-moss-100 p-3 text-sm" placeholder="Thêm một bước nhỏ…" /><button type="button" onClick={addStep} disabled={!stepDraft.trim()} className="button-primary">Thêm</button></div>
            {steps.length ? <ul className="space-y-2">{steps.map((step) => <li key={step.id} className="flex items-start gap-3 rounded-xl bg-moss-50 p-3 text-sm"><input type="checkbox" checked={step.done} onChange={() => toggleStep(step.id)} className="mt-1 size-4" /><span className={step.done ? 'text-slate-400 line-through' : 'text-slate-700'}>{step.text}</span></li>)}</ul> : <p className="text-sm text-slate-500">Chưa có bước nào. Hãy bắt đầu từ việc thật nhỏ.</p>}
            <p className="text-sm leading-6 text-slate-600">Mục tiêu có thể điều chỉnh hoặc tạm dừng. Không có hình phạt khi bạn nghỉ hoặc thay đổi kế hoạch.</p>
            <button type="button" onClick={() => { setGoal(''); setStepDraft(''); setSteps([]); }} className="button-secondary">Xóa kế hoạch trên trang</button>
          </div>
        );
      case 'wellbeing':
        return (
          <div className="space-y-3">
            <label className="block text-sm font-semibold">Gần đây bạn cảm nhận việc nghỉ ngơi thế nào?<select value={rest} onChange={(event) => setRest(event.target.value)} className="mt-1 w-full rounded-xl border border-moss-100 bg-white p-3 font-normal"><option value="">Chọn một mô tả</option><option>Khá dễ chịu</option><option>Không ổn định</option><option>Chưa đủ nghỉ ngơi</option><option>Mình chưa rõ</option></select></label>
            <label className="block text-sm font-semibold">Năng lượng của bạn hôm nay ra sao?<select value={energy} onChange={(event) => setEnergy(event.target.value)} className="mt-1 w-full rounded-xl border border-moss-100 bg-white p-3 font-normal"><option value="">Chọn một mô tả</option><option>Khá có năng lượng</option><option>Ở mức vừa phải</option><option>Hơi mệt</option><option>Rất cần nghỉ</option><option>Mình chưa rõ</option></select></label>
            <label className="block text-sm font-semibold">Có điều gì bạn muốn ghi nhận?<textarea value={wellbeingNote} onChange={(event) => setWellbeingNote(event.target.value)} rows={3} maxLength={700} className="mt-1 w-full rounded-xl border border-moss-100 p-3 font-normal" placeholder="Thói quen, lịch học, điều làm bạn thư giãn…" /></label>
            <p className="text-xs leading-5 text-slate-500">Đây là ghi chú tự phản tư, không phải công cụ đo lường hay chẩn đoán sức khỏe. Bạn không cần đạt một con số hoặc lịch sinh hoạt cố định.</p>
          </div>
        );
    }
  }

  return (
    <div className="mt-7 space-y-5">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4" aria-label="Chọn công cụ tự hỗ trợ">
        {tools.map((tool) => (
          <button key={tool.id} type="button" onClick={() => setActiveTool(tool.id)} aria-pressed={activeTool === tool.id} className={`rounded-2xl border p-4 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss-700 ${activeTool === tool.id ? 'border-moss-700 bg-moss-50 shadow-sm' : 'border-moss-100 bg-white hover:bg-moss-50'}`}>
            <span className="text-xl" aria-hidden="true">{tool.icon}</span>
            <span className="mt-2 block text-sm font-bold text-ink">{tool.title}</span>
            <span className="mt-1 block text-xs leading-5 text-slate-600">{tool.description}</span>
          </button>
        ))}
      </div>

      <section className="card p-5 sm:p-6" aria-labelledby="active-tool-title">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><p className="eyebrow">{activeDefinition.icon} Công cụ tự hỗ trợ</p><h2 id="active-tool-title" className="mt-1 text-xl font-bold text-ink">{activeDefinition.title}</h2><p className="mt-1 text-sm leading-6 text-slate-600">{activeDefinition.description}</p></div>
          {activeTool === 'communication' ? <Link href="/chat?topic=communication" className="button-secondary">Trao đổi cùng MẦM</Link> : null}
        </div>
        <div className="mt-5">{renderActiveTool()}</div>
      </section>

      <p className="text-xs leading-5 text-slate-500">Các nội dung bạn nhập vào những công cụ này chỉ tồn tại trong trạng thái trang hiện tại, không được lưu vào tài khoản, không gửi đến AI provider và sẽ mất khi tải lại trang. Đây là hoạt động tự phản tư, không thay thế chuyên gia hoặc người lớn đáng tin cậy. Khi một vấn đề khiến bạn không an toàn hoặc quá khó tự xoay xở, hãy tìm người thật phù hợp để hỗ trợ.</p>
    </div>
  );
}
