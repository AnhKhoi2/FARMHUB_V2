import React from "react";
import { FaFacebookF, FaYoutube, FaInstagram } from "react-icons/fa";
import { Link } from "react-router-dom";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container-fluid px-4">
        <div className="row headfooter">
          <div className="col-md-4 mb-3">
            <h5>GỌI CHO CHÚNG TÔI 24/7</h5>
            <p className="fs-4 fw-bold text-warning">(1800)-88-66-991</p>
            <h6>THEO DÕI CHÚNG TÔI</h6>
            <div className="d-flex gap-3 mt-3 iconfooter">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
              >
                <FaFacebookF size={20} />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
              >
                <FaYoutube size={20} />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
              >
                <FaInstagram size={20} />
              </a>
            </div>
          </div>

          <div className="col-md-2 mb-3">
            <h6>VỊ TRÍ CỬA HÀNG</h6>
            <p>9066 600 NGUYỄN VĂN CỪ, P.AN BÌNH, TP.CẦN THƠ</p>
            <p className="text-warning">contact@farmhub.com</p>
          </div>

          <div className="col-md-2 mb-3">
            <h6>THÔNG TIN</h6>
            <ul>
              <li>
                <Link to="/about">Về chúng tôi</Link>
              </li>
              <li>
                <Link to="/news">Blog</Link>
              </li>
              <li>
                <Link to="/shop">Kiểm tra</Link>
              </li>
              <li>
                <Link to="/contact">Liên hệ</Link>
              </li>
              <li>
                <Link to="/services">Dịch vụ</Link>
              </li>
            </ul>
          </div>

          <div className="col-md-2 mb-3">
            <h6>TÀI KHOẢN CỦA TÔI</h6>
            <ul>
              <li>
                <Link to="/profile">Tài khoản của tôi</Link>
              </li>
              <li>
                <Link to="/contact">Liên hệ</Link>
              </li>
              <li>
                <Link to="/cart">Giỏ hàng</Link>
              </li>
              <li>
                <Link to="/shop">Cửa hàng</Link>
              </li>
            </ul>
          </div>

          <div className="col-md-2 mb-3">
            <h6>DANH MỤC</h6>
            <ul>
              <li>
                <Link to="/shop?category=fruits">Trái cây và rau củ</Link>
              </li>
              <li>
                <Link to="/shop?category=seeds">Hạt giống</Link>
              </li>
              <li>
                <Link to="/shop?category=tools">Dụng cụ làm vườn</Link>
              </li>
            </ul>
          </div>
        </div>

        <hr className="my-2" />

        <div className="text-center mt-3">
          <p className="mb-0">
            © 2025 <span className="text-warning fw-bold">FarmHub</span>. All
            rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
