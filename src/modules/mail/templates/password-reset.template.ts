export function passwordResetTemplate(firstName: string, resetLink: string): string {
  return `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1E293B;">
      <h2 style="color: #4F46E5;">Đặt lại mật khẩu Spendly</h2>
      <p>Chào ${firstName},</p>
      <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Liên kết bên dưới có hiệu lực trong 30 phút.</p>
      <p style="margin: 24px 0;">
        <a href="${resetLink}" style="background:#4F46E5;color:#fff;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:600;">
          Đặt lại mật khẩu
        </a>
      </p>
      <p>Nếu bạn không yêu cầu điều này, hãy bỏ qua email này — mật khẩu của bạn sẽ không thay đổi.</p>
      <p style="color:#94A3B8;font-size:12px;">Spendly — Quản lý chi tiêu cá nhân</p>
    </div>
  `;
}
