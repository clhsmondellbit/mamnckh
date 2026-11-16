import { PersonalStudio } from '@/components/studio/personal-studio';

export const metadata = {
  title: 'Không gian riêng tư | MẦM',
  description: 'Nhật ký, ký ức, phản tư và hành trình phát triển cá nhân được mã hóa trên thiết bị.',
};

export default function StudioPage() {
  return (
    <main className="page-shell py-8 sm:py-12">
      <p className="eyebrow">UNDERSTAND · REFLECT · GROW</p>
      <h1 className="mt-2 text-3xl font-extrabold text-ink">Không gian cá nhân</h1>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-700">
        Một không gian tùy chọn để ghi lại trải nghiệm, khám phá góc nhìn và theo dõi mục tiêu. Bạn kiểm soát cụm mật khẩu, dữ liệu và nhịp tham gia.
      </p>
      <PersonalStudio />
    </main>
  );
}
