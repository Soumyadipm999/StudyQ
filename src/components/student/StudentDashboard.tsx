import React, { useState, useEffect } from 'react';
import { BookOpen, Download, Mail, MessageCircle, Search, Filter, Calendar } from 'lucide-react';
import Layout from '../common/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { StudyMaterial, DeliveryLog } from '../../types';
import { getMaterialsForStudent, getDeliveryLogsByStudent } from '../../utils/materials';
import StudentMaterialCard from './StudentMaterialCard';
import DeliveryModal from './DeliveryModal';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('materials');
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [semesterFilter, setSemesterFilter] = useState('all');
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<StudyMaterial | null>(null);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [deliveryLogs, setDeliveryLogs] = useState<DeliveryLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = () => {
    if (user) {
      const accessibleMaterials = getMaterialsForStudent(user);
      const userDeliveryLogs = getDeliveryLogsByStudent(user.id);
      setMaterials(accessibleMaterials);
      setDeliveryLogs(userDeliveryLogs);
    }
    setLoading(false);
  };

  // Apply search and filters
  const filteredMaterials = materials.filter(material => {
    const matchesSearch = !searchTerm || 
      material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.subject.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSubject = subjectFilter === 'all' || material.subject === subjectFilter;
    const matchesSemester = semesterFilter === 'all' || material.semester.toString() === semesterFilter;
    
    return matchesSearch && matchesSubject && matchesSemester;
  });

  // Get unique subjects from accessible materials
  const subjects = Array.from(new Set(materials.map(m => m.subject)));

  // Get accessible semesters (1 to current semester)
  const accessibleSemesters = user?.current_semester 
    ? Array.from({ length: user.current_semester }, (_, i) => i + 1)
    : [];

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

  const handleRequestDelivery = (material: DatabaseMaterial) => {
    setSelectedMaterial(material);
    setShowDeliveryModal(true);
  };

  const renderMaterials = () => (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<BookOpen className="w-6 h-6 text-white" />}
          title="Available Materials"
          value={materials.length}
          color="bg-blue-500"
        />
        <StatCard
          icon={<Download className="w-6 h-6 text-white" />}
          title="Total Downloads"
          value={deliveryLogs.filter(log => log.status === 'sent').length}
          color="bg-green-500"
        />
        <StatCard
          icon={<Calendar className="w-6 h-6 text-white" />}
          title="Current Semester"
          value={user?.current_semester || 'N/A'}
          color="bg-purple-500"
        />
        <StatCard
          icon={<MessageCircle className="w-6 h-6 text-white" />}
          title="Subjects"
          value={subjects.length}
          color="bg-orange-500"
        />
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
                placeholder="Search materials..."
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
              <option value="all">All Accessible Semesters</option>
              {accessibleSemesters.map(semester => (
                <option key={semester} value={semester}>Semester {semester}</option>
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
            Showing {filteredMaterials.length} of {materials.length} materials
          </p>
          <div className="text-sm text-blue-600">
            Access Level: Semester 1-{user?.current_semester || 'N/A'}
          </div>
        </div>
      </div>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMaterials.map(material => (
          <div key={material.material_id} className="relative">
            <StudentMaterialCard
              material={material}
              onUpdate={loadData}
            />
            
            {/* Delivery Button Overlay */}
            <div className="absolute top-4 right-4">
              <button
                onClick={() => handleRequestDelivery(material)}
                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-full text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg"
                title="Request delivery via email/WhatsApp"
              >
                <Mail className="w-3 h-3 mr-1" />
                Deliver
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredMaterials.length === 0 && !loading && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No materials found matching your criteria</p>
          <p className="text-sm text-gray-400">
            You can access materials from Semester 1 to {user?.current_semester || 'N/A'}
          </p>
        </div>
      )}
    </div>
  );

  const renderDeliveryHistory = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Delivery History</h2>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Material
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Delivery Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {deliveryLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {log.materialTitle}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {log.deliveryMethod === 'email' && <Mail className="w-4 h-4 text-blue-500" />}
                      {log.deliveryMethod === 'whatsapp' && <MessageCircle className="w-4 h-4 text-green-500" />}
                      {log.deliveryMethod === 'both' && (
                        <>
                          <Mail className="w-4 h-4 text-blue-500" />
                          <MessageCircle className="w-4 h-4 text-green-500" />
                        </>
                      )}
                      <span className="text-sm text-gray-900 capitalize">{log.deliveryMethod}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      log.status === 'sent' ? 'bg-green-100 text-green-800' :
                      log.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(log.timestamp).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {deliveryLogs.length === 0 && (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-500">No delivery history found</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'history':
        return renderDeliveryHistory();
      default:
        return renderMaterials();
    }
  };

  return (
    <Layout title="Student Dashboard">
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex flex-wrap gap-2">
            <TabButton id="materials" label="Study Materials" icon={<BookOpen className="w-4 h-4" />} />
            <TabButton id="history" label="Delivery History" icon={<Download className="w-4 h-4" />} />
          </div>
        </div>

        {/* Tab Content */}
        {renderContent()}
      </div>

      {/* Delivery Modal */}
      {showDeliveryModal && selectedMaterial && (
        <DeliveryModal
          isOpen={showDeliveryModal}
          material={selectedMaterial}
          onClose={() => {
            setShowDeliveryModal(false);
            setSelectedMaterial(null);
          }}
          onSuccess={() => {
            setShowDeliveryModal(false);
            setSelectedMaterial(null);
            // Refresh delivery logs
          }}
        />
      )}
    </Layout>
  );
};

export default StudentDashboard;