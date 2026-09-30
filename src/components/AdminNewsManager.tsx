"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import {
  Newspaper,
  Plus,
  Edit3,
  Trash2,
  Eye,
  Upload,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  X,
  ExternalLink,
  SlidersHorizontal,
  Search,
  Sparkles,
  ArrowRight,
  Radio,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface NewsItem {
  id: string;
  title: string;
  category: string;
  featuredImage: string;
  description: string;
  buttonText: string | null;
  buttonUrl: string | null;
  status: "DRAFT" | "PUBLISHED";
  publishDate: string | Date;
  expirationDate: string | Date;
  showOnCarousel: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

const CATEGORIES = [
  "League News",
  "Match",
  "Competition",
  "Registration",
  "Announcement",
  "System Update",
  "Event",
  "Other",
] as const;

interface AdminNewsManagerProps {
  initialNews?: NewsItem[];
  onRefresh?: () => void;
}

// Helper to convert Date to string for datetime-local input (YYYY-MM-DDTHH:mm)
function toDatetimeLocal(dateVal?: string | Date): string {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function AdminNewsManager({
  initialNews = [],
  onRefresh,
}: AdminNewsManagerProps) {
  const [newsList, setNewsList] = useState<NewsItem[]>(initialNews);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isPending, startTransition] = useTransition();

  // Create / Edit Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NewsItem | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    category: "League News",
    featuredImage: "",
    description: "",
    buttonText: "",
    buttonUrl: "",
    status: "PUBLISHED" as "DRAFT" | "PUBLISHED",
    publishDate: toDatetimeLocal(new Date()),
    expirationDate: toDatetimeLocal(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    showOnCarousel: true,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Preview Modal State
  const [previewItem, setPreviewItem] = useState<NewsItem | null>(null);

  // Delete Confirmation Modal State
  const [deletingItem, setDeletingItem] = useState<NewsItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Helper to calculate computed status
  const getComputedStatus = (item: NewsItem) => {
    if (item.status === "DRAFT") return "DRAFT";
    const now = new Date();
    const exp = new Date(item.expirationDate);
    const pub = new Date(item.publishDate);
    if (now >= exp) return "EXPIRED";
    if (now < pub) return "SCHEDULED";
    return "PUBLISHED";
  };

  // Open Form for Create
  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      title: "",
      category: "League News",
      featuredImage: "",
      description: "",
      buttonText: "",
      buttonUrl: "",
      status: "PUBLISHED",
      publishDate: toDatetimeLocal(new Date()),
      expirationDate: toDatetimeLocal(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
      showOnCarousel: true,
    });
    setFormError(null);
    setFormSuccess(null);
    setIsFormOpen(true);
  };

  // Open Form for Edit
  const handleOpenEdit = (item: NewsItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      category: item.category,
      featuredImage: item.featuredImage,
      description: item.description,
      buttonText: item.buttonText || "",
      buttonUrl: item.buttonUrl || "",
      status: item.status,
      publishDate: toDatetimeLocal(item.publishDate),
      expirationDate: toDatetimeLocal(item.expirationDate),
      showOnCarousel: item.showOnCarousel,
    });
    setFormError(null);
    setFormSuccess(null);
    setIsFormOpen(true);
  };

  // Handle Image Upload
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setFormError(null);

    try {
      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("folder", "news");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to upload image.");
      }

      setFormData((prev) => ({ ...prev, featuredImage: data.url }));
    } catch (err: any) {
      setFormError(err.message || "Failed to upload featured image.");
    } finally {
      setIsUploading(false);
    }
  };

  // Save News (Create or Update)
  const handleSubmitForm = async (e: React.FormEvent, overrideStatus?: "DRAFT" | "PUBLISHED") => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!formData.title.trim()) {
      setFormError("Title is required.");
      return;
    }
    if (!formData.category.trim()) {
      setFormError("Category is required.");
      return;
    }
    if (!formData.featuredImage.trim()) {
      setFormError("Featured image is required. Upload an image or enter a valid URL.");
      return;
    }
    if (!formData.description.trim()) {
      setFormError("Description is required.");
      return;
    }
    if (!formData.expirationDate) {
      setFormError("Expiration date and time are required.");
      return;
    }

    const pubDate = new Date(formData.publishDate);
    const expDate = new Date(formData.expirationDate);

    if (isNaN(pubDate.getTime())) {
      setFormError("Invalid publish date.");
      return;
    }
    if (isNaN(expDate.getTime())) {
      setFormError("Invalid expiration date.");
      return;
    }
    if (expDate <= pubDate) {
      setFormError("Expiration date must be set after publish date.");
      return;
    }

    const payloadStatus = overrideStatus || formData.status;

    try {
      const isEditing = Boolean(editingItem);
      const url = isEditing
        ? `/api/admin/news/${editingItem!.id}`
        : `/api/admin/news`;
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          category: formData.category,
          featuredImage: formData.featuredImage,
          description: formData.description,
          buttonText: formData.buttonText || null,
          buttonUrl: formData.buttonUrl || null,
          status: payloadStatus,
          publishDate: pubDate.toISOString(),
          expirationDate: expDate.toISOString(),
          showOnCarousel: formData.showOnCarousel,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save news article.");
      }

      setFormSuccess(
        isEditing
          ? "News article updated successfully!"
          : "News article created successfully!"
      );

      // Update state locally
      if (isEditing) {
        setNewsList((prev) =>
          prev.map((item) => (item.id === data.news.id ? data.news : item))
        );
      } else {
        setNewsList((prev) => [data.news, ...prev]);
      }

      setTimeout(() => {
        setIsFormOpen(false);
        setFormSuccess(null);
        if (onRefresh) onRefresh();
      }, 800);
    } catch (err: any) {
      setFormError(err.message || "An unexpected error occurred.");
    }
  };

  // Toggle Show on Carousel
  const handleToggleCarousel = async (item: NewsItem) => {
    const nextVal = !item.showOnCarousel;
    try {
      const res = await fetch(`/api/admin/news/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showOnCarousel: nextVal }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update carousel display.");
      }

      setNewsList((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, showOnCarousel: nextVal } : n))
      );
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.message || "Failed to toggle carousel visibility.");
    }
  };

  // Toggle Status (Publish / Unpublish)
  const handleToggleStatus = async (item: NewsItem) => {
    const nextStatus = item.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    try {
      const res = await fetch(`/api/admin/news/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to toggle status.");
      }

      setNewsList((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, status: nextStatus } : n))
      );
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.message || "Failed to toggle status.");
    }
  };

  // Confirm Delete News
  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/news/${deletingItem.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete news article.");
      }

      setNewsList((prev) => prev.filter((n) => n.id !== deletingItem.id));
      setDeletingItem(null);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.message || "Failed to delete news article.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered News Items
  const filteredNews = useMemo(() => {
    return newsList.filter((item) => {
      const matchesSearch =
        searchQuery === "" ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        categoryFilter === "ALL" || item.category === categoryFilter;

      const compStatus = getComputedStatus(item);
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ON_CAROUSEL" && item.showOnCarousel && compStatus === "PUBLISHED") ||
        statusFilter === compStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [newsList, searchQuery, categoryFilter, statusFilter]);

  // Summary Metrics
  const metrics = useMemo(() => {
    let published = 0;
    let drafts = 0;
    let expired = 0;
    let onCarousel = 0;

    for (const item of newsList) {
      const comp = getComputedStatus(item);
      if (comp === "PUBLISHED") published++;
      if (comp === "DRAFT") drafts++;
      if (comp === "EXPIRED") expired++;
      if (item.showOnCarousel && comp === "PUBLISHED") onCarousel++;
    }

    return {
      total: newsList.length,
      published,
      drafts,
      expired,
      onCarousel,
    };
  }, [newsList]);

  return (
    <div className="space-y-6">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-card/80 border border-border backdrop-blur-xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="yellow" className="text-xs font-mono font-bold tracking-wider">
              ADMIN CONTROL
            </Badge>
            <span className="text-xs font-mono text-muted-foreground">Official Communications</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
            <Newspaper className="h-6 w-6 text-primary" />
            <span>News &amp; Carousel Management</span>
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
            Create, schedule, draft, publish, and control news articles appearing on the homepage News &amp; Trending carousel. Only verified administrator-created records are displayed.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          variant="yellow"
          size="default"
          className="rounded-xl font-bold text-xs sm:text-sm gap-2 shrink-0 shadow-lg cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Create News Article</span>
        </Button>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="rounded-2xl border border-border bg-card/60 p-3.5 space-y-1 backdrop-blur-md">
          <span className="text-xs font-mono text-muted-foreground uppercase">Total Articles</span>
          <p className="text-lg sm:text-xl font-black text-foreground">{metrics.total}</p>
        </div>
        <div className="rounded-2xl border border-primary/30 bg-primary/10 p-3.5 space-y-1 backdrop-blur-md">
          <span className="text-xs font-mono text-primary uppercase">Published Active</span>
          <p className="text-lg sm:text-xl font-black text-primary">{metrics.published}</p>
        </div>
        <div className="rounded-2xl border border-secondary/30 bg-secondary/10 p-3.5 space-y-1 backdrop-blur-md">
          <span className="text-xs font-mono text-secondary uppercase">Live On Carousel</span>
          <p className="text-lg sm:text-xl font-black text-secondary">{metrics.onCarousel}</p>
        </div>
        <div className="rounded-2xl border border-border bg-muted/30 p-3.5 space-y-1 backdrop-blur-md">
          <span className="text-xs font-mono text-muted-foreground uppercase">Drafts</span>
          <p className="text-lg sm:text-xl font-black text-muted-foreground">{metrics.drafts}</p>
        </div>
        <div className="col-span-2 sm:col-span-1 rounded-2xl border border-destructive/30 bg-destructive/10 p-3.5 space-y-1 backdrop-blur-md">
          <span className="text-xs font-mono text-destructive uppercase">Expired</span>
          <p className="text-lg sm:text-xl font-black text-destructive">{metrics.expired}</p>
        </div>
      </div>

      {/* Controls & Search Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 rounded-2xl border border-border bg-card/60 backdrop-blur-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search news by headline, description, or category..."
            className="pl-9 h-9 text-xs rounded-xl bg-background/80"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 px-3 text-xs rounded-xl bg-background/80 border border-border text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 text-xs rounded-xl bg-background/80 border border-border text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">All Statuses</option>
            <option value="PUBLISHED">Published (Active)</option>
            <option value="ON_CAROUSEL">Live on Carousel (ON)</option>
            <option value="DRAFT">Drafts</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>
      </div>

      {/* News Management Table */}
      <div className="rounded-2xl border border-border bg-card/75 backdrop-blur-md overflow-hidden shadow-xl">
        {filteredNews.length === 0 ? (
          /* Professional Empty State - NO DEMO DATA */
          <div className="py-16 px-6 text-center space-y-4">
            <div className="h-16 w-16 mx-auto rounded-3xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary shadow-inner">
              <Newspaper className="h-8 w-8" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-base sm:text-lg font-black text-foreground">
                No news published yet
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Create your first news article to display it on the News &amp; Trending carousel.
              </p>
            </div>
            <Button
              onClick={handleOpenCreate}
              variant="yellow"
              size="sm"
              className="rounded-xl font-bold text-xs gap-1.5 shadow-md cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Create News Article</span>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-background/90 text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-3 px-4">Featured Image</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Publish Date</th>
                  <th className="py-3 px-4">Expiration Date</th>
                  <th className="py-3 px-4">Carousel Status</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredNews.map((item) => {
                  const computed = getComputedStatus(item);
                  const isCarouselEligible =
                    item.status === "PUBLISHED" &&
                    item.showOnCarousel &&
                    computed === "PUBLISHED";

                  const pubStr = new Date(item.publishDate).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  const expStr = new Date(item.expirationDate).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  const createdStr = new Date(item.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-muted/30 transition-colors duration-150"
                    >
                      {/* Featured Image Thumbnail */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="h-12 w-20 rounded-lg overflow-hidden border border-border/80 bg-background/60 shadow-sm shrink-0">
                          {item.featuredImage ? (
                            <img
                              src={item.featuredImage}
                              alt={item.title}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                              <ImageIcon className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Title */}
                      <td className="py-3 px-4 max-w-xs">
                        <span className="font-bold text-foreground text-xs sm:text-sm line-clamp-1 block">
                          {item.title}
                        </span>
                        <span className="text-xs text-muted-foreground line-clamp-1 block mt-0.5">
                          {item.description}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className="text-xs font-mono font-medium border-border/80"
                        >
                          {item.category}
                        </Badge>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {computed === "DRAFT" && (
                          <Badge variant="secondary" className="text-xs font-mono font-bold">
                            Draft
                          </Badge>
                        )}
                        {computed === "PUBLISHED" && (
                          <Badge variant="green" className="text-xs font-mono font-bold">
                            Published
                          </Badge>
                        )}
                        {computed === "SCHEDULED" && (
                          <Badge variant="outline" className="text-xs font-mono font-bold text-primary border-primary/40">
                            Scheduled
                          </Badge>
                        )}
                        {computed === "EXPIRED" && (
                          <Badge variant="destructive" className="text-xs font-mono font-bold">
                            Expired
                          </Badge>
                        )}
                      </td>

                      {/* Publish Date */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-xs text-muted-foreground">
                        {pubStr}
                      </td>

                      {/* Expiration Date */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-xs text-muted-foreground">
                        {expStr}
                      </td>

                      {/* Carousel Status Toggle */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleCarousel(item)}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold transition-all cursor-pointer border",
                            item.showOnCarousel
                              ? "bg-secondary/15 text-secondary border-secondary/40 hover:bg-secondary/25"
                              : "bg-muted/40 text-muted-foreground border-border hover:bg-muted/70"
                          )}
                          title="Click to toggle carousel display (Separate from Delete)"
                        >
                          <Radio className={cn("h-3 w-3", item.showOnCarousel ? "text-secondary" : "text-muted-foreground")} />
                          <span>{item.showOnCarousel ? "Carousel ON" : "Carousel OFF"}</span>
                        </button>
                      </td>

                      {/* Created Date */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-xs text-muted-foreground">
                        {createdStr}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Preview Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPreviewItem(item)}
                            className="h-8 px-2 text-xs text-foreground hover:text-white"
                            title="Preview how this appears on carousel"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>

                          {/* Quick Publish / Unpublish Toggle */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(item)}
                            className={cn(
                              "h-8 px-2 text-xs font-mono",
                              item.status === "PUBLISHED"
                                ? "text-muted-foreground hover:text-white"
                                : "text-primary hover:text-primary"
                            )}
                            title={item.status === "PUBLISHED" ? "Unpublish (Move to Draft)" : "Publish Now"}
                          >
                            {item.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                          </Button>

                          {/* Edit Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEdit(item)}
                            className="h-8 px-2.5 text-xs font-semibold gap-1"
                            title="Edit news article"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            <span>Edit</span>
                          </Button>

                          {/* Delete Button (Permanent removal with separate confirmation) */}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeletingItem(item)}
                            className="h-8 px-2 text-xs text-destructive-foreground"
                            title="Permanently delete from database & carousel"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* CREATE / EDIT NEWS MODAL */}
      {/* ========================================================================= */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-background/85 backdrop-blur-xl overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-2xl rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl my-auto space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="space-y-1">
                <Badge variant="yellow" className="text-xs font-mono font-bold">
                  {editingItem ? "EDIT NEWS ARTICLE" : "NEW NEWS ARTICLE"}
                </Badge>
                <h3 className="text-lg sm:text-xl font-black text-foreground">
                  {editingItem ? "Update News Details" : "Publish New League News"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="h-8 w-8 rounded-full bg-muted/60 text-muted-foreground hover:text-foreground flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3.5 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="p-3.5 rounded-xl bg-primary/15 border border-primary/30 text-primary text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={(e) => handleSubmitForm(e)} className="space-y-4">
              {/* Title (Required) */}
              <div>
                <label className="text-xs font-mono font-bold uppercase text-foreground block mb-1">
                  Title <span className="text-destructive">*</span>
                </label>
                <Input
                  required
                  value={formData.title}
                  onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Official Season 2026 Matchday 1 Schedule Announced"
                  className="text-xs sm:text-sm rounded-xl"
                />
              </div>

              {/* Category (Required) */}
              <div>
                <label className="text-xs font-mono font-bold uppercase text-foreground block mb-1">
                  Category <span className="text-destructive">*</span>
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))}
                  className="w-full h-10 px-3 text-xs sm:text-sm rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Featured Image (Required) with Upload & Live Preview */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold uppercase text-foreground block mb-1">
                  Featured Image <span className="text-destructive">*</span>
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <Input
                    required
                    value={formData.featuredImage}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, featuredImage: e.target.value }))
                    }
                    placeholder="Upload a file or enter image URL (https://...)"
                    className="text-xs sm:text-sm rounded-xl flex-1"
                  />
                  <label className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary/10 border border-primary/30 text-primary text-xs font-bold hover:bg-primary/20 cursor-pointer transition-colors shrink-0">
                    <Upload className="h-3.5 w-3.5" />
                    <span>{isUploading ? "Uploading..." : "Upload File"}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={handleImageFileChange}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Real-time Image Preview */}
                {formData.featuredImage && (
                  <div className="relative rounded-2xl overflow-hidden border border-border bg-background/80 p-2 flex items-center gap-3">
                    <div className="h-16 w-24 rounded-lg overflow-hidden border border-border/80 bg-background shrink-0">
                      <img
                        src={formData.featuredImage}
                        alt="Preview"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-mono text-muted-foreground block truncate">
                        Preview: {formData.featuredImage}
                      </span>
                      <button
                        type="button"
                        onClick={() => setFormData((p) => ({ ...p, featuredImage: "" }))}
                        className="text-xs text-destructive hover:underline mt-1 block"
                      >
                        Remove image
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Description (Required Multiline) */}
              <div>
                <label className="text-xs font-mono font-bold uppercase text-foreground block mb-1">
                  Description <span className="text-destructive">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, description: e.target.value }))
                  }
                  placeholder="Provide comprehensive details for this news bulletin..."
                  className="w-full rounded-xl border border-border bg-background p-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Optional CTA Button */}
              <div className="p-3.5 rounded-2xl border border-border/80 bg-muted/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-foreground uppercase">
                    Call To Action Button (Optional)
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">
                    Left empty = no button on carousel
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">
                      Button Text
                    </label>
                    <Input
                      value={formData.buttonText}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, buttonText: e.target.value }))
                      }
                      placeholder="e.g. View Standings, Register Now"
                      className="text-xs rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">
                      Button Destination URL
                    </label>
                    <Input
                      value={formData.buttonUrl}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, buttonUrl: e.target.value }))
                      }
                      placeholder="e.g. /standings or /register or https://..."
                      className="text-xs rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Publishing Schedule: Publish Date & Expiration Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono font-bold uppercase text-foreground block mb-1">
                    Publish Date &amp; Time <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="datetime-local"
                    required
                    value={formData.publishDate}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, publishDate: e.target.value }))
                    }
                    className="text-xs rounded-xl"
                  />
                  <span className="text-xs font-mono text-muted-foreground mt-0.5 block">
                    Displays on carousel from this time
                  </span>
                </div>

                <div>
                  <label className="text-xs font-mono font-bold uppercase text-foreground block mb-1">
                    Expiration Date &amp; Time <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="datetime-local"
                    required
                    value={formData.expirationDate}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, expirationDate: e.target.value }))
                    }
                    className="text-xs rounded-xl"
                  />
                  <span className="text-xs font-mono text-muted-foreground mt-0.5 block">
                    Auto-expires and disappears from carousel
                  </span>
                </div>
              </div>

              {/* Carousel Control: Show on Carousel ON/OFF */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border bg-background/90">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-foreground uppercase block">
                    Show on Carousel
                  </span>
                  <p className="text-xs text-muted-foreground">
                    When OFF, news remains in the database and Admin Portal but is hidden from the public carousel.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((p) => ({ ...p, showOnCarousel: !p.showOnCarousel }))
                  }
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border cursor-pointer",
                    formData.showOnCarousel
                      ? "bg-secondary text-secondary-foreground border-secondary font-black shadow-md"
                      : "bg-muted text-muted-foreground border-border"
                  )}
                >
                  {formData.showOnCarousel ? "ON (Show)" : "OFF (Hide)"}
                </button>
              </div>

              {/* Action Buttons: Save as Draft vs Publish */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFormOpen(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => handleSubmitForm(e, "DRAFT")}
                  className="rounded-xl text-xs font-bold"
                >
                  Save as Draft
                </Button>

                <Button
                  type="submit"
                  variant="yellow"
                  size="sm"
                  onClick={() => setFormData((p) => ({ ...p, status: "PUBLISHED" }))}
                  className="rounded-xl text-xs font-black shadow-lg"
                >
                  {editingItem ? "Save & Publish" : "Publish News"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PREVIEW MODAL (Accurate Homepage Carousel Simulation) */}
      {/* ========================================================================= */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-background/90 backdrop-blur-2xl overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-4xl rounded-3xl border border-secondary/40 bg-card p-6 sm:p-8 shadow-2xl my-auto space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Badge variant="yellow" className="text-xs font-mono font-bold">
                  CAROUSEL LIVE PREVIEW
                </Badge>
                <span className="text-xs font-mono text-muted-foreground">
                  Exact visitor experience on the homepage
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="h-8 w-8 rounded-full bg-muted/60 text-muted-foreground hover:text-foreground flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Simulated Coverflow Slide Card */}
            <div className="relative rounded-3xl overflow-hidden border border-border bg-background shadow-2xl min-h-85 flex flex-col justify-between">
              {/* Dynamic Background Image */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
                <img
                  src={previewItem.featuredImage || "/images/carousel-stadium-bg.jpg"}
                  alt=""
                  aria-hidden="true"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
              <div className="h-1 w-full bg-gradient-to-r from-primary via-secondary to-primary relative z-10" />

              <div className="relative z-10 p-6 sm:p-8 flex-1 flex flex-col justify-between gap-6">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  {/* Text & CTA */}
                  <div className="space-y-3 max-w-xl flex-1 text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="yellow" className="text-xs font-mono font-bold uppercase tracking-wider">
                        <Newspaper className="h-3 w-3 mr-1" />
                        <span>{previewItem.category}</span>
                      </Badge>
                      <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {new Date(previewItem.publishDate).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-3xl font-black text-foreground uppercase tracking-tight">
                      {previewItem.title}
                    </h2>

                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line line-clamp-4">
                      {previewItem.description}
                    </p>

                    {/* CTA Button (Displayed only if configured) */}
                    {previewItem.buttonText && previewItem.buttonUrl && (
                      <div className="pt-2">
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-secondary-foreground font-black text-xs sm:text-sm shadow-lg pointer-events-none">
                          <span>{previewItem.buttonText}</span>
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Featured Image */}
                  {previewItem.featuredImage && (
                    <div className="relative rounded-2xl overflow-hidden border border-border/80 bg-card/60 shadow-2xl w-full max-w-sm aspect-video shrink-0">
                      <img
                        src={previewItem.featuredImage}
                        alt={previewItem.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/40 text-xs font-mono text-muted-foreground">
                  <span>eFootball Rwanda League • Official News Bulletin</span>
                  <span className="uppercase tracking-widest hidden sm:inline-block">
                    Carousel Preview Mode
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewItem(null)}
                className="rounded-xl text-xs"
              >
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PERMANENT DELETE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-background/90 backdrop-blur-xl animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-destructive/40 bg-card p-6 shadow-2xl space-y-4 text-center">
            <div className="h-14 w-14 rounded-2xl bg-destructive/15 border border-destructive/30 flex items-center justify-center text-destructive mx-auto shadow-inner">
              <Trash2 className="h-7 w-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-foreground">
                Permanently Delete News Article?
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                This action is <strong className="text-destructive">permanent and cannot be undone</strong>. The article will be immediately purged from the database and removed from the public carousel.
              </p>
              <div className="p-2.5 rounded-xl bg-muted/40 border border-border font-bold text-xs text-foreground mt-2 truncate">
                &ldquo;{deletingItem.title}&rdquo;
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingItem(null)}
                disabled={isDeleting}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="rounded-xl text-xs font-bold gap-1.5 shadow-lg"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{isDeleting ? "Deleting..." : "Permanently Delete"}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
