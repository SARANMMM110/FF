import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { 
  Plus, 
  Copy, 
  Trash2, 
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Shield,
  Crown,
  Sparkles,
  ArrowLeft
} from "lucide-react";
import { useToast } from "@/react-app/hooks/useToast";
import { ToastContainer } from "@/react-app/components/Toast";

interface RegistrationCode {
  id: number;
  code: string;
  plan_id: string;
  max_uses: number | null;
  current_uses: number;
  expires_at: string | null;
  is_active: number;
  created_by: string;
  notes: string | null;
  created_at: string;
}

export default function AdminRegistrationCodes() {
  const navigate = useNavigate();
  const [codes, setCodes] = useState<RegistrationCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { success: showSuccess, error: showError, toasts, removeToast } = useToast();

  const getAuthHeaders = () => {
    const token = localStorage.getItem("admin_token") || sessionStorage.getItem("admin_token");
    return {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    };
  };

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = async () => {
    const token = localStorage.getItem("admin_token") || sessionStorage.getItem("admin_token");
    if (!token) {
      navigate("/admin/login");
      return;
    }

    try {
      const response = await fetch("/api/admin/me", {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        loadCodes();
      } else {
        localStorage.removeItem("admin_token");
        sessionStorage.removeItem("admin_token");
        navigate("/admin/login");
      }
    } catch (error) {
      showError("Failed to verify admin session");
      navigate("/admin/login");
    }
  };

  const loadCodes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/registration-codes", {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setCodes(data.codes);
      }
    } catch (error) {
      showError("Failed to load registration codes");
    } finally {
      setIsLoading(false);
    }
  };

  const createCode = async (formData: any) => {
    try {
      const response = await fetch("/api/admin/registration-codes", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        showSuccess("Registration code created successfully");
        setShowCreateModal(false);
        loadCodes();
        
        // Copy URL to clipboard
        navigator.clipboard.writeText(data.registration_url);
        showSuccess("Registration URL copied to clipboard!");
      } else {
        const error = await response.json();
        showError(error.error || "Failed to create registration code");
      }
    } catch (error) {
      showError("Failed to create registration code");
    }
  };

  const deactivateCode = async (code: string) => {
    if (!confirm("Are you sure you want to deactivate this registration code?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/registration-codes/${code}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });

      if (response.ok) {
        showSuccess("Registration code deactivated");
        loadCodes();
      } else {
        showError("Failed to deactivate code");
      }
    } catch (error) {
      showError("Failed to deactivate code");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showSuccess("Copied to clipboard!");
  };

  const getRegistrationUrl = (code: string) => {
    return `${window.location.origin}/?code=${code}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading registration codes...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="bg-black/30 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/admin")}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <Shield className="w-8 h-8 text-white" />
              <div>
                <h1 className="text-2xl font-bold text-white">Registration Codes</h1>
                <p className="text-gray-300">Manage special access registration links</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-[#E50914] to-[#FFD400] text-black px-4 py-2 rounded-lg hover:shadow-lg transition-all font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Create Code</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/30">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                    Uses
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                    Expires
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {codes.map((code) => (
                  <tr key={code.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <code className="text-sm text-white font-mono bg-black/30 px-2 py-1 rounded">
                          {code.code}
                        </code>
                        <button
                          onClick={() => copyToClipboard(getRegistrationUrl(code.code))}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                          title="Copy registration URL"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                      {code.notes && (
                        <div className="text-xs text-gray-400 mt-1">{code.notes}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {code.plan_id === 'enterprise' ? (
                          <>
                            <Crown className="w-4 h-4 text-purple-400" />
                            <span className="text-purple-300 font-semibold">Enterprise</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 text-yellow-400" />
                            <span className="text-yellow-300 font-semibold">Pro</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {code.current_uses} / {code.max_uses || '∞'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                      {code.expires_at ? (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {new Date(code.expires_at).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-gray-400">Never</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {code.is_active ? (
                        <div className="flex items-center gap-2 text-green-400">
                          <CheckCircle className="w-4 h-4" />
                          Active
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-red-400">
                          <XCircle className="w-4 h-4" />
                          Inactive
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      {code.is_active && (
                        <button
                          onClick={() => deactivateCode(code.code)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Code Modal */}
      {showCreateModal && (
        <CreateCodeModal
          onClose={() => setShowCreateModal(false)}
          onCreate={createCode}
        />
      )}
    </div>
  );
}

function CreateCodeModal({ onClose, onCreate }: { 
  onClose: () => void; 
  onCreate: (data: any) => void;
}) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    onCreate({
      plan_id: formData.get("plan_id"),
      max_uses: formData.get("max_uses") ? parseInt(formData.get("max_uses") as string) : null,
      expires_at: formData.get("expires_at") || null,
      notes: formData.get("notes") || null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 border border-white/20 rounded-xl p-6 max-w-md w-full">
        <h3 className="text-xl font-bold text-white mb-6">Create Registration Code</h3>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2">Plan Type *</label>
              <select
                name="plan_id"
                required
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="pro" className="bg-gray-800">Pro Plan</option>
                <option value="enterprise" className="bg-gray-800">Enterprise Plan</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-300 mb-2">Max Uses</label>
              <input
                type="number"
                name="max_uses"
                min="1"
                placeholder="Unlimited"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <p className="text-xs text-gray-400 mt-1">Leave empty for unlimited uses</p>
            </div>

            <div>
              <label className="block text-gray-300 mb-2">Expiration Date</label>
              <input
                type="datetime-local"
                name="expires_at"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <p className="text-xs text-gray-400 mt-1">Leave empty for no expiration</p>
            </div>

            <div>
              <label className="block text-gray-300 mb-2">Notes</label>
              <textarea
                name="notes"
                rows={2}
                placeholder="e.g., For Q1 2025 campaign"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-[#E50914] to-[#FFD400] text-black font-semibold rounded-lg hover:shadow-lg transition-all"
            >
              Create Code
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
