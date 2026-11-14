export default function PrivacyPage() {
  return (
    <div className="page-shell py-10 sm:py-14">
      <article className="mx-auto max-w-3xl">
        <p className="eyebrow">Quyền riêng tư</p>
        <h1 className="mt-2 text-3xl font-extrabold text-ink">Chỉ chia sẻ điều cần thiết</h1>
        <div className="mt-7 space-y-6 leading-7 text-slate-700">
          <section>
            <h2 className="text-xl font-bold text-ink">MẦM được thiết kế để giảm thu thập dữ liệu</h2>
            <p className="mt-2">Bạn có thể trò chuyện với tư cách khách. MẦM không yêu cầu tên thật cho những cuộc trò chuyện thông thường. Lịch sử chat đang hiển thị chỉ nằm trong bộ nhớ của trang và sẽ mất khi tải lại hoặc đóng trang; ứng dụng không lưu transcript này vào cơ sở dữ liệu của MẦM.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-ink">Khi AI được bật</h2>
            <p className="mt-2">Nếu đơn vị vận hành cấu hình nhà cung cấp AI, tin nhắn hiện tại cùng tối đa 8 lượt chia sẻ trước đó của bạn sẽ được gửi tới nhà cung cấp đó để xử lý. Một số nội dung cũng có thể được gửi tới mô hình guardrail của cùng cấu hình để rà soát an toàn đầu vào và đầu ra. Nhà cung cấp AI có chính sách xử lý dữ liệu riêng; không gửi thông tin mà bạn không muốn chia sẻ với nhà cung cấp bên ngoài. Nếu chưa cấu hình AI, MẦM không giả lập câu trả lời do AI tạo ra.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-ink">Không nên gửi</h2>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Mật khẩu, mã OTP hoặc thông tin đăng nhập mạng xã hội</li>
              <li>Thông tin tài chính</li>
              <li>Địa chỉ nhà chính xác hoặc thông tin nhận dạng không cần thiết</li>
              <li>Thông tin riêng tư của người khác</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-bold text-ink">Check-in và nội dung đã lưu</h2>
            <p className="mt-2">Câu trả lời check-in chỉ được xử lý trong yêu cầu và không được lưu vào cơ sở dữ liệu. Danh sách tài nguyên yêu thích chỉ lưu mã tài nguyên công khai trong local storage trên trình duyệt của thiết bị bạn sử dụng; bạn có thể xóa dữ liệu trang web trong cài đặt trình duyệt để xóa mục đã lưu.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-ink">Khi cần người thật hỗ trợ</h2>
            <p className="mt-2">MẦM không hứa bí mật tuyệt đối. Với yêu cầu hỗ trợ tự nguyện, chỉ thông tin bạn chủ động gửi trong biểu mẫu mới được chuyển tới nhân sự hỗ trợ được nhà trường phân quyền; toàn bộ transcript chat không được gửi kèm. Không dùng biểu mẫu này cho tình huống khẩn cấp và không mặc định rằng sẽ có người phản hồi ngay.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-ink">Chính sách của trường và giới hạn của thông tin này</h2>
            <p className="mt-2">Chính sách lưu trữ, quyền truy cập, thời hạn lưu dữ liệu, cách xử lý yêu cầu xóa và thỏa thuận với nhà cung cấp AI phải do đơn vị vận hành/nhà trường công bố và xác minh trước khi triển khai. Trang này mô tả hành vi của mã nguồn hiện tại, không thay thế thông báo pháp lý hoặc đánh giá tuân thủ.</p>
          </section>
        </div>
      </article>
    </div>
  );
}
