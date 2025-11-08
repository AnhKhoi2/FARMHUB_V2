import React, { useState } from "react";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";

export default function ExpertApplyForm() {
  const [form, setForm] = useState({
    full_name: "",
    expertise_area: "",
    experience_years: 0,
    description: "",
    phone_number: "",
    certificates: [""], // mảng url
  });

  const accessToken = useSelector(s => s.auth?.accessToken);

  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/expert-applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          ...form,
          certificates: form.certificates.filter(Boolean)
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Nộp đơn thất bại");
      toast.success("Đã nộp đơn, vui lòng chờ admin duyệt!");
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <input placeholder="Họ tên *" value={form.full_name}
        onChange={e => setField("full_name", e.target.value)} />

      <input placeholder="Lĩnh vực chuyên môn *" value={form.expertise_area}
        onChange={e => setField("expertise_area", e.target.value)} />

      <input type="number" min="0" placeholder="Số năm kinh nghiệm"
        value={form.experience_years}
        onChange={e => setField("experience_years", Number(e.target.value)||0)} />

      <input placeholder="SĐT (tuỳ chọn)" value={form.phone_number}
        onChange={e => setField("phone_number", e.target.value)} />

      <textarea placeholder="Mô tả ngắn" value={form.description}
        onChange={e => setField("description", e.target.value)} />

      <div>
        <label>Chứng chỉ (URL):</label>
        {form.certificates.map((url, i) => (
          <div key={i}>
            <input value={url}
              onChange={e => {
                const certs = [...form.certificates];
                certs[i] = e.target.value;
                setField("certificates", certs);
              }}/>
            {i === form.certificates.length - 1 && (
              <button type="button" onClick={() => setField("certificates", [...form.certificates, ""])}>+</button>
            )}
          </div>
        ))}
      </div>

      <button type="submit">Nộp đơn</button>
    </form>
  );
}
