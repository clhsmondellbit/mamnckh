import { ResourceLibrary } from '@/components/resource-library';
import { resources } from '@/lib/resources/data';

export default function ResourcesPage() {
  const studentResources = resources.filter((resource) => resource.audience === 'student');

  return (
    <div className="page-shell py-10 sm:py-14">
      <div className="max-w-2xl">
        <p className="eyebrow">Góc hỗ trợ</p>
        <h1 className="mt-2 text-3xl font-extrabold text-ink">Một vài điều có thể giúp bạn bắt đầu</h1>
        <p className="mt-3 leading-7 text-slate-700">
          Tìm kiếm, lọc theo chủ đề và lưu lại nội dung bạn thấy hữu ích. Những gợi ý này không thay thế sự giúp đỡ trực tiếp.
        </p>
      </div>
      <ResourceLibrary resources={studentResources} />
    </div>
  );
}
