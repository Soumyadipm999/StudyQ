import { StudyMaterial, DeliveryLog, User } from '../types';

import { notificationService } from '../services/notificationService';
import { getStoredUsers } from './auth';

const MATERIALS_STORAGE_KEY = 'study_platform_materials';
const DELIVERY_LOGS_STORAGE_KEY = 'study_platform_delivery_logs';

export const getStoredMaterials = (): StudyMaterial[] => {
  const stored = localStorage.getItem(MATERIALS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveMaterial = (material: StudyMaterial): void => {
  const materials = getStoredMaterials();
  const existingIndex = materials.findIndex(m => m.id === material.id);
  
  if (existingIndex >= 0) {
    materials[existingIndex] = material;
  } else {
    materials.push(material);
  }
  
  localStorage.setItem(MATERIALS_STORAGE_KEY, JSON.stringify(materials));
};

export const deleteMaterial = (materialId: string): boolean => {
  const materials = getStoredMaterials();
  const filteredMaterials = materials.filter(m => m.id !== materialId);
  
  if (filteredMaterials.length !== materials.length) {
    localStorage.setItem(MATERIALS_STORAGE_KEY, JSON.stringify(filteredMaterials));
    return true;
  }
  
  return false;
};

export const getMaterialsForStudent = (user: User): StudyMaterial[] => {
  if (user.role !== 'student' || !user.currentSemester) {
    return [];
  }
  
  const materials = getStoredMaterials();
  return materials.filter(material => 
    material.isActive && 
    material.semester <= user.currentSemester! &&
    material.academicYear === user.academicYear
  );
};

export const getMaterialsByTeacher = (teacherId: string): StudyMaterial[] => {
  const materials = getStoredMaterials();
  return materials.filter(material => material.uploadedBy === teacherId);
};

export const searchMaterials = (query: string, semester?: number, subject?: string): StudyMaterial[] => {
  const materials = getStoredMaterials();
  return materials.filter(material => {
    const matchesQuery = !query || 
      material.title.toLowerCase().includes(query.toLowerCase()) ||
      material.description.toLowerCase().includes(query.toLowerCase()) ||
      material.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()));
    
    const matchesSemester = !semester || material.semester === semester;
    const matchesSubject = !subject || material.subject === subject;
    
    return material.isActive && matchesQuery && matchesSemester && matchesSubject;
  });
};

export const incrementDownloadCount = (materialId: string): void => {
  const materials = getStoredMaterials();
  const material = materials.find(m => m.id === materialId);
  
  if (material) {
    material.downloadCount = (material.downloadCount || 0) + 1;
    saveMaterial(material);
  }
};

