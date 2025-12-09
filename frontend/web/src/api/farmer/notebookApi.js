import api from "../shared/axiosClient";

const notebookApi = {
  // CRUD Operations
  getAllNotebooks: () => api.get("/notebooks"),

  getNotebookById: (id) => api.get(`/notebooks/${id}`),

  createNotebook: (data) => api.post("/notebooks", data),

  updateNotebook: (id, data) => api.put(`/notebooks/${id}`, data),

  deleteNotebook: (id) => api.delete(`/notebooks/${id}`),

  // Soft Delete Management
  restoreNotebook: (id) => api.post(`/notebooks/${id}/restore`),

  getDeletedNotebooks: () => api.get("/notebooks/deleted"),

  permanentDeleteNotebook: (id) => api.delete(`/notebooks/${id}/permanent`),

  // Search & Filter
  searchNotebooks: (keyword, status) =>
    api.get("/notebooks/search", { params: { keyword, status } }),

  filterNotebooks: (filters) =>
    api.get("/notebooks/filter", { params: filters }),

  // Image Management
  addImage: (id, imageUrl) =>
    api.post(`/notebooks/${id}/images`, { image_url: imageUrl }),

  removeImage: (id, imageUrl) =>
    api.delete(`/notebooks/${id}/images`, { data: { image_url: imageUrl } }),

  // Template Integration (imported from notebookTemplateApi)
  getTemplate: (notebookId) => api.get(`/notebooks/${notebookId}/template`),

  assignTemplate: (notebookId, templateId) =>
    api.post(`/notebooks/${notebookId}/template`, { template_id: templateId }),

  getTimeline: (notebookId) => api.get(`/notebooks/${notebookId}/timeline`),

  getDailyChecklist: (notebookId) =>
    api.get(`/notebooks/${notebookId}/checklist`),

  completeTask: (notebookId, taskName) =>
    api.post(`/notebooks/${notebookId}/checklist/complete`, {
      task_name: taskName,
    }),

  updateStage: (notebookId, stageNumber) =>
    api.put(`/notebooks/${notebookId}/stage`, { stage_number: stageNumber }),

  getCurrentObservations: (notebookId) =>
    api.get(`/notebooks/${notebookId}/observations`),

  updateObservation: (notebookId, observationKey, value) =>
    api.post(`/notebooks/${notebookId}/observations`, {
      observation_key: observationKey,
      value: value,
    }),

  calculateStage: (notebookId) =>
    api.get(`/notebooks/${notebookId}/calculate-stage`),

  // Daily Status & Overdue Management
  getDailyStatus: (notebookId) =>
    api.get(`/notebooks/${notebookId}/daily/status`),

  // Stats
  getNotebookStats: () => api.get(`/notebooks/stats`),

  getOverdueDetail: (notebookId) =>
    api.get(`/notebooks/${notebookId}/daily/overdue/detail`),

  skipOverdueTasks: (notebookId) =>
    api.post(`/notebooks/${notebookId}/daily/overdue/skip`),
  completeOverdueTask: (notebookId, taskName) =>
    api.post(`/notebooks/${notebookId}/daily/overdue/complete`, {
      task_name: taskName,
    }),
  completeOverdueTasksBulk: (notebookId, taskNames) =>
    api.post(`/notebooks/${notebookId}/daily/overdue/complete-bulk`, {
      task_names: taskNames,
    }),
};

export default notebookApi;
