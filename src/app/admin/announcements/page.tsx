"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  TrendingUp,
  Users,
  BarChart3,
  Megaphone,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Menu,
  X,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabaseClient";
import AnnouncementModal from "@/components/admin/AnnouncementModal";
import {
  type Announcement,
  type CreateAnnouncementInput,
  type UpdateAnnouncementInput,
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  toggleAnnouncementStatus,
} from "@/app/actions/announcements";

export default function AdminAnnouncementsPage() {
  const router = useRouter();

  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Announcements state
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  // Delete confirmation state
  const [deletingAnnouncement, setDeletingAnnouncement] = useState<Announcement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast / Feedback state
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Show notification with auto-dismiss
  const showToast = useCallback((type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  }, []);

  // Fetch announcements
  const fetchAllAnnouncements = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getAnnouncements();
      if (res.success && res.data) {
        setAnnouncements(res.data);
      } else {
        showToast("error", res.error || "Failed to load announcements.");
      }
    } catch (err: unknown) {
      console.error("Error fetching announcements:", err);
      showToast("error", "An error occurred while fetching announcements.");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // Auth verification
  useEffect(() => {
    async function checkAdminAuth() {
      setIsLoadingAuth(true);
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session?.user) {
          router.push("/login?redirect=/admin/announcements");
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .maybeSingle();

        const role = (profile as { role?: string | null } | null)?.role;
        if (profileError || role !== "admin") {
          router.push("/dashboard");
          return;
        }

        setIsAdmin(true);
        fetchAllAnnouncements();
      } catch (err) {
        console.error("Admin auth check error:", err);
        router.push("/dashboard");
      } finally {
        setIsLoadingAuth(false);
      }
    }

    checkAdminAuth();
  }, [router, fetchAllAnnouncements]);

  // Handle open modal for creation
  const handleOpenCreateModal = () => {
    setEditingAnnouncement(null);
    setIsModalOpen(true);
  };

  // Handle open modal for edit
  const handleOpenEditModal = (item: Announcement) => {
    setEditingAnnouncement(item);
    setIsModalOpen(true);
  };

  // Handle modal submit (create or update)
  const handleModalSubmit = async (
    data: CreateAnnouncementInput | UpdateAnnouncementInput
  ): Promise<boolean> => {
    try {
      if (editingAnnouncement) {
        const res = await updateAnnouncement(editingAnnouncement.id, data);
        if (res.success && res.data) {
          showToast("success", "Announcement updated successfully.");
          await fetchAllAnnouncements();
          return true;
        } else {
          showToast("error", res.error || "Failed to update announcement.");
          return false;
        }
      } else {
        const res = await createAnnouncement(data as CreateAnnouncementInput);
        if (res.success && res.data) {
          showToast("success", "New announcement created successfully.");
          await fetchAllAnnouncements();
          return true;
        } else {
          showToast("error", res.error || "Failed to create announcement.");
          return false;
        }
      }
    } catch (err: unknown) {
      console.error("Modal submit error:", err);
      showToast("error", "An error occurred while saving the announcement.");
      return false;
    }
  };

  // Handle toggle active status
  const handleToggleStatus = async (item: Announcement) => {
    const nextStatus = !item.is_active;
    setTogglingId(item.id);

    try {
      const res = await toggleAnnouncementStatus(item.id, nextStatus);
      if (res.success) {
        showToast(
          "success",
          nextStatus
            ? "Announcement set to active. Previous announcement deactivated."
            : "Announcement deactivated."
        );
        await fetchAllAnnouncements();
      } else {
        showToast("error", res.error || "Failed to toggle status.");
      }
    } catch (err: unknown) {
      console.error("Toggle status error:", err);
      showToast("error", "An error occurred while updating status.");
    } finally {
      setTogglingId(null);
    }
  };

  // Handle delete announcement
  const handleDeleteConfirm = async () => {
    if (!deletingAnnouncement) return;

    setIsDeleting(true);
    try {
      const res = await deleteAnnouncement(deletingAnnouncement.id);
      if (res.success) {
        showToast("success", "Announcement deleted successfully.");
        setDeletingAnnouncement(null);
        await fetchAllAnnouncements();
      } else {
        showToast("error", res.error || "Failed to delete announcement.");
      }
    } catch (err: unknown) {
      console.error("Delete announcement error:", err);
      showToast("error", "An error occurred while deleting the announcement.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {isLoadingAuth ? (
          <div className="flex items-center justify-center py-24 text-sm text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin mr-2 text-[#186BA7]" />
            Verifying admin credentials...
          </div>
        ) : (
          <>
            {/* ── Top Header ────────────────────────────────────────────── */}
            <div className="border border-slate-200 rounded-t-sm rounded-b-none p-4 sm:p-6 bg-white mb-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block text-[11px] font-bold tracking-wider uppercase bg-[#186BA7]/10 text-[#186BA7] px-2 py-0.5 rounded-xs">
                      Administration
                    </span>
                    <span className="text-slate-300">/</span>
                    <span className="text-xs text-slate-500 font-medium">Content & Growth</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 flex items-center gap-2">
                    <Megaphone className="w-6 h-6 text-[#186BA7]" />
                    Manage Announcements
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Create, edit, and toggle promotional and alert banners displayed across the platform.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-sm bg-white text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to Moderation
                  </Link>
                </div>
              </div>
            </div>

            {/* ── Notification Toast ─────────────────────────────────────── */}
            {notification && (
              <div
                className={`mb-6 p-3 sm:p-4 rounded-sm border flex items-center justify-between gap-3 shadow-xs text-xs sm:text-sm transition-all ${
                  notification.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-red-50 border-red-200 text-red-900"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {notification.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  )}
                  <span>{notification.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setNotification(null)}
                  className="text-slate-400 hover:text-slate-700 transition-colors p-0.5"
                  aria-label="Dismiss message"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* ── Mobile Navigation Dropdown ────────────────────────────── */}
            <div className="block md:hidden mb-4">
              <div className="border border-slate-200 rounded-sm bg-white overflow-hidden shadow-xs">
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between p-3.5 text-left text-sm font-semibold text-slate-900 bg-slate-50 hover:bg-slate-100 transition-colors"
                  aria-expanded={isMobileMenuOpen}
                >
                  <div className="flex items-center gap-2.5">
                    <Megaphone className="w-4 h-4 text-[#186BA7]" />
                    <span>Announcements (Active)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-normal text-slate-500">
                    <span>Menu</span>
                    {isMobileMenuOpen ? (
                      <X className="w-4 h-4 text-slate-700" />
                    ) : (
                      <Menu className="w-4 h-4 text-slate-700" />
                    )}
                  </div>
                </button>

                {isMobileMenuOpen && (
                  <div className="border-t border-slate-200 divide-y divide-slate-100 bg-white">
                    <Link
                      href="/admin"
                      className="w-full flex items-center gap-3 px-4 py-3 text-xs sm:text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                    >
                      <ShieldCheck className="w-4 h-4 text-slate-500" />
                      <span>Core Moderation</span>
                    </Link>

                    <div className="bg-slate-50 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Content and Growth
                    </div>

                    <Link
                      href="/admin/announcements"
                      className="w-full flex items-center justify-between px-4 py-3 text-xs sm:text-sm bg-slate-100 text-slate-900 font-bold border-l-3 border-[#186BA7]"
                    >
                      <div className="flex items-center gap-3">
                        <Megaphone className="w-4 h-4 text-[#186BA7]" />
                        <span>Announcements</span>
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#186BA7]">
                        Active
                      </span>
                    </Link>

                    <Link
                      href="/admin"
                      className="w-full flex items-center gap-3 px-4 py-3 text-xs sm:text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                    >
                      <Users className="w-4 h-4 text-slate-500" />
                      <span>User & Community</span>
                    </Link>

                    <Link
                      href="/admin"
                      className="w-full flex items-center gap-3 px-4 py-3 text-xs sm:text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                    >
                      <BarChart3 className="w-4 h-4 text-slate-500" />
                      <span>Analytics</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* ── Desktop Layout: Sidebar + Main Content ─────────────────── */}
            <div className="border border-slate-200 rounded-sm bg-white overflow-hidden shadow-xs flex flex-col md:flex-row min-h-[580px]">
              {/* Left Sidebar */}
              <aside className="hidden md:flex flex-col w-64 lg:w-72 border-r border-slate-200 bg-white flex-shrink-0">
                <div className="p-4 border-b border-slate-200 bg-slate-50">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Navigation Menu
                  </p>
                </div>

                <nav className="p-3 space-y-1.5 flex-1">
                  <Link
                    href="/admin"
                    className="w-full flex items-center justify-between px-3.5 py-2.5 text-left text-xs sm:text-sm rounded-none transition-colors duration-150 cursor-pointer border bg-white text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900 font-medium"
                  >
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-4 h-4 text-slate-500 flex-shrink-0" />
                      <span>Core Moderation</span>
                    </div>
                  </Link>

                  <div className="space-y-1">
                    <Link
                      href="/admin"
                      className="w-full flex items-center justify-between px-3.5 py-2.5 text-left text-xs sm:text-sm rounded-none transition-colors duration-150 cursor-pointer border bg-white text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900 font-medium"
                    >
                      <div className="flex items-center gap-3">
                        <TrendingUp className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        <span>Content and Growth</span>
                      </div>
                    </Link>

                    {/* Sub-item: Announcements (Active) */}
                    <div className="pl-6 pr-2 py-0.5">
                      <Link
                        href="/admin/announcements"
                        className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-none transition-colors bg-slate-100 text-slate-900 border border-slate-400 font-semibold"
                      >
                        <div className="flex items-center gap-2.5">
                          <Megaphone className="w-3.5 h-3.5 text-[#186BA7] flex-shrink-0" />
                          <span>Announcements</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      </Link>
                    </div>
                  </div>

                  <Link
                    href="/admin"
                    className="w-full flex items-center justify-between px-3.5 py-2.5 text-left text-xs sm:text-sm rounded-none transition-colors duration-150 cursor-pointer border bg-white text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900 font-medium"
                  >
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-slate-500 flex-shrink-0" />
                      <span>User & Community</span>
                    </div>
                  </Link>

                  <Link
                    href="/admin"
                    className="w-full flex items-center justify-between px-3.5 py-2.5 text-left text-xs sm:text-sm rounded-none transition-colors duration-150 cursor-pointer border bg-white text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900 font-medium"
                  >
                    <div className="flex items-center gap-3">
                      <BarChart3 className="w-4 h-4 text-slate-500 flex-shrink-0" />
                      <span>Analytics</span>
                    </div>
                  </Link>
                </nav>
              </aside>

              {/* Main Content Area */}
              <section className="flex-1 min-w-0 p-6 sm:p-8 lg:p-10 bg-white flex flex-col justify-between">
                <div>
                  {/* Section Heading & Primary CTA */}
                  <div className="border-b border-slate-200 pb-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <Megaphone className="w-6 h-6 text-[#186BA7]" />
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                          Announcements
                        </h2>
                        {announcements.length > 0 && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            {announcements.length}
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-slate-500">
                        Create, modify, and toggle site-wide announcement banners.
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={fetchAllAnnouncements}
                        disabled={isLoading}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-slate-300 rounded-sm bg-white text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
                        title="Refresh announcements"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                        Refresh
                      </button>

                      <button
                        type="button"
                        onClick={handleOpenCreateModal}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#186BA7] text-white rounded-sm hover:bg-[#155b8e] transition-colors cursor-pointer shadow-xs"
                      >
                        <Plus className="w-4 h-4" />
                        Create New Announcement
                      </button>
                    </div>
                  </div>

                  {/* ── Table / Content ──────────────────────────────────────── */}
                  {isLoading && announcements.length === 0 ? (
                    <div className="py-20 text-center text-slate-400">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-[#186BA7]" />
                      <p className="text-sm">Loading announcements...</p>
                    </div>
                  ) : announcements.length === 0 ? (
                    /* ── Empty State ── */
                    <div className="border border-dashed border-slate-300 rounded-sm p-8 sm:p-12 text-center bg-slate-50/50 my-4">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white border border-slate-200 text-[#186BA7] mb-4 shadow-2xs">
                        <Megaphone className="w-6 h-6" />
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
                        No announcements yet
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-6">
                        You have not created any announcements yet. Create one to display an active promotional banner at the top of the homepage.
                      </p>
                      <button
                        type="button"
                        onClick={handleOpenCreateModal}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold bg-[#186BA7] text-white rounded-sm hover:bg-[#155b8e] transition-colors cursor-pointer shadow-xs"
                      >
                        <Plus className="w-4 h-4" />
                        Create Your First Announcement
                      </button>
                    </div>
                  ) : (
                    /* ── Data Table ── */
                    <div className="border border-slate-200 rounded-sm overflow-hidden bg-white shadow-2xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[700px]">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold">
                              <th className="py-3 px-4 w-1/2">Content</th>
                              <th className="py-3 px-4">Link URL</th>
                              <th className="py-3 px-4 text-center">Status</th>
                              <th className="py-3 px-4 text-center">Active Toggle</th>
                              <th className="py-3 px-4 text-right pr-6">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {announcements.map((item) => {
                              const isToggling = togglingId === item.id;
                              return (
                                <tr
                                  key={item.id}
                                  className={`hover:bg-slate-50/70 transition-colors ${
                                    item.is_active ? "bg-emerald-50/20" : ""
                                  }`}
                                >
                                  {/* Content (Truncated with tooltip) */}
                                  <td className="py-3.5 px-4 align-top">
                                    <div
                                      className="font-medium text-slate-900 line-clamp-2"
                                      title={item.text_content}
                                    >
                                      {item.text_content}
                                    </div>
                                    <div className="text-[11px] text-slate-400 mt-1">
                                      Created {new Date(item.created_at).toLocaleDateString()}
                                    </div>
                                  </td>

                                  {/* Link URL */}
                                  <td className="py-3.5 px-4 align-top">
                                    {item.link_url ? (
                                      <div className="flex flex-col gap-0.5">
                                        <a
                                          href={item.link_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 text-xs font-medium text-[#186BA7] hover:underline break-all"
                                        >
                                          <span>{item.link_text || "Details"}</span>
                                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                        </a>
                                        <span className="text-[11px] text-slate-400 truncate max-w-[200px]" title={item.link_url}>
                                          {item.link_url}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-slate-400 text-xs italic">No link</span>
                                    )}
                                  </td>

                                  {/* Status Badge */}
                                  <td className="py-3.5 px-4 whitespace-nowrap text-center align-top">
                                    {item.is_active ? (
                                      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 font-semibold rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        Active
                                      </span>
                                    ) : (
                                      <span className="inline-block text-xs px-2.5 py-1 font-semibold rounded-full border bg-slate-100 text-slate-600 border-slate-200">
                                        Inactive
                                      </span>
                                    )}
                                  </td>

                                  {/* Quick Toggle Switch */}
                                  <td className="py-3.5 px-4 whitespace-nowrap text-center align-top">
                                    <button
                                      type="button"
                                      role="switch"
                                      aria-checked={item.is_active}
                                      disabled={isToggling}
                                      onClick={() => handleToggleStatus(item)}
                                      className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
                                        item.is_active ? "bg-emerald-600" : "bg-slate-300"
                                      }`}
                                      title={
                                        item.is_active
                                          ? "Click to deactivate"
                                          : "Click to activate (will deactivate any other announcement)"
                                      }
                                    >
                                      <span className="sr-only">Toggle announcement active</span>
                                      <span
                                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                          item.is_active ? "translate-x-5" : "translate-x-0"
                                        }`}
                                      />
                                    </button>
                                  </td>

                                  {/* Actions */}
                                  <td className="py-3.5 px-4 pr-6 text-right whitespace-nowrap align-top">
                                    <div className="inline-flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenEditModal(item)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium border border-slate-300 rounded-sm bg-white text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                                        title="Edit announcement"
                                      >
                                        <Pencil className="w-3 h-3" />
                                        <span>Edit</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => setDeletingAnnouncement(item)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium border border-red-200 rounded-sm bg-white text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                        title="Delete announcement"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                        <span>Delete</span>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Note inside card */}
                <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>Fehrist Admin Suite</span>
                  <span>Module: Announcements Management</span>
                </div>
              </section>
            </div>
          </>
        )}
      </main>

      {/* ── Create / Edit Modal ────────────────────────────────────────── */}
      <AnnouncementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        announcement={editingAnnouncement}
        onSubmit={handleModalSubmit}
      />

      {/* ── Delete Confirmation Dialog ─────────────────────────────────── */}
      {deletingAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-sm max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-red-600" />
                Delete Announcement
              </h3>
              <button
                type="button"
                onClick={() => setDeletingAnnouncement(null)}
                disabled={isDeleting}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 mb-3">
              Are you sure you want to delete this announcement? This action cannot be undone.
            </p>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm mb-5 text-xs text-slate-800 italic">
              "{deletingAnnouncement.text_content}"
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingAnnouncement(null)}
                className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-sm text-slate-700 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-sm bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Delete Announcement
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
