import React, { useState } from 'react';
import { X, Mail, MessageCircle, Loader2, CheckCircle } from 'lucide-react';
import { StudyMaterial } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { deliverMaterial } from '../../utils/materials';

interface DeliveryModalProps {
  isOpen: boolean;
  material: StudyMaterial;
  onClose: () => void;
  onSuccess: () => void;
}

const DeliveryModal: React.FC<DeliveryModalProps> = ({ isOpen, material, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [deliveryMethod, setDeliveryMethod] = useState<'email' | 'whatsapp' | 'both'>('email');
  const [customEmail, setCustomEmail] = useState(user?.email || '');
  const [customWhatsApp, setCustomWhatsApp] = useState(user?.whatsappNumber || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!user?.id) {
      return;
    }

    // Validate email if email delivery is selected
    if ((deliveryMethod === 'email' || deliveryMethod === 'both') && !customEmail.trim()) {
      alert('Please provide an email address');
      return;
    }

    // Validate WhatsApp if WhatsApp delivery is selected
    if ((deliveryMethod === 'whatsapp' || deliveryMethod === 'both') && !customWhatsApp.trim()) {
      alert('Please provide a WhatsApp number');
      return;
    }

    setIsLoading(true);

    try {
      const result = await deliverMaterial(material.id, user.id, deliveryMethod);
      
      if (result.success) {
        // Show success message with more details
        alert(`✅ ${result.message}\n\n📧 Check the browser console to see the detailed delivery confirmation.\n\n🔔 You should also see a browser notification if permissions are enabled.`);
        onSuccess();
        onClose();
      } else {
        setError(`❌ Delivery failed: ${result.message}`);
      }
    } catch (error) {
      setError('Failed to request delivery. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
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

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Request Material Delivery</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Material Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-2">{material.title}</h4>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">Subject:</span> {material.subject}
              </div>
              <div>
                <span className="font-medium">Semester:</span> {material.semester}
              </div>
              <div>
                <span className="font-medium">File Size:</span> {formatFileSize(material.fileSize)}
              </div>
              <div>
                <span className="font-medium">Year:</span> {material.academicYear}
              </div>
            </div>
            {material.description && (
              <p className="text-sm text-gray-600 mt-2">{material.description}</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Delivery Method Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Choose Delivery Method
              </label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="email"
                    checked={deliveryMethod === 'email'}
                    onChange={(e) => setDeliveryMethod(e.target.value as 'email')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div className="ml-3 flex items-center">
                    <Mail className="w-4 h-4 text-blue-500 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Email Only</span>
                  </div>
                </label>

                <label className="flex items-center">
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="whatsapp"
                    checked={deliveryMethod === 'whatsapp'}
                    onChange={(e) => setDeliveryMethod(e.target.value as 'whatsapp')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div className="ml-3 flex items-center">
                    <MessageCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-sm font-medium text-gray-700">WhatsApp Only</span>
                  </div>
                </label>

                <label className="flex items-center">
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="both"
                    checked={deliveryMethod === 'both'}
                    onChange={(e) => setDeliveryMethod(e.target.value as 'both')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div className="ml-3 flex items-center">
                    <Mail className="w-4 h-4 text-blue-500 mr-1" />
                    <MessageCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Both Email & WhatsApp</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Email Input */}
            {(deliveryMethod === 'email' || deliveryMethod === 'both') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="email"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your email address"
                    required={deliveryMethod === 'email' || deliveryMethod === 'both'}
                  />
                </div>
              </div>
            )}

            {/* WhatsApp Input */}
            {(deliveryMethod === 'whatsapp' || deliveryMethod === 'both') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp Number
                </label>
                <div className="relative">
                  <MessageCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="tel"
                    value={customWhatsApp}
                    onChange={(e) => setCustomWhatsApp(e.target.value)}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+1234567890"
                    required={deliveryMethod === 'whatsapp' || deliveryMethod === 'both'}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Include country code (e.g., +1 for US)</p>
              </div>
            )}

            {/* Delivery Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <CheckCircle className="h-5 w-5 text-blue-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Delivery Information
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Materials will be delivered instantly to your selected method(s)</li>
                      <li>You'll receive a download link valid for 24 hours</li>
                      <li>Check your spam folder if using email delivery</li>
                      <li>WhatsApp delivery requires an active WhatsApp account</li>
                    </ul>
                  </div>
                </div>
              </div>
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
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin inline" />
                    Sending...
                  </>
                ) : (
                  <>
                    {deliveryMethod === 'email' && <Mail className="w-4 h-4 mr-1 inline" />}
                    {deliveryMethod === 'whatsapp' && <MessageCircle className="w-4 h-4 mr-1 inline" />}
                    {deliveryMethod === 'both' && (
                      <>
                        <Mail className="w-4 h-4 mr-1 inline" />
                        <MessageCircle className="w-4 h-4 mr-1 inline" />
                      </>
                    )}
                    Request Delivery
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

export default DeliveryModal;