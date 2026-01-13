import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Plus, Lightbulb } from "lucide-react";
import { useSmartTaskInput } from "@/react-app/hooks/useSmartTaskInput";

interface QuickAddTaskProps {
  onClose: () => void;
  onCreate: (task: {
    title: string;
    description?: string;
    priority?: number;
    estimated_minutes?: number;
    project?: string;
    due_date?: string;
    tags?: string[];
  }) => Promise<void>;
}

export default function QuickAddTask({ onClose, onCreate }: QuickAddTaskProps) {
  const { rawInput, parsedData, handleInputChange } = useSmartTaskInput();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Prevent body scroll and scroll to top when modal opens
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsedData?.title.trim()) return;

    setIsSubmitting(true);
    try {
      await onCreate({
        title: parsedData.title,
        priority: parsedData.priority,
        estimated_minutes: parsedData.estimated_minutes,
        project: parsedData.project,
        due_date: parsedData.due_date,
        tags: parsedData.tags,
      });
      onClose();
    } catch (error) {
      console.error("Failed to create task:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black z-[9999] overflow-y-auto"
      onClick={onClose}
    >
      <div className="min-h-screen w-full">
        <div 
          className="h-full w-full max-w-4xl mx-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-8 border-b border-white/10">
            <div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-[#E50914] to-[#FFD400] bg-clip-text text-transparent mb-2">
                Quick Add Task
              </h2>
              <p className="text-lg text-white/60">
                Use shortcuts: #project p:high @today [30m] tags
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-white/10 rounded-xl transition-all duration-200 hover:scale-105"
            >
              <X className="w-8 h-8 text-white" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-8 max-w-3xl mx-auto">
            {/* Input */}
            <div>
              <label className="block text-lg font-semibold text-white/90 mb-3">
                Task Description *
              </label>
              <input
                type="text"
                value={rawInput}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Write a new task with #project p:high @today [30m] tags..."
                autoFocus
                className="w-full bg-white/5 border border-white/20 rounded-xl px-6 py-4 text-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#E50914]/50 focus:border-[#E50914] transition-all duration-200 backdrop-blur-sm"
              />
            </div>

            {/* Preview */}
            {parsedData && parsedData.title && (
              <div className="p-6 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-white/90 mb-4">Preview:</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-base font-medium text-white/60 min-w-[120px]">Title:</span>
                    <span className="text-lg text-white">{parsedData.title || "Untitled task"}</span>
                  </div>
                  {parsedData.priority !== undefined && (
                    <div className="flex items-start gap-3">
                      <span className="text-base font-medium text-white/60 min-w-[120px]">Priority:</span>
                      <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        parsedData.priority === 2 ? "bg-red-500/20 text-red-300 border border-red-500/30" :
                        parsedData.priority === 1 ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30" :
                        "bg-gray-500/20 text-gray-300 border border-gray-500/30"
                      }`}>
                        {parsedData.priority === 2 ? "High" : parsedData.priority === 1 ? "Medium" : "Low"}
                      </span>
                    </div>
                  )}
                  {parsedData.estimated_minutes && (
                    <div className="flex items-start gap-3">
                      <span className="text-base font-medium text-white/60 min-w-[120px]">Estimated:</span>
                      <span className="text-lg text-white">{parsedData.estimated_minutes} minutes</span>
                    </div>
                  )}
                  {parsedData.project && (
                    <div className="flex items-start gap-3">
                      <span className="text-base font-medium text-white/60 min-w-[120px]">Project:</span>
                      <span className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg text-sm">
                        {parsedData.project}
                      </span>
                    </div>
                  )}
                  {parsedData.due_date && (
                    <div className="flex items-start gap-3">
                      <span className="text-base font-medium text-white/60 min-w-[120px]">Due:</span>
                      <span className="text-lg text-white">
                        {new Date(parsedData.due_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {parsedData.tags && parsedData.tags.length > 0 && (
                    <div className="flex items-start gap-3">
                      <span className="text-base font-medium text-white/60 min-w-[120px]">Tags:</span>
                      <div className="flex flex-wrap gap-2">
                        {parsedData.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-3 py-1 bg-orange-500/20 text-orange-300 border border-orange-500/30 rounded-lg text-sm"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Help */}
            <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-xl backdrop-blur-sm">
              <h4 className="text-lg font-semibold text-blue-300 mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Quick Syntax Guide
              </h4>
              <div className="grid md:grid-cols-2 gap-3 text-base text-blue-200/90">
                <div className="flex items-center gap-2">
                  <code className="px-2 py-1 bg-white/10 rounded text-sm">#project</code>
                  <span className="text-white/60">→</span>
                  <span>Set project</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="px-2 py-1 bg-white/10 rounded text-sm">p:high</code>
                  <span className="text-white/60">→</span>
                  <span>Priority (low/medium/high)</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="px-2 py-1 bg-white/10 rounded text-sm">@today</code>
                  <span className="text-white/60">→</span>
                  <span>Due today</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="px-2 py-1 bg-white/10 rounded text-sm">@tomorrow</code>
                  <span className="text-white/60">→</span>
                  <span>Due tomorrow</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="px-2 py-1 bg-white/10 rounded text-sm">[30m]</code>
                  <span className="text-white/60">→</span>
                  <span>Estimated time</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="px-2 py-1 bg-white/10 rounded text-sm">tag1 tag2</code>
                  <span className="text-white/60">→</span>
                  <span>Add tags (at end)</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-8 border-t border-white/10 mt-8">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-4 px-8 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-semibold text-lg transition-all duration-200 hover:scale-[1.02] text-white backdrop-blur-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!parsedData?.title.trim() || isSubmitting}
                className="flex-1 py-4 px-8 bg-gradient-to-r from-[#E50914] to-[#FFD400] rounded-xl font-semibold text-lg text-black hover:shadow-2xl hover:shadow-[#E50914]/40 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  "Creating..."
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Create Task
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
