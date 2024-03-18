import { ref } from 'vue';
import CommonApi from '@/api/common.api';
import { ElMessage } from 'element-plus';
import type { UploadProps } from 'element-plus';
import i18n from '@/locale/index';

const { t } = i18n.global;
// 上传图片
export default function useUpload(fileType: string[], fileSize: number) {
  const fileUrl = ref('');

  function uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return CommonApi.uploadImage(formData)
      .then((res) => {
        ElMessage.success(t('common.updateSuccess'));
        return res.data;
      })
      .catch(() => {
        ElMessage.error(t('common.uploadError'));
        return Promise.reject();
      });
  }
  const httpRequest: UploadProps['httpRequest'] = (options) => uploadFile(options.file);

  const beforeUpload: UploadProps['beforeUpload'] = (rawFile) => {
    if (fileType.indexOf(rawFile.type) === -1) {
      ElMessage.error(t('common.fileTypeError')!);
      return false;
    }
    if (rawFile.size / 1024 / 1024 > fileSize) {
      ElMessage.error(t('common.fileSizeError', { size: fileSize }));
      return false;
    }
    return true;
  };

  return {
    fileUrl,
    uploadFile,
    httpRequest,
    beforeUpload,
  };
}