export const deliverMaterial = (
  materialId: string,
  studentId: string,
  deliveryMethod: 'email' | 'whatsapp' | 'both'
): Promise<{ success: boolean; message: string }> => {
  return new Promise(async (resolve) => {
    try {
      const materials = getStoredMaterials();
      const material = materials.find(m => m.id === materialId);
      const users = getStoredUsers();
      const student = users.find(u => u.id === studentId);
      
      if (!material || !student) {
        resolve({ success: false, message: 'Material or student not found' });
        return;
      }

      // Generate download URL (in production, this would be a secure download link)
      const downloadUrl = `${window.location.origin}/download/${materialId}`;

      // Send notification via selected method(s)
      const deliveryResults = await notificationService.sendMaterialDelivery(
        student,
        material.title,
        downloadUrl,
        deliveryMethod
      );

      // Check if delivery was successful
      let overallSuccess = false;
      let resultMessage = '';

      if (deliveryMethod === 'email' && deliveryResults.email) {
        overallSuccess = deliveryResults.email.success;
        resultMessage = deliveryResults.email.message;
      } else if (deliveryMethod === 'whatsapp' && deliveryResults.whatsapp) {
        overallSuccess = deliveryResults.whatsapp.success;
        resultMessage = deliveryResults.whatsapp.message;
      } else if (deliveryMethod === 'both') {
        const emailSuccess = deliveryResults.email?.success || false;
        const whatsappSuccess = deliveryResults.whatsapp?.success || false;
        overallSuccess = emailSuccess || whatsappSuccess;
        
        if (emailSuccess && whatsappSuccess) {
          resultMessage = 'Material delivered successfully via both email and WhatsApp';
        } else if (emailSuccess) {
          resultMessage = 'Material delivered via email (WhatsApp failed)';
        } else if (whatsappSuccess) {
          resultMessage = 'Material delivered via WhatsApp (Email failed)';
        } else {
          resultMessage = 'Failed to deliver material via both methods';
        }
      }

      // Create delivery log
      const deliveryLog: DeliveryLog = {
        id: Date.now().toString(),
        materialId,
        materialTitle: material.title,
        studentId,
        studentName: `${student.firstName} ${student.lastName}`,
        deliveryMethod,
        status: overallSuccess ? 'sent' : 'failed',
        timestamp: new Date().toISOString(),
        email: student.email,
        whatsappNumber: student.whatsappNumber
      };

      const logs = getDeliveryLogs();
      logs.unshift(deliveryLog);
      localStorage.setItem(DELIVERY_LOGS_STORAGE_KEY, JSON.stringify(logs));

      resolve({ 
        success: overallSuccess,
        message: resultMessage
      });
    } catch (error) {
      console.error('Delivery error:', error);
      resolve({
        success: false,
        message: 'Failed to deliver material due to system error'
      });
    }
  });
};

export const getDeliveryLogs = (): DeliveryLog[] => {
  const stored = localStorage.getItem(DELIVERY_LOGS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const getDeliveryLogsByStudent = (studentId: string): DeliveryLog[] => {
  return getDeliveryLogs().filter(log => log.studentId === studentId);
};

export const getSubjects = (): string[] => {
  const materials = getStoredMaterials();
  const subjects = Array.from(new Set(materials.map(m => m.subject)));
  return subjects.sort();
};

export const generateMaterialId = (): string => {
  return 'MAT-' + Date.now().toString() + '-' + Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Initialize some sample materials for demo
export const initializeSampleMaterials = (): void => {
  const materials = getStoredMaterials();
  if (materials.length === 0) {
    const sampleMaterials: StudyMaterial[] = [
      {
        id: 'MAT-001',
        title: 'Introduction to Computer Science',
        description: 'Comprehensive guide covering fundamental concepts of computer science',
        fileName: 'intro-cs.pdf',
        fileSize: 2048576,
        fileType: 'application/pdf',
        uploadedBy: 'teacher-001',
        uploadedByName: 'John Smith',
        uploadDate: new Date().toISOString(),
        semester: 1,
        academicYear: 2024,
        subject: 'Computer Science',
        tags: ['fundamentals', 'introduction', 'basics'],
        isActive: true,
        downloadCount: 45
      },
      {
        id: 'MAT-002',
        title: 'Data Structures and Algorithms',
        description: 'Advanced concepts in data structures and algorithm design',
        fileName: 'dsa.pdf',
        fileSize: 3145728,
        fileType: 'application/pdf',
        uploadedBy: 'teacher-001',
        uploadedByName: 'John Smith',
        uploadDate: new Date().toISOString(),
        semester: 3,
        academicYear: 2024,
        subject: 'Computer Science',
        tags: ['algorithms', 'data-structures', 'programming'],
        isActive: true,
        downloadCount: 32
      },
      {
        id: 'MAT-003',
        title: 'Database Management Systems',
        description: 'Complete guide to database design and management',
        fileName: 'dbms.pdf',
        fileSize: 4194304,
        fileType: 'application/pdf',
        uploadedBy: 'teacher-001',
        uploadedByName: 'John Smith',
        uploadDate: new Date().toISOString(),
        semester: 4,
        academicYear: 2024,
        subject: 'Computer Science',
        tags: ['database', 'sql', 'design'],
        isActive: true,
        downloadCount: 28
      }
    ];

    localStorage.setItem(MATERIALS_STORAGE_KEY, JSON.stringify(sampleMaterials));
  }
};