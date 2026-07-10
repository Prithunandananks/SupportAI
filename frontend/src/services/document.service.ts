import apiClient from "../api/client";

export interface UploadResponse {
  filename: string;
  document_id: string;
  chunks_processed: number;
}

export const documentService = {
  async uploadDocument(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post<UploadResponse>(
      "/documents/upload",
      formData,
      {
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(progress);
          }
        },
      }
    );

    return response.data;
  },
};
