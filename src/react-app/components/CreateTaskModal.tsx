import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Plus, Clock, Flag, Calendar, FolderOpen, Tag, Repeat } from "lucide-react";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (task: {
    title: string;
    description?: string;
    priority?: number;
    estimated_minutes?: number;
    project?: string;
    due_date?: string;
    tags?: string[];
    repeat?: string;
    repeat_detail?: string;
  }) => Promise<void>;
  initialDueDate?: string;
}

export default function CreateTaskModal({ isOpen, onClose, onCreate, initialDueDate }: CreateTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(0);
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | undefined>();
  const [project, setProject] = useState("");
  const [dueDate, setDueDate] = useState(initialDueDate || "");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [repeat, setRepeat] = useState<"none" | "daily" | "weekly" | "monthly">("none");
  const [repeatDetail, setRepeatDetail] = useState<string[]>([]);

  // Update due date when initialDueDate changes
  useEffect(() => {
    if (initialDueDate) {
      setDueDate(initialDueDate);
    }
  }, [initialDueDate]);

  // Prevent body scroll and scroll to top when modal opens
  useEffect(() => {
    console.log("CreateTaskModal useEffect - isOpen:", isOpen);
    if (isOpen) {
      // Scroll to top of page
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  // Reset repeat detail when repeat type changes
  useEffect(() => {
    if (repeat === "none" || repeat === "daily") {
      setRepeatDetail([]);
    } else if (repeat === "weekly" && repeatDetail.length === 0) {
      // Default to today's day of week
      const today = new Date().getDay();
      const dayMap = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
      setRepeatDetail([dayMap[today]]);
    }
  }, [repeat]);

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const toggleWeekday = (day: string) => {
    if (repeatDetail.includes(day)) {
      setRepeatDetail(repeatDetail.filter(d => d !== day));
    } else {
      setRepeatDetail([...repeatDetail, day]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Validation for recurring tasks
    if (repeat !== "none" && !dueDate) {
      alert("Please set a due date for recurring tasks");
      return;
    }

    if (repeat === "weekly" && repeatDetail.length === 0) {
      alert("Please select at least one day for weekly recurring tasks");
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreate({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        estimated_minutes: estimatedMinutes,
        project: project.trim() || undefined,
        due_date: dueDate || undefined,
        tags: tags.length > 0 ? tags : undefined,
        repeat: repeat !== "none" ? repeat : undefined,
        repeat_detail: repeatDetail.length > 0 ? JSON.stringify(repeatDetail) : undefined,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  console.log("CreateTaskModal render - isOpen:", isOpen);
  if (!isOpen) {
    console.log("CreateTaskModal returning null because isOpen is false");
    return null;
  }

  const weekdays = [
    { value: "mon", label: "Mon" },
    { value: "tue", label: "Tue" },
    { value: "wed", label: "Wed" },
    { value: "thu", label: "Thu" },
    { value: "fri", label: "Fri" },
    { value: "sat", label: "Sat" },
    { value: "sun", label: "Sun" },
  ];

  const modalContent = (
    <div 
      className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black z-[9999] overflow-y-auto"
      onClick={onClose}
    >
      <div className="min-h-screen w-full py-8">
        <div 
          className="h-full w-full max-w-4xl mx-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-8 border-b border-white/10">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-[#E50914] to-[#FFD400] bg-clip-text text-transparent">
              Create New Task
            </h2>
            <button
              onClick={onClose}
              className="p-3 hover:bg-white/10 rounded-xl transition-all duration-200 hover:scale-105"
            >
              <X className="w-8 h-8 text-white" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-8 max-w-3xl mx-auto">
            {/* Title */}
            <div>
              <label className="block text-lg font-bold text-white mb-3">
                Task Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                required
                autoFocus
                className="w-full bg-white/10 border border-white/30 rounded-xl px-6 py-4 text-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:border-[#E50914] focus:bg-white/15 transition-all duration-200 backdrop-blur-sm shadow-lg"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-lg font-bold text-white mb-3">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add more details..."
                rows={4}
                className="w-full bg-white/10 border border-white/30 rounded-xl px-6 py-4 text-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:border-[#E50914] focus:bg-white/15 resize-none transition-all duration-200 backdrop-blur-sm shadow-lg"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Priority */}
              <div>
                <label className="block text-base font-bold text-white mb-3">
                  <Flag className="w-5 h-5 inline mr-2" />
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(parseInt(e.target.value))}
                  className="w-full bg-white/10 border border-white/30 rounded-xl px-6 py-4 text-lg text-white focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:border-[#E50914] focus:bg-white/15 transition-all duration-200 backdrop-blur-sm shadow-lg [&>option]:bg-gray-800 [&>option]:text-white"
                >
                  <option value={0} className="bg-gray-800 text-white">Low Priority</option>
                  <option value={1} className="bg-gray-800 text-white">Medium Priority</option>
                  <option value={2} className="bg-gray-800 text-white">High Priority</option>
                </select>
              </div>

              {/* Estimated Time */}
              <div>
                <label className="block text-base font-bold text-white mb-3">
                  <Clock className="w-5 h-5 inline mr-2" />
                  Estimated Time (minutes)
                </label>
                <input
                  type="number"
                  value={estimatedMinutes || ""}
                  onChange={(e) => setEstimatedMinutes(e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="25"
                  min="1"
                  className="w-full bg-white/10 border border-white/30 rounded-xl px-6 py-4 text-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:border-[#E50914] focus:bg-white/15 transition-all duration-200 backdrop-blur-sm shadow-lg"
                />
              </div>

              {/* Project */}
              <div>
                <label className="block text-base font-bold text-white mb-3">
                  <FolderOpen className="w-5 h-5 inline mr-2" />
                  Project
                </label>
                <input
                  type="text"
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  placeholder="Project name"
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-6 py-4 text-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#E50914]/50 focus:border-[#E50914] transition-all duration-200 backdrop-blur-sm"
                />
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-base font-bold text-white mb-3">
                  <Calendar className="w-5 h-5 inline mr-2" />
                  Due Date {repeat !== "none" && <span className="text-[#E50914]">*</span>}
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-white/10 border border-white/30 rounded-xl px-6 py-4 text-lg text-white focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:border-[#E50914] focus:bg-white/15 transition-all duration-200 backdrop-blur-sm shadow-lg"
                />
              </div>
            </div>

            {/* Recurring Options */}
            <div className="space-y-4">
              <label className="block text-base font-bold text-white mb-3">
                <Repeat className="w-5 h-5 inline mr-2" />
                Repeat
              </label>
              <select
                value={repeat}
                onChange={(e) => setRepeat(e.target.value as any)}
                className="w-full bg-white/10 border border-white/30 rounded-xl px-6 py-4 text-lg text-white focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:border-[#E50914] focus:bg-white/15 transition-all duration-200 backdrop-blur-sm shadow-lg [&>option]:bg-gray-800 [&>option]:text-white"
              >
                <option value="none" className="bg-gray-800 text-white">Does not repeat</option>
                <option value="daily" className="bg-gray-800 text-white">Daily</option>
                <option value="weekly" className="bg-gray-800 text-white">Weekly</option>
                <option value="monthly" className="bg-gray-800 text-white">Monthly</option>
              </select>

              {/* Weekly Day Selection */}
              {repeat === "weekly" && (
                <div className="space-y-3">
                  <p className="text-sm text-white/70">Select days:</p>
                  <div className="flex flex-wrap gap-2">
                    {weekdays.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleWeekday(day.value)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                          repeatDetail.includes(day.value)
                            ? "bg-gradient-to-r from-[#E50914] to-[#FFD400] text-black"
                            : "bg-white/10 text-white hover:bg-white/20"
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {repeat !== "none" && (
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-blue-300">
                    {repeat === "daily" && "This task will repeat every day"}
                    {repeat === "weekly" && repeatDetail.length > 0 && `This task will repeat every ${repeatDetail.join(", ")}`}
                    {repeat === "weekly" && repeatDetail.length === 0 && "Select at least one day"}
                    {repeat === "monthly" && "This task will repeat on the same day each month"}
                  </p>
                </div>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-base font-bold text-white mb-3">
                <Tag className="w-5 h-5 inline mr-2" />
                Tags
              </label>
              <div className="flex gap-3 mb-3">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Add a tag..."
                  className="flex-1 bg-white/10 border border-white/30 rounded-xl px-6 py-3 text-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:border-[#E50914] focus:bg-white/15 transition-all duration-200 backdrop-blur-sm shadow-lg"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all duration-200 hover:scale-105"
                >
                  <Plus className="w-5 h-5 text-white" />
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/20 border border-orange-500/30 text-orange-300 rounded-lg text-base backdrop-blur-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-orange-100 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
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
                disabled={!title.trim() || isSubmitting}
                className="flex-1 py-4 px-8 bg-gradient-to-r from-[#E50914] to-[#FFD400] rounded-xl font-semibold text-lg text-black hover:shadow-2xl hover:shadow-[#E50914]/40 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
              >
                {isSubmitting ? "Creating..." : "Create Task"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
