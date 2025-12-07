import React from "react";
import { FaFacebookF, FaYoutube, FaInstagram } from "react-icons/fa";
import { Link } from "react-router-dom";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className=" py-4">
        {/* <div className="row headfooter"> */}
          {/* Về FarmHub */}
          {/* <div className="col-md-3 mb-3">
            <h5 className="text-warning fw-bold">VỀ FARMHUB</h5>
            <p className="text-white small">
              Nền tảng công nghệ hỗ trợ nông dân trong việc quản lý cây trồng, 
              theo dõi sức khỏe cây, và kết nối với chuyên gia nông nghiệp.
            </p>
            <p className="text-white small mt-2">
              <strong> Nông nghiệp thông minh</strong>
              <br />
              Áp dụng AI và công nghệ hiện đại vào sản xuất nông nghiệp.
            </p>
          </div> */}

          {/* Tính năng */}
          {/* <div className="col-md-3 mb-3">
            <h5 className="text-warning fw-bold">TÍNH NĂNG NỔI BẬT</h5>
            <ul className="list-unstyled text-white small">
              <li className="mb-2"> Sổ tay điện tử theo dõi cây trồng</li>
              <li className="mb-2"> AI phát hiện bệnh cây trồng</li>
              <li className="mb-2"> Kết nối với chuyên gia</li>
              <li className="mb-2"> Thống kê và phân tích dữ liệu</li>
              <li className="mb-2"> Kho kiến thức nông nghiệp</li>
            </ul>
          </div> */}

          {/* Hỗ trợ */}
          {/* <div className="col-md-3 mb-3">
            <h5 className="text-warning fw-bold">HỖ TRỢ & HƯỚNG DẪN</h5>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link to="/guides" className="text-white text-decoration-none small">
                  Hướng dẫn sử dụng
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/guides" className="text-white text-decoration-none small">
                  Mẹo canh tác
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/diseases" className="text-white text-decoration-none small">
                  Bệnh cây trồng phổ biến
                </Link>
              </li>
              <li className="mb-2">
                <span className="text-white small" style={{cursor: 'pointer'}}>
                  Điều khoản sử dụng
                </span>
              </li>
              <li className="mb-2">
                <span className="text-white small" style={{cursor: 'pointer'}}>
                  Chính sách bảo mật
                </span>
              </li>
            </ul>
          </div> */}

          {/* Liên hệ */}
          {/* <div className="col-md-3 mb-3">
            <h5 className="text-warning fw-bold">LIÊN HỆ VỚI CHÚNG TÔI</h5>
            <p className="fs-4 fw-bold text-warning">(HOTLINE) 0763 479 964</p>
            <h6 className="text-warning fw-bold">THEO DÕI CHÚNG TÔI</h6>
            <div className="d-flex gap-3 mt-3 iconfooter">
              <a
                href="https://www.facebook.com/people/FarmHub/61577586672365/"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
              >
                <FaFacebookF size={20} />
              </a>
            </div>
            <p className="text-white small mt-3">
              📧 Email: support@farmhub.vn
              <br />
              📍 TP.Cần Thơ, Việt Nam
            </p>
          </div>
        </div> */}


        <div className="text-center mt-3">
          <p className="mb-0 text-white">
            © 2025 <span className="text-warning fw-bold">FarmHub</span>. All
            rights reserved.
          </p>
          <p className="mb-0 text-white">(HOTLINE) 0763 479 964</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
