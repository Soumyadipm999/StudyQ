import React, { useState } from 'react';
import { X, Upload, Loader2, FileText, Tag } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { StudyMaterial } from '../../types';
import { saveMaterial, generateMaterialId } from '../../utils/materials';
import { logAuditEvent } from '../../utils/audit';

interface MaterialUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const MaterialUploadModal: React.FC<MaterialUploadModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    semester: 1,
    academic_year: new Date().getFullYear(),
    description: '',
    tags: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setFormData({
      title: '',
      subject: '',
      semester: 1,
      academic_year: new Date().getFullYear(),
      description: '',
      tags: ''
    });
    setSelectedFile(null);
    setError('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'semester' || name === 'academic_year' ? parseInt(value) : value
    }));
  };

  const handleFileSelect = (file: File) => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt', 'jpg', 'png'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (file.size > maxSize) {
      alert('File size must be less than 50MB');
      return;
    }

    if (!fileExtension || !allowedTypes.includes(fileExtension)) {
      alert('File type not allowed. Please upload PDF, DOC, DOCX, PPT, PPTX, TXT, JPG, or PNG files.');
      return;
    }

    setSelectedFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    if (!user) {
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);

    try {
      // Convert file to base64 for storage (in production, this would be uploaded to a file server)
      const fileReader = new FileReader();
      fileReader.onload = () => {
        const fileUrl = fileReader.result as string;
        
        const newMaterial: StudyMaterial = {
          id: generateMaterialId(),
          title: formData.title,
          description: formData.description,
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          fileType: selectedFile.type,
          uploadedBy: user.id,
          uploadedByName: `${user.firstName} ${user.lastName}`,
          uploadDate: new Date().toISOString(),
          semester: formData.semester,
          academicYear: formData.academic_year,
          subject: formData.subject,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
          isActive: true,
          downloadCount: 0
        };

        saveMaterial(newMaterial);

        // Log the upload action
        logAuditEvent(
          user.id,
          `${user.firstName} ${user.lastName}`,
          'MATERIAL_UPLOAD',
          `Uploaded material: ${formData.title} for Semester ${formData.semester}`
        );

        onSuccess();
        resetForm();
        setIsLoading(false);
      };

      fileReader.onerror = () => {
        setError('Failed to process file');
        setIsLoading(false);
      };

      fileReader.readAsDataURL(selectedFile);
    } catch (error) {
      setError('Upload failed. Please try again.');
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Upload Study Material</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload Area */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select File *
              </label>
              <div
                className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragActive
                    ? 'border-blue-400 bg-blue-50'
                    : selectedFile
                    ? 'border-green-400 bg-green-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.png"
                />
                
                {selectedFile ? (
                  <div className="space-y-2">
                    <FileText className="w-8 h-8 text-green-500 mx-auto" />
                    <p className="text-sm font-medium text-green-700">{selectedFile.name}</p>
                    <p className="text-xs text-green-600">{formatFileSize(selectedFile.size)}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                    <p className="text-sm text-gray-600">
                      Drag and drop your file here, or <span className="text-blue-600">browse</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      Supported: PDF, DOC, DOCX, PPT, PPTX, TXT, JPG, PNG (Max 50MB)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Material Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  placeholder="Enter material title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  placeholder="e.g., Computer Science, Mathematics"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Semester *
                </label>
                <select
                  name="semester"
                  value={formData.semester}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {[...Array(8)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>Semester {i + 1}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Academic Year *
                </label>
                <select
                  name="academic_year"
                  value={formData.academic_year}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {[...Array(5)].map((_, i) => {
                    const year = new Date().getFullYear() - 2 + i;
                    return <option key={year} value={year}>{year}</option>;
                  })}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Brief description of the material content"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., algorithms, data structures, programming"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !selectedFile}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin inline" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-1 inline" />
                    Upload Material
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MaterialUploadModal;