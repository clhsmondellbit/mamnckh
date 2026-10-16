import { CheckInForm } from '@/components/check-in-form';

export default function CheckInPage() {
  return (
    <div className="page-shell py-10 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <p className="eyebrow">Check-in nhẹ nhàng</p>
        <h1 className="mt-2 text-3xl font-extrabold text-ink">Dừng lại một chút để xem mình đang thế nào</h1>
        <p className="mt-3 leading-7 text-slate-700">Đây không phải bài kiểm tra tâm lý hay chẩn đoán. Kết quả không được lưu mặc định; nó chỉ giúp bạn chọn bước tiếp theo cho hôm nay.</p>
        <CheckInForm />
      </div>
    </div>
  );
}
