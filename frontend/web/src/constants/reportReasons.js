const REPORT_REASONS = [
  { value: 'abusive_language', label: 'Ngôn từ thô tục', description: 'Bài đăng chứa từ ngữ xúc phạm, chửi bới hoặc ngôn từ không phù hợp.' },
  { value: 'misleading', label: 'Sản phẩm khác mô tả', description: 'Sản phẩm/dịch vụ không như mô tả, chất lượng kém so với quảng cáo.' },
  { value: 'scam', label: 'Lừa đảo / Yêu cầu thanh toán', description: 'Bài đăng có dấu hiệu lừa đảo, yêu cầu thanh toán trước không rõ ràng.' },
  { value: 'illegal', label: 'Hàng cấm / Vi phạm pháp luật', description: 'Bài đăng rao bán hàng hóa hoặc dịch vụ bị cấm/phi pháp.' },
  { value: 'spam', label: 'Spam / Quảng cáo không liên quan', description: 'Nhiều bài giống nhau, quảng cáo không liên quan tới chợ.' },
  { value: 'other', label: 'Khác', description: 'Lý do khác (mô tả chi tiết trong nội dung).' },
];

export default REPORT_REASONS;
