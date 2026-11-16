import { StudentTools } from '@/components/tools/student-tools';

export default function ToolsPage() {
  return (
    <div className="page-shell py-10 sm:py-14">
      <p className="eyebrow">Personal Growth Platform</p>
      <h1 className="mt-2 text-3xl font-extrabold text-ink">Không gian tự hỗ trợ và phát triển</h1>
      <p className="mt-3 max-w-2xl leading-7 text-slate-700">
        Chọn một công cụ phù hợp với điều bạn cần lúc này: khám phá cảm xúc, sắp xếp suy nghĩ,
        chuẩn bị giao tiếp hoặc chia nhỏ mục tiêu. Không có điểm số, chẩn đoán hay yêu cầu phải
        hoàn thành. Bạn có thể dừng hoặc chuyển sang công cụ khác bất cứ lúc nào.
      </p>
      <StudentTools />
    </div>
  );
}
