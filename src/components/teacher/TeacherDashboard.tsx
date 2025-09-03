import React, { useState, useEffect } from 'react';
import { Upload, BookOpen, Users, TrendingUp, Plus, Search, Filter } from 'lucide-react';
import Layout from '../common/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { StudyMaterial } from '../../types';
import { getMaterialsByTeacher } from '../../utils/materials';
import MaterialUploadModal from './MaterialUploadModal';
import TeacherMaterialCard from './TeacherMaterialCard';

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [semesterFilter, setSemesterFilter] = useState('all');
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMaterials();
  }, [user]);

  const loadMaterials = () => {
    if (user) {
      const teacherMaterials = getMaterialsByTeacher(user.id);
      setMaterials(teacherMaterials);
    }
    setLoading(false);
  };

  // Apply search and filters
  const filteredMaterials = materials.filter(material => {
    const matchesSearch = !searchTerm || 
      material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSubject = subjectFilter === 'all' || material.subject === subjectFilter;
    const matchesSemester = semesterFilter === 'all' || material.semester.toString() === semesterFilter;
    
    return matchesSearch && matchesSubject && matchesSemester;
  });

  // Get unique subjects from teacher's materials
  const subjects = Array.from(new Set(materials.map(m => m.subject)));

  const StatCard: React.FC<{ 
    icon: React.ReactNode; 
    title: string; 
    value: string | number; 
    subtitle?: string;
    color: string;
  }> = ({ icon, title, value, subtitle, color }) => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  const TabButton: React.FC<{ id: string; label: string; icon: React.ReactNode }> = ({ id, label, icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        activeTab === id
          ? 'bg-blue-100 text-blue-700 border border-blue-200'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<BookOpen className="w-6 h-6 text-white" />}
          title="My Materials"
          value={materials.length}
          color="bg-blue-500"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6 text-white" />}
          title="Total Downloads"
          value={materials.reduce((sum, m) => sum + (m.downloadCount || 0), 0)}
          color="bg-green-500"
        />
        <StatCard
          icon={<Users className="w-6 h-6 text-white" />}
          title="Subjects Taught"
          value={subjects.length}
          color="bg-purple-500"
        />
        <StatCard
          icon={<Upload className="w-6 h-6 text-white" />}
          title="This Month"
          value={materials.filter(m => {
            const uploadDate = new Date(m.uploadDate);
            const now = new Date();
            return uploadDate.getMonth() === now.getMonth() && 
                   uploadDate.getFullYear() === now.getFullYear();
          }).length}
          subtitle="uploads"
          color="bg-orange-500"
        />
      </div>

      {/* Recent Materials */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Materials</h3>
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Upload Material
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {materials.slice(0, 6).map(material => (
            <TeacherMaterialCard
              key={material.id}
              material={material}
              onUpdate={loadMaterials}
            />
          ))}
        </div>

        {materials.length === 0 && (
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No materials uploaded yet</p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Upload Your First Material
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderMaterials = () => (
    <div className="space-y-6">
      {/* Header with Upload Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">My Materials</h2>
        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Upload Material
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Materials
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Search by title or description"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">All Subjects</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Semester
            </label>
            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">All Semesters</option>
              {[...Array(8)].map((_, i) => (
                <option key={i + 1} value={i + 1}>Semester {i + 1}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setSubjectFilter('all');
                setSemesterFilter('all');
              }}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        <div className="mt-4 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Showing {filteredMaterials.length} of {teacherMaterials.length} materials
          </p>
        </div>
      </div>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMaterials.map(material => (
          <TeacherMaterialCard
            key={material.id}
            material={material}
            onUpdate={loadMaterials}
          />
        ))}
      </div>

      {filteredMaterials.length === 0 && !loading && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No materials found matching your criteria</p>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'materials':
        return renderMaterials();
      default:
        return renderOverview();
    }
  };

  return (
    <Layout title="Teacher Dashboard">
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex flex-wrap gap-2">
            <TabButton id="overview" label="Overview" icon={<TrendingUp className="w-4 h-4" />} />
            <TabButton id="materials" label="My Materials" icon={<BookOpen className="w-4 h-4" />} />
          </div>
        </div>

        {/* Tab Content */}
        {renderContent()}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <MaterialUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            loadMaterials();
            setShowUploadModal(false);
          }}
        />
      )}
    </Layout>
  );
};

export default TeacherDashboard;