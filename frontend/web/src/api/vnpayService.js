import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const vnpayService = {
  /**
   * Tạo URL thanh toán VNPay
   * @param {Object} paymentData - Dữ liệu thanh toán
   * @param {number} paymentData.amount - Số tiền (VND)
   * @param {string} paymentData.orderDescription - Mô tả đơn hàng
   * @param {string} paymentData.userId - ID người dùng
   * @param {Array} paymentData.items - Danh sách sản phẩm
   * @returns {Promise} Payment URL và thông tin order
   */
  createPaymentUrl: async (paymentData) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/vnpay/create_payment_url`,
        paymentData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error creating payment URL:", error);
      throw error.response?.data || error;
    }
  },

  /**
   * Lấy thông tin đơn hàng theo ID
   * @param {string} orderId - Order ID
   * @returns {Promise} Order details
   */
  getOrderById: async (orderId) => {
    try {
      const response = await axios.get(`${API_URL}/api/vnpay/order/${orderId}`);
      return response.data;
    } catch (error) {
      console.error("Error getting order:", error);
      throw error.response?.data || error;
    }
  },

  /**
   * Lấy danh sách đơn hàng của user
   * @param {string} userId - User ID
   * @param {Object} params - Query params (page, limit, status, paymentStatus)
   * @returns {Promise} List of orders with pagination
   */
  getUserOrders: async (userId, params = {}) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/vnpay/orders/user/${userId}`,
        {
          params: {
            page: params.page || 1,
            limit: params.limit || 20,
            status: params.status,
            paymentStatus: params.paymentStatus,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error getting user orders:", error);
      throw error.response?.data || error;
    }
  },
};

export default vnpayService;
