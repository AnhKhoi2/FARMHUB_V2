// src/pages/ExpertPlantModels.jsx
import React, { useEffect, useState } from "react"
import "../css/ExpertHome.css"
import axiosClient from "../api/axiosClient"

function ExpertPlantModels() {
	const emptyForm = { crop: "", area: "", soil: "", climate: "", irrigation: "", description: "" }
	const [list, setList] = useState([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState(null)
	const [view, setView] = useState("all") // 'all' or 'trash'
	const [trashCount, setTrashCount] = useState(0)
	const [allCount, setAllCount] = useState(0)
	const [form, setForm] = useState(emptyForm)
	const [editingId, setEditingId] = useState(null)
	const [search, setSearch] = useState("")

		useEffect(() => {
			fetchList(view)
		}, [])

		useEffect(() => {
			fetchList(view)
			fetchTrashCount()
			fetchAllCount()
		}, [view])

		useEffect(() => {
			// initial trash count
			fetchTrashCount()
			fetchAllCount()
		}, [])

		async function fetchTrashCount() {
			try {
				const res = await axiosClient.get('/plant-models/trash')
				if (Array.isArray(res.data)) setTrashCount(res.data.length)
			} catch (err) {
				// ignore
			}
		}

		async function fetchAllCount() {
			try {
				const res = await axiosClient.get('/plant-models')
				if (Array.isArray(res.data)) setAllCount(res.data.length)
			} catch (err) {
				// ignore
			}
		}

	async function fetchList(currentView = "all") {
		setError(null)
		setLoading(true)
		try {
			if (currentView === "trash") {
				const res = await axiosClient.get("/plant-models/trash")
				setList(Array.isArray(res.data) ? res.data : [])
			} else {
				const res = await axiosClient.get("/plant-models")
				setList(Array.isArray(res.data) ? res.data : [])
			}
		} catch (err) {
			setError("Không tải được danh sách mô hình trồng")
		} finally {
			setLoading(false)
		}
	}

	function handleChange(e) {
		const { name, value } = e.target
		setForm((s) => ({ ...s, [name]: value }))
	}

	async function handleSave(e) {
		e?.preventDefault()
		setLoading(true)
		setError(null)
		// client-side validation
		if (!form.crop || !form.crop.trim()) {
			setError("Trường 'Cây trồng' là bắt buộc.")
			setLoading(false)
			return
		}
		try {
			const payload = { ...form }
			let res
					if (editingId) {
						await axiosClient.put(`/plant-models/${editingId}`, payload)
					} else {
						await axiosClient.post(`/plant-models`, payload)
					}

					await fetchList()
			setForm(emptyForm)
			setEditingId(null)
		} catch (err) {
			setError(err.message || "Lưu không thành công")
		} finally {
			setLoading(false)
		}
	}

	function startEdit(item) {
		setEditingId(item._id)
		setForm({
			crop: item.crop || "",
			area: item.area || "",
			soil: item.soil || "",
			climate: item.climate || "",
			irrigation: item.irrigation || "",
			description: item.description || "",
		})
		window.scrollTo({ top: 0, behavior: "smooth" })
	}

		async function handleDelete(id) {
			if (!confirm("Bạn có chắc muốn xóa mô hình trồng này không?")) return
		setLoading(true)
			try {
				await axiosClient.delete(`/plant-models/${id}`)
				await fetchList()
				await fetchTrashCount()
			} catch (err) {
				setError(err?.response?.data?.message || err.message || "Xóa không thành công")
			} finally {
				setLoading(false)
			}
	}

	async function handleRestore(id) {
		if (!confirm("Bạn có chắc muốn khôi phục mô hình này?")) return
		setLoading(true)
		try {
			await axiosClient.put(`/plant-models/${id}/restore`)
			// after restore, refresh both lists/count
			if (view === 'trash') await fetchList('trash')
			else await fetchList()
			await fetchTrashCount()
		} catch (err) {
			setError(err?.response?.data?.message || err.message || "Khôi phục không thành công")
		} finally {
			setLoading(false)
		}
	}

	async function handlePermanentDelete(id) {
		if (!confirm("Xóa vĩnh viễn sẽ không thể khôi phục. Bạn có chắc?")) return
		setLoading(true)
		try {
			await axiosClient.delete(`/plant-models/${id}/permanent`)
			await fetchList(view)
			await fetchTrashCount()
		} catch (err) {
			setError(err?.response?.data?.message || err.message || "Xóa vĩnh viễn không thành công")
		} finally {
			setLoading(false)
		}
	}

	async function handleSuggest() {
			try {
						const res = await axiosClient.post(`/plant-models/suggest`, { crop: form.crop, area: form.area, soil: form.soil, climate: form.climate, irrigation: form.irrigation })
						const data = res.data
						alert((data.title || "Gợi ý") + "\n" + (Array.isArray(data.details) ? data.details.join("\n") : data.details))
			} catch (err) {
						alert("Không thể lấy gợi ý. " + (err?.response?.data?.message || err.message))
			}
	}

		const filtered = list.filter((i) => {
		if (!search) return true
		const s = search.toLowerCase()
		return (
			(i.crop || "").toLowerCase().includes(s) ||
			(i.soil || "").toLowerCase().includes(s) ||
			(i.climate || "").toLowerCase().includes(s)
		)
	})

	return (
		<div className="expert-home">
			<main className="expert-main">
				<div className="content-container">
					<section className="welcome-section">
							<h2 className="welcome-title">Quản lý Mô hình Trồng</h2>
							<p className="welcome-subtitle">Tạo, chỉnh sửa và quản lý các mô hình trồng để gợi ý kế hoạch canh tác.</p>
					</section>

					<section className="content-area">
							<div className="panel">
								<div className="manager-grid">
							<div className="card">
								{error && <p className="subtitle" style={{ color: 'var(--color-error)', marginBottom: 8 }}>{error}</p>}
								<form onSubmit={handleSave} className="form-grid">
									<div>
														<label>Cây trồng *</label>
														<input name="crop" value={form.crop} onChange={handleChange} required placeholder="Ví dụ: Cà chua" />
									</div>

									<div>
														<label>Diện tích (m²)</label>
														<input name="area" value={form.area} onChange={handleChange} type="number" placeholder="Ví dụ: 100" />
									</div>

									<div>
														<label>Đất</label>
														<input name="soil" value={form.soil} onChange={handleChange} placeholder="Ví dụ: Đất tơi xốp" />
									</div>

									<div>
														<label>Khí hậu</label>
														<input name="climate" value={form.climate} onChange={handleChange} placeholder="Ví dụ: Nhiệt đới ẩm" />
									</div>

									<div>
														<label>Tưới</label>
														<input name="irrigation" value={form.irrigation} onChange={handleChange} placeholder="Ví dụ: Nhỏ giọt" />
									</div>

									<div>
														<label>Mô tả</label>
														<textarea name="description" value={form.description} onChange={handleChange} rows={4} placeholder="Thêm ghi chú hoặc hướng dẫn sơ bộ" />
									</div>

									<div className="cta-row">
										<button className="btn btn-primary" type="submit" disabled={loading}>{editingId ? "Cập nhật" : "Tạo"}</button>
										<button type="button" className="btn btn-secondary" onClick={handleSuggest}>Gợi ý</button>
										<button type="button" className="btn" onClick={() => { setForm(emptyForm); setEditingId(null); }}>Đặt lại</button>
									</div>
								</form>
							</div>

							<div className="card">
								<div className="card-header" style={{ marginBottom: 12 }}>
									<div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
										<div className="card-title">
											<strong className="title-text">Mô hình trồng</strong>
											<div className="tab-switcher" style={{ marginLeft: 12 }}>
												<button className={"btn " + (view === 'all' ? 'btn-primary' : '')} onClick={async () => { setView('all'); setSearch(''); await fetchList('all'); fetchAllCount(); }}>Tất cả ({allCount})</button>
												<button className={"btn btn-trash " + (view === 'trash' ? 'active' : '')} onClick={async () => { setView('trash'); await fetchList('trash'); fetchTrashCount(); }}>{"Thùng rác "}{trashCount > 0 && <span className="trash-badge">{trashCount}</span>}</button>
											</div>
										</div>
									</div>
									<div className="search-input">
										<input placeholder="Tìm theo cây/đất/khí hậu" value={search} onChange={(e) => setSearch(e.target.value)} />
									</div>
								</div>

								<div className="table-wrap">
									{loading ? (
										<p>Đang tải...</p>
									) : error ? (
										<p className="subtitle">{error}</p>
									) : filtered.length === 0 ? (
										<div className="empty-state">
											<p>Không có mô hình nào ở đây.</p>
											<button className="btn btn-primary" onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }}>{view === 'trash' ? 'Tạo mới' : 'Tạo mô hình mới'}</button>
										</div>
									) : (
										<table className="plant-table">
											<thead>
												<tr>
													<th>Cây trồng</th>
													<th>Diện tích</th>
													<th>Đất</th>
													<th>Khí hậu</th>
													<th>Tưới</th>
													{view === 'trash' && <th>Đã xoá lúc</th>}
													<th>Hành động</th>
												</tr>
												</thead>
												<tbody>
												{filtered.map((item) => (
													<tr key={item._id}>
														<td>{item.crop}</td>
														<td>{item.area ?? "-"}</td>
														<td>{item.soil ?? "-"}</td>
														<td>{item.climate ?? "-"}</td>
														<td>{item.irrigation ?? "-"}</td>
														{view === 'trash' && <td>{item.deletedAt ? new Date(item.deletedAt).toLocaleString() : '-'}</td>}
														<td className="action-btns">
															{view !== 'trash' ? (
																<>
																	<button className="btn btn-secondary" onClick={() => startEdit(item)} style={{ marginRight: 6 }}>Sửa</button>
																	<button className="btn btn-danger" onClick={() => handleDelete(item._id)}>Xóa</button>
																</>
															) : (
																<>
																	<button className="btn btn-secondary" onClick={() => handleRestore(item._id)} style={{ marginRight: 6 }}>Khôi phục</button>
																	<button className="btn btn-danger" onClick={() => handlePermanentDelete(item._id)}>Xóa vĩnh viễn</button>
																</>
															)}
														</td>
													</tr>
												))}
												</tbody>
											</table>
										)}
								</div>
								</div>
					
							</div>
						</div>
						</section>
				</div>
			</main>
		</div>
	)
}

export default ExpertPlantModels
