import api from "../shared/axiosClient";

const NOTEBOOK_TEMPLATE_API = {
  // Lấy template cho notebook
  getTemplate: (notebookId) => api.get(`/notebooks/${notebookId}/template`),

  // Gán template cho notebook
  assignTemplate: (notebookId, templateId) =>
    api.post(`/notebooks/${notebookId}/template`, { template_id: templateId }),

  // Lấy timeline
  getTimeline: (notebookId) => api.get(`/notebooks/${notebookId}/timeline`),

  // Lấy daily checklist
  getDailyChecklist: (notebookId) =>
    api.get(`/notebooks/${notebookId}/checklist`),

  // Hoàn thành task
  completeTask: (notebookId, taskName) =>
    api.post(`/notebooks/${notebookId}/checklist/complete`, {
      task_name: taskName,
    }),

  // Cập nhật stage
  updateStage: (notebookId, stageNumber) =>
    api.put(`/notebooks/${notebookId}/stage`, { stage_number: stageNumber }),

  // Lấy observations của stage hiện tại
  getCurrentObservations: (notebookId) =>
    api.get(`/notebooks/${notebookId}/observations`),

  // Cập nhật observation
  updateObservation: (notebookId, observationKey, value) =>
    api.post(`/notebooks/${notebookId}/observations`, {
      observation_key: observationKey,
      value: value,
    }),

  // Tính stage hiện tại
  calculateStage: (notebookId) =>
    api.get(`/notebooks/${notebookId}/calculate-stage`),
};

export default NOTEBOOK_TEMPLATE_API;
