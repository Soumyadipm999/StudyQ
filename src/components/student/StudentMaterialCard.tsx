import React from 'react';
import { FileText, Download, Calendar, Tag } from 'lucide-react';
import { StudyMaterial } from '../../types';

interface StudentMaterialCardProps {
  material: StudyMaterial;
  onUpdate: () => void;
}

const StudentMaterialCard: React.FC<StudentMaterialCardProps> = ({ material, onUpdate }) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) {
      return <FileText className="w-8 h-8 text-red-500" />;
    } else if (fileType.includes('doc')) {
      return <FileText className="w-8 h-8 text-blue-500" />;
    } else if (fileType.includes('ppt')) {
      return <FileText className="w-8 h-8 text-orange-500" />;
    } else if (fileType.includes('image')) {
      return <FileText className="w-8 h-8 text-green-500" />;
    }
    
    return <FileText className="w-8 h-8 text-gray-400" />;
  };

  const getSemesterColor = (semester: number) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-yellow-100 text-yellow-800',
      'bg-red-100 text-red-800',
      'bg-purple-100 text-purple-800',
      'bg-indigo-100 text-indigo-800',
      'bg-pink-100 text-pink-800',
      'bg-gray-100 text-gray-800'
    ];
    return colors[(semester - 1) % colors.length];
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {getFileIcon(material.fileType)}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-medium text-gray-900 truncate" title={material.title}>
                {material.title}
              </h3>
              <p className="text-sm text-gray-500">{material.subject}</p>
            </div>
          </div>
        </div>

        {/* Description */}
        {material.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {material.description}
          </p>
        )}

        {/* Tags */}
        {material.tags && material.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {material.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
              >
                <Tag className="w-3 h-3 mr-1" />
                {tag}
              </span>
            ))}
            {material.tags.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                +{material.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Metadata */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Semester:</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSemesterColor(material.semester)}`}>
              Semester {material.semester}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Academic Year:</span>
            <span className="text-gray-900">{material.academicYear}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">File Size:</span>
            <span className="text-gray-900">{formatFileSize(material.fileSize)}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Downloads:</span>
            <span className="flex items-center text-gray-900">
              <Download className="w-4 h-4 mr-1" />
              {material.downloadCount || 0}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center text-xs text-gray-500">
            <Calendar className="w-4 h-4 mr-1" />
            {new Date(material.uploadDate).toLocaleDateString()}
          </div>
          
          <div className="text-xs text-gray-500">
            By: {material.uploadedByName}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentMaterialCard;