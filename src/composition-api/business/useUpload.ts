import { ref } from 'vue';
import CommonApi from '@/api/common.api';
import { ElMessage } from 'element-plus';
import type { UploadProps } from 'element-plus';
// 上传图片
export default function useUpload(fileType: string[], fileSize: number) {
  const fileUrl = ref('');

  function uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return CommonApi.uploadImage(formData).then((res) => {
      ElMessage.success('上传成功');
      return res.data;
    }).catch(() => {
      ElMessage.error('上传失败');
      return Promise.reject();
    });
  }
  const httpRequest: UploadProps['httpRequest'] = (options) => uploadFile(options.file);

  const beforeUpload: UploadProps['beforeUpload'] = (rawFile) => {
    if (fileType.indexOf(rawFile.type) === -1) {
      ElMessage.error('文件类型错误!');
      return false;
    } if (rawFile.size / 1024 / 1024 > fileSize) {
      ElMessage.error(`文件大小不能超过 ${fileSize}MB!`);
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
