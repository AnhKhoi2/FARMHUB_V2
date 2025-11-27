import React, { useEffect, useState } from "react";
import { Modal, Button, Select, Row, Col, List, Spin, Alert } from "antd";
import axiosClient from "../../api/shared/axiosClient";
import { useDispatch } from "react-redux";
import { updateUserProfile } from "../../redux/authSlice";

const { Option } = Select;

export default function SuggestionModal({ open, onClose, mode = "onboarding", inline = false }) {
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState({});
  const [selected, setSelected] = useState({});
  const [suggestedModels, setSuggestedModels] = useState([]);
  const [error, setError] = useState(null);
  const [viewing, setViewing] = useState(mode === "view");
  const dispatch = useDispatch();

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    axiosClient
      .get("/profile/model-suggestion")
      .then((res) => {
        const data = res.data?.data || {};
        setOptions(data.options || {});
        setSelected(data.modelSuggestion?.selectedOptions || {});
      })
      .catch((err) => {
        console.error(err);
        setError("Không thể tải tuỳ chọn gợi ý");
      })
      .finally(() => setLoading(false));
  }, [open]);

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.post("/profile/model-suggestion/select", { selectedOptions: selected });
      // after saving, fetch suggestions to show
      await fetchSuggestions();
      // switch to suggestions view inside the same component
      setViewing(true);
      try {
        const modelSuggestion = res.data?.data?.modelSuggestion || { selectedOptions: selected };
        // update redux profile so app immediately knows user has selected options
        dispatch(updateUserProfile({ modelSuggestion }));
      } catch {
        // ignore
      }
    } catch (err) {
      console.error(err);
      setError("Lưu tuỳ chọn thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    setError(null);
    try {
      await axiosClient.post("/profile/model-suggestion/skip");
      onClose && onClose();
    } catch (err) {
      console.error(err);
      setError("Thao tác bỏ qua thất bại");
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get("/admin/models/suggestions");
      const items = res.data?.data || [];
      setSuggestedModels(items);
    } catch (err) {
      console.error(err);
      setError("Không thể tải gợi ý model");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mode === "view" && open) {
      setViewing(true);
      fetchSuggestions();
      return;
    }

    // sync viewing with props when modal/panel opens or mode changes
    setViewing(mode === "view");
  }, [open, mode]);

  const renderForm = () => {
    if (loading) return <Spin />;
    return (
      <div>
        {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 12 }} />}
        <Row gutter={12}>
          <Col span={12}>
            <div style={{ marginBottom: 8 }}>Đất (soil)</div>
            <Select
              allowClear
              style={{ width: "100%" }}
              value={selected.soil}
              onChange={(v) => setSelected((s) => ({ ...s, soil: v }))}
            >
              {(options.soil || []).map((s) => (
                <Option key={s} value={s}>
                  {s}
                </Option>
              ))}
            </Select>
          </Col>

          <Col span={12}>
            <div style={{ marginBottom: 8 }}>Khí hậu (climate)</div>
            <Select
              allowClear
              style={{ width: "100%" }}
              value={selected.climate}
              onChange={(v) => setSelected((s) => ({ ...s, climate: v }))}
            >
              {(options.climate || []).map((s) => (
                <Option key={s} value={s}>
                  {s}
                </Option>
              ))}
            </Select>
          </Col>

          <Col span={12} style={{ marginTop: 12 }}>
            <div style={{ marginBottom: 8 }}>Tưới (irrigation)</div>
            <Select
              allowClear
              style={{ width: "100%" }}
              value={selected.irrigation}
              onChange={(v) => setSelected((s) => ({ ...s, irrigation: v }))}
            >
              {(options.irrigation || []).map((s) => (
                <Option key={s} value={s}>
                  {s}
                </Option>
              ))}
            </Select>
          </Col>

          <Col span={12} style={{ marginTop: 12 }}>
            <div style={{ marginBottom: 8 }}>Cường độ nắng (sunIntensity)</div>
            <Select
              allowClear
              style={{ width: "100%" }}
              value={selected.sunIntensity}
              onChange={(v) => setSelected((s) => ({ ...s, sunIntensity: v }))}
            >
              {(options.sunIntensity || []).map((s) => (
                <Option key={s} value={s}>
                  {s}
                </Option>
              ))}
            </Select>
          </Col>

          <Col span={12} style={{ marginTop: 12 }}>
            <div style={{ marginBottom: 8 }}>Gió (wind)</div>
            <Select
              allowClear
              style={{ width: "100%" }}
              value={selected.wind}
              onChange={(v) => setSelected((s) => ({ ...s, wind: v }))}
            >
              {(options.wind || []).map((s) => (
                <Option key={s} value={s}>
                  {s}
                </Option>
              ))}
            </Select>
          </Col>

          <Col span={12} style={{ marginTop: 12 }}>
            <div style={{ marginBottom: 8 }}>Sàn (floorMaterial)</div>
            <Select
              allowClear
              style={{ width: "100%" }}
              value={selected.floorMaterial}
              onChange={(v) => setSelected((s) => ({ ...s, floorMaterial: v }))}
            >
              {(options.floorMaterial || []).map((s) => (
                <Option key={s} value={s}>
                  {s}
                </Option>
              ))}
            </Select>
          </Col>

          <Col span={12} style={{ marginTop: 12 }}>
            <div style={{ marginBottom: 8 }}>Có mái che (hasRoof)</div>
            <Select
              allowClear
              style={{ width: "100%" }}
              value={selected.hasRoof}
              onChange={(v) => setSelected((s) => ({ ...s, hasRoof: v }))}
            >
              <Option value={true}>Có</Option>
              <Option value={false}>Không</Option>
            </Select>
          </Col>
        </Row>

        <div style={{ marginTop: 16, display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button onClick={handleSkip} disabled={loading}>
            Bỏ qua
          </Button>
          <Button type="primary" onClick={handleSave} loading={loading}>
            Lưu tuỳ chọn
          </Button>
        </div>
      </div>
    );
  };

  const renderSuggestions = () => {
    if (loading) return <Spin />;
    if (error) return <Alert message={error} type="error" showIcon />;
    if (!suggestedModels || suggestedModels.length === 0)
      return <div>Không có model phù hợp với tuỳ chọn của bạn.</div>;

    return (
      <List
        itemLayout="vertical"
        dataSource={suggestedModels}
        renderItem={(item) => (
          <List.Item>
            <List.Item.Meta title={`Model #${item.displayId || item._id}`} description={item.description || ""} />
            <div>
              <div>Đất: {item.soil}</div>
              <div>Khí hậu: {item.climate}</div>
              <div>Tưới: {item.irrigation}</div>
              <div>Nắng: {item.sunIntensity}</div>
            </div>
          </List.Item>
        )}
      />
    );
  };

  const title = viewing || mode === "view" ? "Gợi ý model của bạn" : "Chọn tuỳ chọn model của bạn";

  if (inline) {
    const panelStyle = { padding: 16, background: "#fff", borderRadius: 8 };
    return (
      <div style={{ marginTop: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
        </div>
        <div style={panelStyle}>{viewing ? renderSuggestions() : renderForm()}</div>
      </div>
    );
  }

  return (
    <Modal open={open} title={title} onCancel={onClose} footer={null} width={880}>
      {viewing ? renderSuggestions() : renderForm()}
    </Modal>
  );
}
