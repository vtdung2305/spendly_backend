export function emailOtpTemplate(firstName: string, code: string, expiryMinutes: number): string {
  return `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1E293B;">
      <h2 style="color: #4F46E5;">Xác thực email Spendly</h2>
      <p>Chào ${firstName},</p>
      <p>Mã xác thực của bạn là:</p>
      <p style="margin: 24px 0; text-align: center;">
        <span style="display:inline-block;background:#EEF2FF;color:#4F46E5;font-family:'IBM Plex Mono',monospace;
          font-size:32px;font-weight:700;letter-spacing:8px;padding:16px 24px;border-radius:16px;">${code}</span>
      </p>
      <p>Mã có hiệu lực trong ${expiryMinutes} phút. Nếu bạn không yêu cầu mã này, hãy bỏ qua email.</p>
      <p style="color:#94A3B8;font-size:12px;">Spendly — Quản lý chi tiêu cá nhân</p>
    </div>
  `;
}
