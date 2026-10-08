"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useNotification } from "../../service/layout";
import {
  useGetMyServicesQuery,
  useCreateServiceMutation,
  useDeleteServiceMutation,
  useUpdateServiceMutation,
} from "@/redux/api/serviceApi";
import {
  useGetMyDashboardForServiceProviderQuery,
  useGetServiceProviderTotalEarningsServiceQuery,
} from "@/redux/api/statisticsApi";
import { useGetMyTransactionsQuery } from "@/redux/api/paymentApi";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import {
  useGetAllServiceBookingsOfProviderQuery,
  useAcceptBookingMutation,
  useRejectBookingMutation,
  useInProgressBookingMutation,
  useCompleteBookingMutation,
  useUploadStartingProofVideoMutation,
  useUploadEndingProofVideoMutation,
} from "@/redux/api/serviceBookingApi";
import {
  BackArrowIcon,
  SearchIcon,
  EditIcon,
  TrashIcon,
  StarIcon,
  CalendarIcon,
  PinIcon,
} from "./Icons";
import { Sparkles } from "lucide-react";

interface SPHomeProps {
  profName: string;
  subView: "services" | "jobs" | "job-details" | "earnings" | null;
  setSubView: (view: "services" | "jobs" | "job-details" | "earnings" | null) => void;
  onViewJobDetails: (jobId: string) => void;
  onViewProofOfWork: (jobId: string) => void;
  onMessageOwner: (ownerId: string, ownerName: string) => void;
  triggerNotification: (msg: string, type?: "success" | "error") => void;
  jobsActiveSubTab?: "new" | "accepted" | "ongoing" | "completed";
  setJobsActiveSubTab?: (tab: "new" | "accepted" | "ongoing" | "completed") => void;
}

const mockServices = [
  {
    id: "mock-1",
    serviceName: "Deep Cleaning",
    serviceType: "Cleaning",
    bookings: 12,
    rating: 0.0,
    offered_services: [{ price: 250, serviceTypeName: "2 BHK" }, { price: 350, serviceTypeName: "3 BHK" }],
    serviceStatus: "ACTIVE",
    coverImage: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "mock-2",
    serviceName: "AC Repair & Maintenance",
    serviceType: "Electrical",
    bookings: 23,
    rating: 0.0,
    offered_services: [{ price: 80, serviceTypeName: "Standard" }],
    serviceStatus: "ACTIVE",
    coverImage: "",
  },
];

const mockJobs = [
  {
    id: "mock-job-1",
    property: "Sunset Villa Apartments",
    serviceName: "House Cleaning",
    offeredService: { serviceTypeName: "2 BHK" },
    address: "123 Oak Street, Downtown",
    date: "Today, 2:00 PM - 4:00 PM",
    totalPrice: 250,
    bookingStatus: "NEED_ACCEPT",
    user: { fullName: "Mr. Rahman", id: "owner-1" },
  },
  {
    id: "mock-job-2",
    property: "Sunrise Apartments",
    serviceName: "Plumbing Repair",
    offeredService: { serviceTypeName: "Standard" },
    address: "Sunrise Apartments, Block A",
    date: "Oct 10, 3:00 PM - 5:00 PM",
    totalPrice: 90,
    bookingStatus: "CONFIRMED",
    user: { fullName: "Mrs. Sultana", id: "owner-2" },
  },
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function SPHome({
  profName,
  subView,
  setSubView,
  onViewJobDetails,
  onViewProofOfWork,
  onMessageOwner,
  triggerNotification,
  jobsActiveSubTab: jobsActiveSubTabProp,
  setJobsActiveSubTab: setJobsActiveSubTabProp,
}: SPHomeProps) {
  const { openNotifications, unreadCount } = useNotification();

  // ---- Queries ----
  const { data: myServicesRes, refetch: refetchServices, isLoading: isLoadingServices } = useGetMyServicesQuery(undefined);
  const { data: bookingsRes, refetch: refetchBookings, isLoading: isLoadingBookings, isFetching: isFetchingBookings } = useGetAllServiceBookingsOfProviderQuery({ limit: 100 });
  const { data: statsRes, refetch: refetchStats } = useGetMyDashboardForServiceProviderQuery(undefined);
  
  const [timeRange, setTimeRange] = useState("ALL_TIME");
  const { data: earningsStatsResponse } = useGetServiceProviderTotalEarningsServiceQuery(timeRange);
  const { data: txResponse } = useGetMyTransactionsQuery(undefined);
  const user = useSelector((state: RootState) => state.auth.user);

  // Refetch all queries on mount to ensure fresh data every time we navigate to this tab
  useEffect(() => {
    refetchServices();
    refetchBookings();
    refetchStats();
  }, [refetchServices, refetchBookings, refetchStats]);

  // ---- Mutations ----
  const [createService, { isLoading: isCreatingService }] = useCreateServiceMutation();
  const [deleteService] = useDeleteServiceMutation();
  const [updateServiceMutation, { isLoading: isUpdatingService }] = useUpdateServiceMutation();
  const [acceptBooking] = useAcceptBookingMutation();
  const [rejectBooking] = useRejectBookingMutation();
  const [inProgressBooking] = useInProgressBookingMutation();
  const [completeBooking] = useCompleteBookingMutation();
  const [uploadStartingProof] = useUploadStartingProofVideoMutation();
  const [uploadEndingProof] = useUploadEndingProofVideoMutation();

  // ---- UI state ----
  const [searchServiceQuery, setSearchServiceQuery] = useState("");
  const [filterServiceStatus, setFilterServiceStatus] = useState<"All" | "ACTIVE" | "INACTIVE" | "PENDING">("All");
  
  const [localJobsActiveSubTab, setLocalJobsActiveSubTab] = useState<"new" | "accepted" | "ongoing" | "completed">("new");
  const jobsActiveSubTab = jobsActiveSubTabProp ?? localJobsActiveSubTab;
  const setJobsActiveSubTab = setJobsActiveSubTabProp ?? setLocalJobsActiveSubTab;
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<Date | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();

  // Synchronize URL query parameter with the service filter tabs
  useEffect(() => {
    if (subView === "services") {
      if (searchParams.has("ACTIVE")) setFilterServiceStatus("ACTIVE");
      else if (searchParams.has("INACTIVE")) setFilterServiceStatus("INACTIVE");
      else if (searchParams.has("PENDING")) setFilterServiceStatus("PENDING");
      else if (searchParams.has("ALL") || searchParams.has("All")) setFilterServiceStatus("All");
    }
  }, [searchParams, subView]);

  const handleFilterClick = (status: "All" | "ACTIVE" | "INACTIVE" | "PENDING") => {
    setFilterServiceStatus(status);
    router.push(`/dashboard/service/myservice?${status.toUpperCase()}`);
  };

  // ---- Proof Modals state ----
  const [showStartProofModal, setShowStartProofModal] = useState(false);
  const [showEndProofModal, setShowEndProofModal] = useState(false);
  const [selectedJobForProof, setSelectedJobForProof] = useState<any>(null);
  const [proofVideoFile, setProofVideoFile] = useState<File | null>(null);
  const [proofVideoPreview, setProofVideoPreview] = useState<string | null>(null);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [proofRemarks, setProofRemarks] = useState("");

  // ---- Add Service modal state ----
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceType, setNewServiceType] = useState("Cleaning");
  const [newServiceDesc, setNewServiceDesc] = useState("");
  const [newServiceActive, setNewServiceActive] = useState(true);
  const [newServiceExperience, setNewServiceExperience] = useState("2");
  const [newServiceRemark, setNewServiceRemark] = useState("");
  const [newServiceAddress, setNewServiceAddress] = useState("");
  const [newServiceLat, setNewServiceLat] = useState<number | null>(null);
  const [newServiceLng, setNewServiceLng] = useState<number | null>(null);
  const [addCoverImage, setAddCoverImage] = useState<File | null>(null);
  const [addCoverPreview, setAddCoverPreview] = useState<string | null>(null);
  const [newOfferedServices, setNewOfferedServices] = useState<{ serviceTypeName: string; price: string }[]>([
    { serviceTypeName: "Standard", price: "50" },
  ]);
  const [newAvailability, setNewAvailability] = useState<{ day: string; slots: { from: string; to: string }[] }[]>([
    { day: "Monday", slots: [{ from: "09:00 AM", to: "05:00 PM" }] },
  ]);
  const [showAddMap, setShowAddMap] = useState(true);
  const addMapRef = React.useRef<HTMLDivElement>(null);
  const addMapInstance = React.useRef<any>(null);
  const addMarkerRef = React.useRef<any>(null);

  // ---- Edit Service modal state ----
  const [showEditServiceModal, setShowEditServiceModal] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editServiceName, setEditServiceName] = useState("");
  const [editServiceType, setEditServiceType] = useState("Cleaning");
  const [editServiceDesc, setEditServiceDesc] = useState("");
  const [editServiceActive, setEditServiceActive] = useState(true);
  const [editServiceExperience, setEditServiceExperience] = useState("2");
  const [editServiceRemark, setEditServiceRemark] = useState("");
  const [editServiceAddress, setEditServiceAddress] = useState("");
  const [editServiceLat, setEditServiceLat] = useState<number | null>(null);
  const [editServiceLng, setEditServiceLng] = useState<number | null>(null);
  const [editCoverImage, setEditCoverImage] = useState<File | null>(null);
  const [editCoverPreview, setEditCoverPreview] = useState<string | null>(null);
  const [editOfferedServices, setEditOfferedServices] = useState<{ serviceTypeName: string; price: string }[]>([
    { serviceTypeName: "Standard", price: "50" },
  ]);
  const [editAvailability, setEditAvailability] = useState<{ day: string; slots: { from: string; to: string }[] }[]>([
    { day: "Monday", slots: [{ from: "09:00 AM", to: "05:00 PM" }] },
  ]);
  const [showEditMap, setShowEditMap] = useState(true);
  const editMapRef = React.useRef<HTMLDivElement>(null);
  const editMapInstance = React.useRef<any>(null);
  const editMarkerRef = React.useRef<any>(null);

  // ---- Google Maps helpers ----
  const loadGoogleMaps = (callback: () => void) => {
    if ((window as any).google?.maps) { callback(); return; }
    const existing = document.getElementById("gmap-script");
    if (existing) { existing.addEventListener("load", callback); return; }
    const script = document.createElement("script");
    script.id = "gmap-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&libraries=places`;
    script.async = true;
    script.onload = callback;
    document.head.appendChild(script);
  };

  const initMap = (
    containerRef: React.RefObject<HTMLDivElement | null>,
    mapRef: React.MutableRefObject<any>,
    markerRef: React.MutableRefObject<any>,
    defaultLat: number,
    defaultLng: number,
    onPick: (lat: number, lng: number, addr: string) => void
  ) => {
    if (!containerRef.current) return;
    const google = (window as any).google;
    const center = { lat: defaultLat, lng: defaultLng };
    const map = new google.maps.Map(containerRef.current, { center, zoom: 13 });
    mapRef.current = map;
    const marker = new google.maps.Marker({ position: center, map, draggable: true });
    markerRef.current = marker;
    const geocoder = new google.maps.Geocoder();
    const resolve = (latLng: any) => {
      geocoder.geocode({ location: latLng }, (results: any, status: any) => {
        const addr = status === "OK" && results[0]
          ? results[0].formatted_address
          : `${latLng.lat().toFixed(5)}, ${latLng.lng().toFixed(5)}`;
        onPick(latLng.lat(), latLng.lng(), addr);
      });
    };
    map.addListener("click", (e: any) => { marker.setPosition(e.latLng); resolve(e.latLng); });
    marker.addListener("dragend", (e: any) => { resolve(e.latLng); });
  };

  // ---- Data parsing ----
  const servicesList: any[] = Array.isArray(myServicesRes?.data?.data)
    ? myServicesRes.data.data
    : Array.isArray(myServicesRes?.data)
    ? myServicesRes.data
    : [];

  const rawJobsData = bookingsRes?.data;
  const jobsList: any[] = Array.isArray(rawJobsData?.data)
    ? rawJobsData.data
    : Array.isArray(rawJobsData)
    ? rawJobsData
    : [];

  const services = servicesList;
  const jobs = jobsList;

  if (isLoadingServices || isLoadingBookings) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center bg-zinc-50 font-sans min-h-[400px]">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-bold text-zinc-500 animate-pulse">Loading dashboard summary...</p>
      </div>
    );
  }

  const realCompletedJobs = jobsList.filter(
    (j: any) => j.bookingStatus === "COMPLETED_BY_PROVIDER" || j.bookingStatus === "COMPLETED"
  );
  const totalEarnings = realCompletedJobs.reduce((acc: number, curr: any) => acc + (curr.totalPrice || 0), 0);

  // ---- Handlers ----
  const resetAddModal = () => {
    setNewServiceName(""); setNewServiceType("Cleaning"); setNewServiceDesc("");
    setNewServiceActive(true); setNewServiceExperience("2"); setNewServiceRemark("");
    setNewServiceAddress(""); setNewServiceLat(null); setNewServiceLng(null);
    setNewOfferedServices([{ serviceTypeName: "Standard", price: "50" }]);
    setNewAvailability([{ day: "Monday", slots: [{ from: "09:00 AM", to: "05:00 PM" }] }]);
    if (addCoverPreview) URL.revokeObjectURL(addCoverPreview);
    setAddCoverImage(null); setAddCoverPreview(null);
    setShowAddMap(false); addMapInstance.current = null; addMarkerRef.current = null;
  };

  const handleAddServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) { triggerNotification("Please enter a service name", "error"); return; }
    if (!newServiceAddress.trim()) { triggerNotification("Please pick a location on the map", "error"); return; }
    if (newOfferedServices.some(s => !s.serviceTypeName.trim() || !s.price)) {
      triggerNotification("Please complete all pricing tiers", "error"); return;
    }
    try {
      const payload: Record<string, any> = {
        serviceName: newServiceName.trim(),
        serviceType: newServiceType,
        address: newServiceAddress,
        ...(newServiceLat != null && newServiceLng != null ? { latitude: newServiceLat, longitude: newServiceLng } : {}),
        description: newServiceDesc.trim() || "Premium service description",
        experience: !isNaN(parseInt(newServiceExperience)) && parseInt(newServiceExperience) >= 0 ? parseInt(newServiceExperience) : 2,
        addRemark: newServiceRemark.trim(),
        offered_services: newOfferedServices.map(s => ({ price: parseFloat(s.price) || 0, serviceTypeName: s.serviceTypeName.trim() })),
        serviceStatus: newServiceActive ? "ACTIVE" : "INACTIVE",
        availability: newAvailability.filter(a => a.slots.length > 0),
      };
      const formData = new FormData();
      formData.append("data", JSON.stringify(payload));
      if (addCoverImage) formData.append("coverImage", addCoverImage);
      await createService(formData).unwrap();
      triggerNotification("Service created successfully!");
      setShowAddServiceModal(false);
      resetAddModal();
      refetchServices();
      refetchStats();
    } catch (err: any) {
      triggerNotification(err?.data?.message || "Failed to create service", "error");
    }
  };

  const [confirmModal, setConfirmModal] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  const handleDeleteService = (serviceId: string) => {
    setConfirmModal({
      title: "Delete Service",
      message: "Are you sure you want to delete this service? This action cannot be undone.",
      onConfirm: async () => {
        try {
          await deleteService(serviceId).unwrap();
          triggerNotification("Service removed successfully.");
          refetchServices();
          refetchStats();
        } catch {
          triggerNotification("Failed to delete service", "error");
        } finally {
          setConfirmModal(null);
        }
      },
    });
  };

  const handleEditClick = (service: any) => {
    setEditingServiceId(service.id || service._id);
    setEditServiceName(service.serviceName || service.name || "");
    setEditServiceType(service.serviceType || "Cleaning");
    setEditServiceDesc(service.description || "");
    setEditServiceActive(service.serviceStatus === "ACTIVE");
    setEditServiceExperience((service.experience !== undefined && service.experience !== null ? service.experience : 2).toString());
    setEditServiceRemark(service.addRemark || "");
    setEditServiceAddress(service.address || "");
    setEditServiceLat(service.latitude ?? null);
    setEditServiceLng(service.longitude ?? null);
    setEditCoverPreview(service.coverImage || null);
    setEditCoverImage(null);
    const os = Array.isArray(service.offered_services) && service.offered_services.length > 0
      ? service.offered_services.map((s: any) => ({ serviceTypeName: s.serviceTypeName || "Standard", price: (s.price || 50).toString() }))
      : [{ serviceTypeName: "Standard", price: "50" }];
    setEditOfferedServices(os);
    const av = Array.isArray(service.availability) && service.availability.length > 0
      ? service.availability.map((a: any) => ({ day: a.day, slots: Array.isArray(a.slots) ? a.slots : [{ from: "09:00 AM", to: "05:00 PM" }] }))
      : [{ day: "Monday", slots: [{ from: "09:00 AM", to: "05:00 PM" }] }];
    setEditAvailability(av);
    setShowEditMap(false); editMapInstance.current = null; editMarkerRef.current = null;
    setShowEditServiceModal(true);
  };

  const handleEditServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingServiceId) return;
    if (!editServiceAddress.trim()) { triggerNotification("Please pick a location on the map", "error"); return; }
    if (editOfferedServices.some(s => !s.serviceTypeName.trim() || !s.price)) {
      triggerNotification("Please complete all pricing tiers", "error"); return;
    }
    try {
      const payload: Record<string, any> = {
        serviceName: editServiceName.trim(),
        serviceType: editServiceType,
        address: editServiceAddress,
        ...(editServiceLat != null && editServiceLng != null ? { latitude: editServiceLat, longitude: editServiceLng } : {}),
        description: editServiceDesc.trim() || "Premium service description",
        experience: !isNaN(parseInt(editServiceExperience)) && parseInt(editServiceExperience) >= 0 ? parseInt(editServiceExperience) : 2,
        addRemark: editServiceRemark.trim(),
        offered_services: editOfferedServices.map(s => ({ price: parseFloat(s.price) || 0, serviceTypeName: s.serviceTypeName.trim() })),
        serviceStatus: editServiceActive ? "ACTIVE" : "INACTIVE",
        availability: editAvailability.filter(a => a.slots.length > 0),
      };
      const formData = new FormData();
      formData.append("data", JSON.stringify(payload));
      if (editCoverImage) formData.append("coverImage", editCoverImage);
      await updateServiceMutation({ serviceId: editingServiceId, body: formData }).unwrap();
      triggerNotification("Service updated successfully!");
      setShowEditServiceModal(false);
      refetchServices();
      refetchStats();
    } catch (err: any) {
      triggerNotification(err?.data?.message || "Failed to update service", "error");
    }
  };

  const handleAcceptJob = async (bookingId: string) => {
    try {
      await acceptBooking(bookingId).unwrap();
      triggerNotification("Job request accepted!");
      refetchBookings();
      refetchStats();
      setJobsActiveSubTab("accepted"); // Align with CONFIRMED status filter
    } catch (err: any) {
      triggerNotification(err?.data?.message || "Failed to accept booking", "error");
    }
  };

  const handleRejectJob = (bookingId: string) => {
    setConfirmModal({
      title: "Decline Job Request",
      message: "Are you sure you want to decline this job request?",
      onConfirm: async () => {
        try {
          await rejectBooking(bookingId).unwrap();
          triggerNotification("Job request declined.");
          refetchBookings();
          refetchStats();
        } catch (err: any) {
          triggerNotification(err?.data?.message || "Failed to reject booking", "error");
        } finally {
          setConfirmModal(null);
        }
      },
    });
  };

  const handleStartInProgressJob = async (bookingId: string) => {
    try {
      await inProgressBooking(bookingId).unwrap();
      triggerNotification("Job is now in working process!");
      refetchBookings();
      refetchStats();
      setJobsActiveSubTab("ongoing");
    } catch (err: any) {
      triggerNotification(err?.data?.message || "Failed to start job", "error");
    }
  };

  const handleCompleteJobByProvider = async (bookingId: string) => {
    try {
      await completeBooking(bookingId).unwrap();
      triggerNotification("Job completed successfully!");
      refetchBookings();
      refetchStats();
      setJobsActiveSubTab("completed");
    } catch (err: any) {
      triggerNotification(err?.data?.message || "Failed to complete job", "error");
    }
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofVideoFile(file);
      const url = URL.createObjectURL(file);
      setProofVideoPreview(url);
    }
  };

  const handleRemoveVideo = () => {
    if (proofVideoPreview) URL.revokeObjectURL(proofVideoPreview);
    setProofVideoFile(null);
    setProofVideoPreview(null);
  };

  const closeProofModals = () => {
    setShowStartProofModal(false);
    setShowEndProofModal(false);
    setSelectedJobForProof(null);
    handleRemoveVideo();
    setProofRemarks("");
  };

  const handleStartProofSubmit = async () => {
    if (!selectedJobForProof) return;
    if (!proofVideoFile) {
      triggerNotification("Please select a video proof", "error");
      return;
    }
    setIsUploadingProof(true);
    try {
      const formData = new FormData();
      formData.append("recordProofVideoStarting", proofVideoFile);
      
      // 1. Upload video
      await uploadStartingProof({ bookingId: selectedJobForProof.id, body: formData }).unwrap();
      triggerNotification("Starting proof video uploaded successfully!");
      
      // 2. Automate transition to in-progress status (like mobile working process)
      await inProgressBooking(selectedJobForProof.id).unwrap();
      triggerNotification("Service marked as In Working!");
      
      refetchBookings();
      refetchStats();
      closeProofModals();
      setJobsActiveSubTab("ongoing");
    } catch (err: any) {
      console.error(err);
      triggerNotification(err?.data?.message || "Proof submission failed", "error");
    } finally {
      setIsUploadingProof(false);
    }
  };

  const handleEndProofSubmit = async () => {
    if (!selectedJobForProof) return;
    if (!proofVideoFile) {
      triggerNotification("Please select a video proof", "error");
      return;
    }
    setIsUploadingProof(true);
    try {
      const formData = new FormData();
      formData.append("recordProofVideoEnding", proofVideoFile);
      
      // 1. Upload video
      await uploadEndingProof({ bookingId: selectedJobForProof.id, body: formData }).unwrap();
      triggerNotification("Ending proof video uploaded successfully!");
      
      // 2. Automate transition to complete status
      await completeBooking(selectedJobForProof.id).unwrap();
      triggerNotification("Proof submitted! Job marked as completed.");
      
      refetchBookings();
      refetchStats();
      closeProofModals();
      setJobsActiveSubTab("completed");
    } catch (err: any) {
      console.error(err);
      triggerNotification(err?.data?.message || "Proof submission failed", "error");
    } finally {
      setIsUploadingProof(false);
    }
  };

  const handleJobCardPrimaryAction = (job: any) => {
    if (job.bookingStatus === "NEED_ACCEPT") {
      handleAcceptJob(job.id);
    } else if (job.bookingStatus === "CONFIRMED") {
      const hasStartingVideo = job.startAndEndProofVideos?.recordProofVideoStarting && job.startAndEndProofVideos.recordProofVideoStarting.length > 0;
      if (hasStartingVideo) {
        handleStartInProgressJob(job.id);
      } else {
        setSelectedJobForProof(job);
        setProofVideoFile(null);
        setProofVideoPreview(null);
        setShowStartProofModal(true);
      }
    } else if (job.bookingStatus === "IN_WORKING" || job.bookingStatus === "COMPLETED_BY_PROVIDER") {
      const hasEndingVideo = job.startAndEndProofVideos?.recordProofVideoEnding && job.startAndEndProofVideos.recordProofVideoEnding.length > 0;
      if (hasEndingVideo) {
        handleCompleteJobByProvider(job.id);
      } else {
        setSelectedJobForProof(job);
        setProofVideoFile(null);
        setProofVideoPreview(null);
        setProofRemarks("");
        setShowEndProofModal(true);
      }
    } else if (job.bookingStatus === "COMPLETED") {
      onViewJobDetails(job.id);
    }
  };

  const getJobDateStr = (job: any) => {
    const rawDate = job.date || job.bookingDate || job.createdAt;
    if (!rawDate) return null;
    const rawDateStr = rawDate.toString();
    if (rawDateStr.toLowerCase().includes("today")) {
      const d = new Date();
      return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
    }
    if (rawDateStr.toLowerCase().includes("tomorrow")) {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
    }
    const d = new Date(rawDate);
    if (!isNaN(d.getTime())) {
      return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
    }
    return null;
  };

  const calendarSchedules: Record<string, any[]> = {};
  jobs.forEach((job: any) => {
    if (job.bookingStatus === "REJECTED" || job.bookingStatus === "DECLINED") return;
    const dateStr = getJobDateStr(job);
    if (dateStr) {
      if (!calendarSchedules[dateStr]) {
        calendarSchedules[dateStr] = [];
      }
      calendarSchedules[dateStr].push(job);
    }
  });

  // ---- Shared input class ----
  const inputCls = "w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-blue-500 bg-zinc-50/50 outline-none text-sm font-medium text-zinc-800";
  const labelCls = "block text-[11px] font-bold text-zinc-500 mb-1 uppercase tracking-wider";

  // ---- Availability editor (shared) ----
  const AvailabilityEditor = ({
    availability, setAvailability,
  }: { availability: { day: string; slots: { from: string; to: string }[] }[]; setAvailability: (v: any) => void }) => (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className={labelCls}>Availability</label>
        <select className="text-xs font-bold text-blue-600 border-none outline-none bg-transparent cursor-pointer"
          onChange={(e) => {
            const day = e.target.value;
            if (day && !availability.find(a => a.day === day)) {
              setAvailability([...availability, { day, slots: [{ from: "09:00 AM", to: "05:00 PM" }] }]);
            }
            e.target.value = "";
          }}>
          <option value="">+ Add Day</option>
          {DAYS.filter(d => !availability.find(a => a.day === d)).map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      <div className="space-y-2">
        {availability.map((avail, dayIdx) => (
          <div key={dayIdx} className="border border-zinc-200 rounded-xl p-3 bg-zinc-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-zinc-800">{avail.day}</span>
              <div className="flex gap-3">
                <button type="button" className="text-xs font-bold text-blue-600"
                  onClick={() => { const a = [...availability]; a[dayIdx].slots.push({ from: "09:00 AM", to: "05:00 PM" }); setAvailability(a); }}>
                  + Slot
                </button>
                <button type="button" className="text-xs font-bold text-red-400"
                  onClick={() => setAvailability(availability.filter((_, i) => i !== dayIdx))}>
                  Remove
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              {avail.slots.map((slot, slotIdx) => (
                <div key={slotIdx} className="flex gap-2 items-center">
                  <input type="text" placeholder="09:00 AM" value={slot.from}
                    onChange={(e) => { const a = [...availability]; a[dayIdx].slots[slotIdx].from = e.target.value; setAvailability(a); }}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-zinc-200 text-xs text-zinc-700 bg-white outline-none focus:border-blue-500" />
                  <span className="text-xs text-zinc-400">to</span>
                  <input type="text" placeholder="05:00 PM" value={slot.to}
                    onChange={(e) => { const a = [...availability]; a[dayIdx].slots[slotIdx].to = e.target.value; setAvailability(a); }}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-zinc-200 text-xs text-zinc-700 bg-white outline-none focus:border-blue-500" />
                  {avail.slots.length > 1 && (
                    <button type="button"
                      onClick={() => { const a = [...availability]; a[dayIdx].slots = a[dayIdx].slots.filter((_, i) => i !== slotIdx); setAvailability(a); }}
                      className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-50 text-red-400 text-xs font-bold">
                      x
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ---- Pricing tiers editor (shared) ----
  const PricingEditor = ({
    offered, setOffered,
  }: { offered: { serviceTypeName: string; price: string }[]; setOffered: (v: any) => void }) => (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className={labelCls}>Pricing Tiers *</label>
        <button type="button" className="text-xs font-bold text-blue-600"
          onClick={() => setOffered([...offered, { serviceTypeName: "", price: "50" }])}>
          + Add Tier
        </button>
      </div>
      <div className="space-y-2">
        {offered.map((os, idx) => (
          <div key={idx} className="flex gap-2 items-center">
            <input type="text" placeholder="e.g. 2 BHK" value={os.serviceTypeName}
              onChange={(e) => { const a = [...offered]; a[idx].serviceTypeName = e.target.value; setOffered(a); }}
              className="flex-1 px-3 py-2.5 rounded-xl border border-zinc-200 focus:border-blue-500 bg-zinc-50 outline-none text-sm font-medium text-zinc-800" />
            <div className="relative flex items-center">
              <span className="absolute left-3 text-sm font-bold text-zinc-400">$</span>
              <input type="number" placeholder="50" value={os.price}
                onChange={(e) => { const a = [...offered]; a[idx].price = e.target.value; setOffered(a); }}
                className="w-24 pl-7 pr-3 py-2.5 rounded-xl border border-zinc-200 focus:border-blue-500 bg-zinc-50 outline-none text-sm font-medium text-zinc-800" />
            </div>
            {offered.length > 1 && (
              <button type="button" onClick={() => setOffered(offered.filter((_, i) => i !== idx))}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 text-red-400 font-bold">
                x
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // ---- Views ----
  const renderHomeOverview = () => {
    const newRequests = jobs.filter((j: any) => j.bookingStatus === "NEED_ACCEPT");
    
    // Greet text dynamically based on time of day
    const getGreeting = () => {
      const hr = new Date().getHours();
      if (hr < 12) return "Good Morning";
      if (hr < 17) return "Good Afternoon";
      return "Good Evening";
    };

    // Calculate booked dates for selected month & year
    const currentMonth = calendarDate.getMonth();
    const currentYear = calendarDate.getFullYear();

    const handlePrevMonth = () => {
      setCalendarDate(new Date(currentYear, currentMonth - 1, 1));
    };

    const handleNextMonth = () => {
      setCalendarDate(new Date(currentYear, currentMonth + 1, 1));
    };

    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    const blankDays = Array(firstDayIndex).fill(null);
    const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);

    return (
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 lg:p-10 pb-24 md:pb-8 w-full max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto space-y-6">

        {/* Welcome Header */}
        <div className="relative overflow-hidden flex items-center justify-between p-6 sm:p-8 rounded-[2rem] bg-gradient-to-br from-blue-900 via-indigo-900 to-indigo-950 text-white shadow-xl shadow-blue-900/20 text-left border border-white/10 mb-8">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-blue-400/20 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-10 -mb-20 w-48 h-48 rounded-full bg-purple-500/20 blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-sm flex items-center gap-2">
              {getGreeting()}, {profName} <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-blue-300 fill-blue-300/30 animate-pulse" />
            </h2>
            <p className="mt-2 text-sm sm:text-base text-blue-100/80 font-medium">
              Ready for today's jobs? Manage your services efficiently.
            </p>
          </div>
          <button 
            onClick={openNotifications}
            className="hidden sm:flex relative z-10 h-14 w-14 rounded-full border border-white/20 bg-white/10 backdrop-blur-md p-3 text-white items-center justify-center shrink-0 hover:bg-white/20 transition-all cursor-pointer shadow-lg shadow-black/10 hover:scale-105 active:scale-95"
            aria-label="Notifications"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-5 h-5 bg-pink-500 text-white rounded-full text-[10px] font-black flex items-center justify-center shadow-md">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Stats Grid Layout */}
        <div className="space-y-4 text-left">
          {/* Card 1: My Services (Full Width) */}
          <button 
            onClick={() => setSubView("services")}
            className="group relative w-full p-6 bg-white/60 backdrop-blur-lg border border-white rounded-[2rem] flex justify-between items-center shadow-lg shadow-zinc-200/40 hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-500 hover:-translate-y-1 overflow-hidden cursor-pointer"
          >
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-indigo-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className="relative z-10 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0 shadow-sm border border-blue-100">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-base sm:text-lg font-black text-zinc-900 tracking-tight">My Services</span>
            </div>
            <span className="relative z-10 text-4xl sm:text-5xl font-black text-zinc-900 pr-2 drop-shadow-sm">{statsRes?.data?.totalServices ?? services.length}</span>
          </button>

          {/* Card 2 & 3: My Jobs and My Earnings (Side by Side) */}
          <div className="grid grid-cols-2 gap-4 lg:gap-6">
            <button 
              onClick={() => setSubView("jobs")}
              className="group relative p-6 bg-white/60 backdrop-blur-lg border border-white rounded-[2rem] flex flex-col justify-between shadow-lg shadow-zinc-200/40 hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-500 hover:-translate-y-1 overflow-hidden cursor-pointer"
            >
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-blue-400/10 to-purple-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative z-10 flex flex-col gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0 shadow-sm border border-blue-100">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm font-black text-zinc-900 tracking-tight">My Jobs</span>
              </div>
              <span className="relative z-10 text-3xl sm:text-4xl font-black text-zinc-900 mt-4 drop-shadow-sm">{statsRes?.data?.totalServicesBookings ?? jobs.length}</span>
            </button>

            <button 
              onClick={() => setSubView("earnings")}
              className="group relative p-6 bg-white/60 backdrop-blur-lg border border-white rounded-[2rem] flex flex-col justify-between shadow-lg shadow-zinc-200/40 hover:shadow-2xl hover:shadow-emerald-900/10 transition-all duration-500 hover:-translate-y-1 overflow-hidden cursor-pointer"
            >
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-emerald-400/10 to-teal-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative z-10 flex flex-col gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl shrink-0 group-hover:scale-110 transition-transform shadow-sm border border-emerald-100">
                  $
                </div>
                <span className="text-sm font-black text-zinc-900 tracking-tight">My Earnings</span>
              </div>
              <span className="relative z-10 text-3xl sm:text-4xl font-black text-zinc-900 mt-4 drop-shadow-sm">${statsRes?.data?.totalPayments ?? totalEarnings}</span>
            </button>
          </div>
        </div>

        {/* Requests banner / "No New Requests Found" status text */}
        {newRequests.length === 0 ? (
          <div className="text-center py-4 text-xs font-bold text-zinc-400 tracking-wide">
            No New Requests Found
          </div>
        ) : (
          <div>
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 text-left">Pending Job Request</h3>
            <div className="bg-blue-600 text-white p-5 sm:p-6 rounded-2xl shadow-lg relative overflow-hidden text-left">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-10 translate-x-10 pointer-events-none" />
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="space-y-1">
                  <span className="inline-block text-[10px] font-black uppercase tracking-widest text-blue-200 bg-white/10 px-2 py-0.5 rounded-full">New Request</span>
                  <h4 className="text-lg font-extrabold text-white leading-tight mt-1">{newRequests[0].property || "Property Service"}</h4>
                  <p className="text-sm font-semibold text-blue-100">{newRequests[0].serviceName || "Service"}</p>
                  <div className="pt-2 space-y-1 text-sm text-blue-100">
                    <p>Location: {newRequests[0].address || "Not provided"}</p>
                    <p>Scheduled: {newRequests[0].date || "Not set"}</p>
                    <p className="text-white font-black text-base pt-1">${newRequests[0].totalPrice} offered</p>
                  </div>
                </div>
                <div className="flex sm:flex-col gap-3 sm:gap-2 sm:w-36 shrink-0">
                  <button onClick={() => handleAcceptJob(newRequests[0].id)}
                    className="flex-1 sm:flex-none py-2 px-4 bg-white text-blue-700 rounded-xl font-bold text-xs hover:bg-blue-50 transition-all text-center cursor-pointer">
                    Accept
                  </button>
                  <button onClick={() => handleRejectJob(newRequests[0].id)}
                    className="flex-1 sm:flex-none py-2 px-4 bg-red-500 text-white rounded-xl font-bold text-xs hover:bg-red-650 transition-all text-center border-transparent cursor-pointer">
                    Decline
                  </button>
                  <button onClick={() => onViewJobDetails(newRequests[0].id)}
                    className="flex-1 sm:flex-none py-2 px-4 border border-white/30 text-white rounded-xl font-bold text-xs hover:bg-white/10 transition-all text-center cursor-pointer">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Calendar Section */}
        <div className="space-y-4 text-left">
          <h3 className="text-sm font-black text-zinc-900 tracking-tight">Calendar</h3>
          
          <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
            {/* Calendar Navigation */}
            <div className="flex items-center justify-between mb-6">
              <button 
                onClick={handlePrevMonth} 
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-600 transition-colors cursor-pointer"
                aria-label="Previous Month"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h4 className="text-sm font-black text-zinc-800 tracking-tight uppercase">
                {calendarDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </h4>
              <button 
                onClick={handleNextMonth} 
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-600 transition-colors cursor-pointer"
                aria-label="Next Month"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-y-3.5 text-center items-center justify-items-center">
              {/* Days Header */}
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase">
                  {day}
                </div>
              ))}

              {/* Blank days at the beginning of the month */}
              {blankDays.map((_, idx) => (
                <div key={`blank-${idx}`} className="w-10 h-10" />
              ))}

              {/* Month Days */}
              {daysArray.map((day) => {
                const dayDateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                const dayJobs = calendarSchedules[dayDateStr] || [];
                const isCompleted = dayJobs.length > 0 && dayJobs.some((j: any) => j.bookingStatus?.toLowerCase() === "completed");
                const hasBooking = dayJobs.length > 0 && !isCompleted;
                const isToday = new Date().getDate() === day && new Date().getMonth() === currentMonth && new Date().getFullYear() === currentYear;

                return (
                  <button
                    key={`day-${day}`}
                    onClick={() => {
                      if (dayJobs.length > 0) {
                        setSelectedCalendarDay(new Date(currentYear, currentMonth, day));
                      }
                    }}
                    className={`w-10 h-10 flex items-center justify-center text-xs font-bold transition-all ${
                      dayJobs.length > 0 ? "cursor-pointer" : ""
                    } ${
                      isCompleted
                        ? "bg-green-600 text-white rounded-2xl shadow-sm"
                        : hasBooking
                        ? "bg-blue-600 text-white rounded-2xl shadow-sm"
                        : isToday
                        ? "bg-blue-50 text-blue-600 border border-blue-200 rounded-2xl"
                        : "text-zinc-600 hover:bg-zinc-50 rounded-xl"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderServicesView = () => {
    const filtered = services.filter((s: any) => {
      const nameMatch = (s.serviceName || s.name || "").toLowerCase().includes(searchServiceQuery.toLowerCase());
      const typeMatch = (s.serviceType || s.type || "").toLowerCase().includes(searchServiceQuery.toLowerCase());
      const statusMatch = filterServiceStatus === "All" || s.serviceStatus === filterServiceStatus;
      return (nameMatch || typeMatch) && statusMatch;
    });

    return (
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 lg:p-10 pb-24 md:pb-8 w-full max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => setSubView(null)} aria-label="Go back"
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-zinc-200 hover:bg-zinc-50 transition-colors shrink-0">
            <BackArrowIcon />
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">My Services</h2>
            <p className="text-xs text-zinc-400 mt-0.5">{services.length} service{services.length !== 1 ? "s" : ""} listed</p>
          </div>
        </div>

        {/* Search and filter */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <input type="text" placeholder="Search by name or type..."
              value={searchServiceQuery} onChange={(e) => setSearchServiceQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 focus:border-blue-500 bg-white outline-none text-sm font-medium text-zinc-800 shadow-sm" />
            <div className="absolute left-3.5 top-3.5"><SearchIcon /></div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 shrink-0">
            {["All", "ACTIVE", "INACTIVE", "PENDING"].map((s) => (
              <button key={s} onClick={() => handleFilterClick(s as any)}
                className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all shrink-0 ${filterServiceStatus === s
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"}`}>
                {s === "ACTIVE" ? "Active" : s === "INACTIVE" ? "Inactive" : s === "PENDING" ? "Pending" : "All"}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-zinc-400">
            <p className="text-base font-bold">No services found</p>
            <p className="text-sm mt-1">Try a different search or add a new service.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((service: any) => {
              const sName = service.serviceName || service.name || "Unnamed Service";
              const sType = service.serviceType || service.type || "General";
              const sStatus = service.serviceStatus || "ACTIVE";
              const sBookings = service.bookings || 0;
              const sRating = service.rating || 0.0;
              const sPrices = Array.isArray(service.offered_services) && service.offered_services.length > 0
                ? service.offered_services
                : [{ serviceTypeName: sType, price: service.price || 50 }];

              return (
                <div key={service.id || service._id}
                  className="bg-white border border-zinc-200 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden">
                  {service.coverImage ? (
                    <div className="h-36 w-full overflow-hidden bg-zinc-100 shrink-0">
                      <img src={service.coverImage} alt={sName} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-36 w-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center shrink-0">
                      <svg className="w-10 h-10 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                  )}

                  <div className="p-4 flex flex-col flex-1 gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-zinc-900">{sName}</h3>
                        <p className="text-[11px] text-zinc-400 font-semibold uppercase tracking-wider mt-0.5">{sType}</p>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 border ${
                        sStatus === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : sStatus === "INACTIVE" ? "bg-zinc-100 text-zinc-500 border-zinc-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                        {sStatus === "ACTIVE" ? "Active" : sStatus === "INACTIVE" ? "Inactive" : "Pending"}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {sPrices.slice(0, 3).map((p: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-zinc-500">{p.serviceTypeName}</span>
                          <span className="font-bold text-zinc-900">${p.price}</span>
                        </div>
                      ))}
                      {sPrices.length > 3 && <p className="text-[10px] text-zinc-400">+{sPrices.length - 3} more tiers</p>}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-100 mt-auto">
                      <div className="flex items-center gap-3 text-xs text-zinc-500">
                        <span className="flex items-center gap-1"><CalendarIcon />{sBookings} bookings</span>
                        <span className="flex items-center gap-1"><StarIcon />{Number(sRating).toFixed(1)}</span>
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => handleEditClick(service)} aria-label="Edit"
                          className="p-2 rounded-lg hover:bg-blue-50 transition-colors"><EditIcon /></button>
                        <button onClick={() => handleDeleteService(service.id || service._id)} aria-label="Delete"
                          className="p-2 rounded-lg hover:bg-red-50 transition-colors"><TrashIcon /></button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add button */}
        <button onClick={() => setShowAddServiceModal(true)}
          className="fixed bottom-24 right-6 sm:right-10 md:bottom-10 z-40 h-12 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl flex items-center gap-2 shadow-xl active:scale-[0.97] transition-all font-bold text-sm"
          aria-label="Add new service">
          <span className="text-xl leading-none font-light">+</span>
          Add Service
        </button>
      </div>
    );
  };

  const renderJobsView = () => {
    const filteredJobs = jobs.filter((job: any) => {
      if (jobsActiveSubTab === "new") return job.bookingStatus === "NEED_ACCEPT";
      if (jobsActiveSubTab === "accepted") return job.bookingStatus === "CONFIRMED";
      if (jobsActiveSubTab === "ongoing") return job.bookingStatus === "IN_WORKING" || job.bookingStatus === "COMPLETED_BY_PROVIDER";
      if (jobsActiveSubTab === "completed") return job.bookingStatus === "COMPLETED";
      return false;
    });

    const statusMap: Record<string, { label: string; color: string }> = {
      NEED_ACCEPT: { label: "New Request", color: "bg-amber-50 text-amber-700 border-amber-200" },
      CONFIRMED: { label: "Accepted", color: "bg-blue-50 text-blue-700 border-blue-200" },
      IN_WORKING: { label: "Ongoing", color: "bg-purple-50 text-purple-700 border-purple-200" },
      COMPLETED_BY_PROVIDER: { label: "Ongoing", color: "bg-purple-50 text-purple-700 border-purple-200" },
      COMPLETED: { label: "Completed", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    };

    return (
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 lg:p-10 pb-24 md:pb-8 w-full max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setSubView(null)} aria-label="Go back"
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-zinc-200 hover:bg-zinc-50 transition-colors shrink-0 cursor-pointer">
              <BackArrowIcon />
            </button>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">My Jobs</h2>
              <p className="text-xs text-zinc-400 mt-0.5">{filteredJobs.length} job{filteredJobs.length !== 1 ? "s" : ""} in this view</p>
            </div>
          </div>
          <div className="flex border border-zinc-200 rounded-xl overflow-hidden text-sm bg-white shrink-0">
            {[
              { id: "new", label: "New Request" },
              { id: "accepted", label: "Accepted" },
              { id: "ongoing", label: "Ongoing" },
              { id: "completed", label: "Completed" }
            ].map((tab) => (
              <button key={tab.id} onClick={() => {
                setJobsActiveSubTab(tab.id as any);
                refetchBookings();
              }}
                className={`px-4 py-2.5 font-semibold transition-all cursor-pointer ${jobsActiveSubTab === tab.id ? "bg-blue-600 text-white" : "text-zinc-600 hover:bg-zinc-50"}`}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {isFetchingBookings ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-20 text-zinc-400">
            <p className="text-base font-bold">No jobs here</p>
            <p className="text-sm mt-1">
              {jobsActiveSubTab === "new" ? "No pending job requests at the moment."
               : jobsActiveSubTab === "accepted" ? "No accepted jobs at the moment."
               : jobsActiveSubTab === "ongoing" ? "No ongoing jobs right now."
               : "No completed jobs yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredJobs.map((job: any) => {
              const badge = statusMap[job.bookingStatus] || { label: job.bookingStatus, color: "bg-zinc-100 text-zinc-500 border-zinc-200" };
              return (
                <div key={job.id} className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col gap-4">
                  <div className="flex justify-between items-start gap-2 text-left">
                    <div className="min-w-0 flex-1">
                      <h3 
                        onClick={() => onViewJobDetails(job.id)}
                        className="text-base font-black text-zinc-900 truncate hover:underline cursor-pointer text-left"
                      >
                        {job.serviceName || job.offeredService?.serviceTypeName || "General Service"}
                        
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5 text-left">{job.property || "Property"}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-black text-zinc-900">${job.totalPrice || job.price || "0"}</p>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border mt-1 ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 bg-zinc-50 rounded-xl p-3 text-xs text-zinc-650 font-semibold text-left">
                    <div className="flex items-start gap-2"><PinIcon /><span className="flex-1">{job.address || "Address not provided"}</span></div>
                    <div className="flex items-center gap-2"><CalendarIcon /><span>{job.date || "Date not set"}</span></div>
                    {job.user?.fullName && (
                      <div className="flex items-center gap-2">
                        <svg className="w-3 h-3 text-zinc-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>Owner: {job.user.fullName}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2.5 w-full mt-auto">
                    {job.bookingStatus === "NEED_ACCEPT" && (
                      <div className="flex gap-3 w-full">
                        <button onClick={() => handleAcceptJob(job.id)}
                          className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all text-center cursor-pointer">
                          Accept
                        </button>
                        <button onClick={() => handleRejectJob(job.id)}
                          className="flex-1 py-2.5 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-xl text-sm font-bold transition-all text-center cursor-pointer">
                          Decline
                        </button>
                      </div>
                    )}
                    {job.bookingStatus === "CONFIRMED" && (
                      <button onClick={() => handleJobCardPrimaryAction(job)}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all text-center cursor-pointer">
                        In Process
                      </button>
                    )}
                    {(job.bookingStatus === "IN_WORKING" || job.bookingStatus === "COMPLETED_BY_PROVIDER") && (
                      <div className="flex flex-col gap-2 w-full">
                        <button onClick={() => handleJobCardPrimaryAction(job)}
                          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all text-center cursor-pointer">
                          Mark as Completed
                        </button>
                        <button onClick={() => onMessageOwner(job.user?.id || "owner-1", job.user?.fullName || "Owner")}
                          className="w-full py-2.5 border border-blue-600 hover:bg-blue-50 text-blue-700 rounded-xl text-sm font-bold transition-all text-center cursor-pointer">
                          Message Owner
                        </button>
                      </div>
                    )}
                    {job.bookingStatus === "COMPLETED" && (
                      <button onClick={() => handleJobCardPrimaryAction(job)}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all text-center cursor-pointer">
                        View Details
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ---- Shared modal field components ----
  const serviceTypes = ["Cleaning", "Plumbing", "Electrical", "Gardening", "Security", "Painting", "Carpentry", "HVAC", "Others"];

  const MapPicker = ({
    address, lat, lng,
    showMap, setShowMap,
    mapRef, mapInstance, markerRef,
    onPick,
  }: any) => {
    const [isDetecting, setIsDetecting] = useState(false);

    useEffect(() => {
      if (showMap) {
        setTimeout(() => {
          loadGoogleMaps(() => {
            if (!mapInstance.current) {
              initMap(mapRef, mapInstance, markerRef, lat || 23.8103, lng || 90.4125, onPick);
            }
          });
        }, 100);
      }
    }, [showMap]);

    const handleDetectLocation = () => {
      setIsDetecting(true);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const currentLat = position.coords.latitude;
            const currentLng = position.coords.longitude;
            
            loadGoogleMaps(() => {
              const google = (window as any).google;
              const geocoder = new google.maps.Geocoder();
              geocoder.geocode({ location: { lat: currentLat, lng: currentLng } }, (results: any, status: any) => {
                const addr = status === "OK" && results && results[0]
                  ? results[0].formatted_address
                  : `${currentLat.toFixed(5)}, ${currentLng.toFixed(5)}`;
                
                onPick(currentLat, currentLng, addr);
                setIsDetecting(false);
                
                // Always show the map after auto-detecting
                setShowMap(true);
                setTimeout(() => {
                  if (mapInstance.current) {
                    const newCenter = { lat: currentLat, lng: currentLng };
                    mapInstance.current.setCenter(newCenter);
                    if (markerRef.current) {
                      markerRef.current.setPosition(newCenter);
                    }
                  } else {
                    loadGoogleMaps(() => {
                      if (!mapInstance.current) {
                        initMap(mapRef, mapInstance, markerRef, currentLat, currentLng, onPick);
                      }
                    });
                  }
                }, 100);
              });
            });
          },
          (error) => {
            console.error("Geolocation error:", error);
            setIsDetecting(false);
            triggerNotification("Could not detect your location automatically. Please select it on the map.", "error");
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      } else {
        setIsDetecting(false);
        triggerNotification("Geolocation is not supported by your browser.", "error");
      }
    };

    const handlePickLocationClick = () => {
      setShowMap(true);
      setTimeout(() => {
        loadGoogleMaps(() => {
          if (!mapInstance.current) {
            initMap(mapRef, mapInstance, markerRef, lat || 23.8103, lng || 90.4125, onPick);
          }
        });
      }, 100);
    };

    return (
      <div>
        <label className={labelCls}>Location *</label>
        <div className="flex gap-2 items-center mb-2">
          <input type="text" readOnly placeholder="Click Pick Location to open the map"
            value={address}
            className={`${inputCls} cursor-default flex-1`} />
          <button type="button"
            onClick={handleDetectLocation}
            disabled={isDetecting}
            className="px-3 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-500 text-white text-sm font-bold transition-all shrink-0 flex items-center gap-1.5 active:scale-[0.98]">
            {isDetecting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 0V3m0 18v-5M4 12H9m11 0h-5" />
              </svg>
            )}
            <span>{isDetecting ? "Detecting..." : "Auto Detect"}</span>
          </button>
          <button type="button"
            onClick={handlePickLocationClick}
            className="px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-all shrink-0 active:scale-[0.98]">
            Pick Location
          </button>
        </div>
        {showMap && (
          <div className="rounded-2xl overflow-hidden border border-zinc-200 shadow-sm">
            <div ref={mapRef} className="w-full h-52" />
            {address && (
              <div className="px-3 py-2 bg-blue-50 border-t border-blue-100 text-xs font-semibold text-blue-700">
                {address} {lat && <span className="text-blue-400 ml-1">({lat.toFixed(4)}, {lng?.toFixed(4)})</span>}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const CoverImagePicker = ({ preview, onFile }: { preview: string | null; onFile: (f: File, url: string) => void }) => (
    <div>
      <label className={labelCls}>Cover Image (Optional)</label>
      <label className="flex flex-col items-center justify-center border border-dashed border-zinc-300 rounded-xl bg-zinc-50 cursor-pointer hover:border-blue-500 transition-colors w-full aspect-[16/9] relative overflow-hidden">
        <input type="file" accept="image/*" className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              const file = e.target.files[0];
              onFile(file, URL.createObjectURL(file));
            }
          }} />
        {preview ? (
          <div className="absolute inset-0 w-full h-full">
            <img src={preview} alt="Cover Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center text-xs font-extrabold text-white">
              Change Image
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-4">
            <svg className="w-8 h-8 text-zinc-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs font-medium text-zinc-500">Upload Cover Image (16:9 Landscape)</span>
          </div>
        )}
      </label>
    </div>
  );

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return dateStr;
    }
  };

  const renderEarningsView = () => {
    const stats = earningsStatsResponse?.data || {
      totalEarnings: 0,
      totalBookings: 0,
      earningsTrend: [],
      bookingsTrend: [],
    };

    const transactions = Array.isArray(txResponse?.data) ? txResponse.data : [];
    const providerTx = transactions.map((tx: any) => {
      const isIncoming =
        tx.providerId === user?.id ||
        tx.providerId === (user as any)?._id;

      let title = tx.service_booking?.serviceName || tx.description || "Service Booking";
      let subtitle = isIncoming
        ? `Client: ${tx.user?.fullName || "N/A"}`
        : `For Property: ${tx.service_booking?.property || "My Property"}`;

      return {
        ...tx,
        isIncoming,
        title,
        subtitle,
      };
    }).filter((t: any) => t.serviceType === "SERVICE" && t.isIncoming);

    return (
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 lg:p-10 pb-24 md:pb-8 w-full max-w-4xl mx-auto space-y-6 text-left font-sans">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSubView(null)}
            className="flex items-center justify-center w-10 h-10 rounded-2xl bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-650 cursor-pointer shadow-sm transition-all"
          >
            <BackArrowIcon />
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-zinc-950 tracking-tight">My Earnings</h2>
            <p className="text-xs text-zinc-400 font-bold mt-0.5">Track your service revenues and payouts</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-6 bg-white border border-zinc-150 rounded-3xl shadow-sm space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Total Revenue</span>
            <div className="text-3xl font-black text-zinc-950">
              ${stats.totalEarnings ?? 0}
            </div>
            <p className="text-[10px] text-zinc-450 font-semibold">Total service earnings accumulated</p>
          </div>

          <div className="p-6 bg-white border border-zinc-150 rounded-3xl shadow-sm space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Completed Jobs</span>
            <div className="text-3xl font-black text-zinc-950">
              {stats.totalBookings ?? 0}
            </div>
            <p className="text-[10px] text-zinc-450 font-semibold">Total completed paid requests</p>
          </div>
        </div>

        <div className="bg-white border border-zinc-150 rounded-3xl p-6 shadow-sm space-y-5">
          <div>
            <h3 className="text-base font-black text-zinc-950">Payouts History</h3>
            <p className="text-xs text-zinc-400 font-semibold mt-0.5">List of incoming payments from clients</p>
          </div>

          {providerTx.length === 0 ? (
            <div className="text-center py-10 text-xs font-bold text-zinc-400 tracking-wide bg-zinc-50 border border-dashed border-zinc-200 rounded-2xl">
              No transactions recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {providerTx.map((tx: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center py-4 first:pt-0 last:pb-0">
                  <div className="flex gap-3 items-center">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm shrink-0">
                      $
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 leading-snug">{tx.title}</h4>
                      <p className="text-xs text-zinc-400 font-semibold mt-0.5">{tx.subtitle}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-emerald-600">+${tx.amount}</div>
                    <span className="text-[10px] text-zinc-400 font-bold">{formatDate(tx.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ---- Main render ----
  return (
    <div className="flex-1 flex flex-col overflow-hidden w-full h-full relative">
      {subView === null && renderHomeOverview()}
      {subView === "services" && renderServicesView()}
      {subView === "jobs" && renderJobsView()}
      {subView === "earnings" && renderEarningsView()}

      {/* ---- ADD SERVICE MODAL ---- */}
      {showAddServiceModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-sm">
          <div className="w-full max-w-[640px] bg-white border border-zinc-200 rounded-2xl shadow-2xl flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-zinc-100 shrink-0">
              <div>
                <h3 className="text-lg font-black text-zinc-900">Add a New Service</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Fill in all the details below to create your listing.</p>
              </div>
              <button onClick={() => { setShowAddServiceModal(false); resetAddModal(); }}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-500 font-bold transition-colors" aria-label="Close">
                x
              </button>
            </div>

            <form onSubmit={handleAddServiceSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

              {/* Name + Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Service Name *</label>
                  <input type="text" required placeholder="e.g. Premium Home Cleaning"
                    value={newServiceName} onChange={(e) => setNewServiceName(e.target.value)}
                    className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Service Type *</label>
                  <select value={newServiceType} onChange={(e) => setNewServiceType(e.target.value)} className={inputCls}>
                    {serviceTypes.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Experience + Active */}
              <div className="grid grid-cols-2 gap-4 items-end">
                <div>
                  <label className={labelCls}>Years of Experience</label>
                  <input type="number" min="0" max="50" placeholder="2"
                    value={newServiceExperience} onChange={(e) => setNewServiceExperience(e.target.value)}
                    className={inputCls} />
                </div>
                <div className="flex items-center justify-between px-4 py-3 border border-zinc-200 bg-zinc-50 rounded-xl">
                  <span className="text-sm font-semibold text-zinc-700">Active Immediately</span>
                  <button type="button" onClick={() => setNewServiceActive(!newServiceActive)}
                    className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${newServiceActive ? "bg-emerald-500" : "bg-zinc-300"}`}>
                    <span className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${newServiceActive ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className={labelCls}>Description *</label>
                <textarea required placeholder="Describe your service in detail..." rows={2}
                  value={newServiceDesc} onChange={(e) => setNewServiceDesc(e.target.value)}
                  className={`${inputCls} resize-none`} />
              </div>

              {/* Remark */}
              <div>
                <label className={labelCls}>Add Remark (Optional)</label>
                <input type="text" placeholder="e.g. Bring own cleaning tools."
                  value={newServiceRemark} onChange={(e) => setNewServiceRemark(e.target.value)}
                  className={inputCls} />
              </div>

              {/* Pricing tiers */}
              <PricingEditor offered={newOfferedServices} setOffered={setNewOfferedServices} />

              {/* Availability */}
              <AvailabilityEditor availability={newAvailability} setAvailability={setNewAvailability} />

              {/* Location */}
              <MapPicker
                address={newServiceAddress} lat={newServiceLat} lng={newServiceLng}
                showMap={showAddMap} setShowMap={setShowAddMap}
                mapRef={addMapRef} mapInstance={addMapInstance} markerRef={addMarkerRef}
                onPick={(lat: number, lng: number, addr: string) => { setNewServiceLat(lat); setNewServiceLng(lng); setNewServiceAddress(addr); }}
              />

              {/* Cover image */}
              <CoverImagePicker preview={addCoverPreview}
                onFile={(f, url) => { setAddCoverImage(f); setAddCoverPreview(url); }} />

              {/* Submit */}
              <div className="pb-2">
                <button type="submit" disabled={isCreatingService}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-bold shadow-md active:scale-[0.99] transition-all text-sm flex items-center justify-center gap-2">
                  {isCreatingService && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  Create Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---- EDIT SERVICE MODAL ---- */}
      {showEditServiceModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-sm">
          <div className="w-full max-w-[640px] bg-white border border-zinc-200 rounded-2xl shadow-2xl flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-zinc-100 shrink-0">
              <div>
                <h3 className="text-lg font-black text-zinc-900">Edit Service Listing</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Modify the service details below.</p>
              </div>
              <button onClick={() => setShowEditServiceModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-500 font-bold transition-colors" aria-label="Close">
                x
              </button>
            </div>

            <form onSubmit={handleEditServiceSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

              {/* Name + Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Service Name *</label>
                  <input type="text" required placeholder="e.g. Premium Home Cleaning"
                    value={editServiceName} onChange={(e) => setEditServiceName(e.target.value)}
                    className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Service Type *</label>
                  <select value={editServiceType} onChange={(e) => setEditServiceType(e.target.value)} className={inputCls}>
                    {serviceTypes.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Experience + Active */}
              <div className="grid grid-cols-2 gap-4 items-end">
                <div>
                  <label className={labelCls}>Years of Experience</label>
                  <input type="number" min="0" max="50" placeholder="2"
                    value={editServiceExperience} onChange={(e) => setEditServiceExperience(e.target.value)}
                    className={inputCls} />
                </div>
                <div className="flex items-center justify-between px-4 py-3 border border-zinc-200 bg-zinc-50 rounded-xl">
                  <span className="text-sm font-semibold text-zinc-700">Active</span>
                  <button type="button" onClick={() => setEditServiceActive(!editServiceActive)}
                    className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${editServiceActive ? "bg-emerald-500" : "bg-zinc-300"}`}>
                    <span className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${editServiceActive ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className={labelCls}>Description *</label>
                <textarea required placeholder="Describe your service in detail..." rows={2}
                  value={editServiceDesc} onChange={(e) => setEditServiceDesc(e.target.value)}
                  className={`${inputCls} resize-none`} />
              </div>

              {/* Remark */}
              <div>
                <label className={labelCls}>Add Remark (Optional)</label>
                <input type="text" placeholder="e.g. Bring own cleaning tools."
                  value={editServiceRemark} onChange={(e) => setEditServiceRemark(e.target.value)}
                  className={inputCls} />
              </div>

              {/* Pricing tiers */}
              <PricingEditor offered={editOfferedServices} setOffered={setEditOfferedServices} />

              {/* Availability */}
              <AvailabilityEditor availability={editAvailability} setAvailability={setEditAvailability} />

              {/* Location */}
              <MapPicker
                address={editServiceAddress} lat={editServiceLat} lng={editServiceLng}
                showMap={showEditMap} setShowMap={setShowEditMap}
                mapRef={editMapRef} mapInstance={editMapInstance} markerRef={editMarkerRef}
                onPick={(lat: number, lng: number, addr: string) => { setEditServiceLat(lat); setEditServiceLng(lng); setEditServiceAddress(addr); }}
              />

              {/* Cover image */}
              <CoverImagePicker preview={editCoverPreview}
                onFile={(f, url) => { setEditCoverImage(f); setEditCoverPreview(url); }} />

              {/* Submit */}
              <div className="pb-2">
                <button type="submit" disabled={isUpdatingService}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-bold shadow-md active:scale-[0.99] transition-all text-sm flex items-center justify-center gap-2">
                  {isUpdatingService && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---- CALENDAR DAY JOBS MODAL ---- */}
      {selectedCalendarDay && (() => {
        const selMonth = selectedCalendarDay.getMonth();
        const selYear = selectedCalendarDay.getFullYear();
        const selDay = selectedCalendarDay.getDate();
        const dateStr = `${selYear}-${(selMonth + 1).toString().padStart(2, '0')}-${selDay.toString().padStart(2, '0')}`;
        const dayJobs = calendarSchedules[dateStr] || [];

        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-sm">
            <div className="w-full max-w-[480px] bg-white border border-zinc-200 rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-zinc-100 shrink-0">
                <div className="text-left">
                  <h3 className="text-lg font-black text-zinc-900">
                    {selectedCalendarDay.toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </h3>
                  <p className="text-xs text-blue-600 font-bold mt-1">
                    {dayJobs.length > 1 ? `${dayJobs.length} Jobs Scheduled` : (dayJobs[0]?.serviceName || "Service Details")}
                  </p>
                </div>
                <button onClick={() => setSelectedCalendarDay(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-500 font-bold transition-colors cursor-pointer" aria-label="Close">
                  x
                </button>
              </div>

              {/* Jobs List */}
              <div className="overflow-y-auto flex-1 p-6 space-y-4">
                {dayJobs.map((job: any, index: number) => {
                  const propertyName = job.property || job.hotelInfo?.propertyTitle || "Unknown Property";
                  const address = job.propertyAddress || job.hotelInfo?.propertyAddress || "Address not available";
                  const ownerName = job.user?.fullName || "No owner specified";

                  return (
                    <div key={job.id || index} className="p-5 bg-zinc-50 border border-zinc-200 rounded-2xl text-left space-y-4">
                      {dayJobs.length > 1 && (
                        <div className="inline-block px-2.5 py-1 bg-blue-50 rounded-lg text-xs font-black text-blue-600 uppercase tracking-wider">
                          {job.serviceName || "Service"}
                        </div>
                      )}

                      <div>
                        <h4 className="text-sm font-black text-zinc-900">{propertyName}</h4>
                        <div className="flex items-start gap-1.5 text-xs text-zinc-500 mt-2">
                          <svg className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>{address}</span>
                        </div>
                      </div>

                      <div className="border-t border-zinc-200/60 pt-3">
                        <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Property Owner</span>
                        <span className="text-xs font-bold text-zinc-700 mt-0.5 block">{ownerName}</span>
                      </div>

                      <div className="flex gap-3 pt-1">
                        <button
                          onClick={() => {
                            setSelectedCalendarDay(null);
                            if (job.userId) {
                              onMessageOwner(job.userId, ownerName);
                            } else {
                              triggerNotification("Property owner details are not available.", "error");
                            }
                          }}
                          className="flex-1 py-2.5 border border-blue-600 hover:bg-blue-50 text-blue-600 rounded-xl font-bold text-xs transition-all text-center cursor-pointer"
                        >
                          Message
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCalendarDay(null);
                            onViewJobDetails(job.id);
                          }}
                          className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all text-center cursor-pointer"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ---- START PROOF UPLOAD MODAL ---- */}
      {showStartProofModal && selectedJobForProof && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-[500px] bg-white border border-zinc-200 rounded-3xl p-6 shadow-2xl relative animate-zoom-in flex flex-col text-left">
            <button 
              onClick={closeProofModals}
              className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-500 font-bold transition-colors cursor-pointer"
              aria-label="Close"
            >
              ✕
            </button>
            
            <h3 className="text-lg font-black text-zinc-900 tracking-tight">Start Proof</h3>
            <p className="text-xs text-zinc-400 font-bold mt-1 uppercase tracking-wide">Upload work starting video proof</p>

            {/* Job details box */}
            <div className="border border-zinc-200 rounded-2xl p-4 bg-zinc-50/55 space-y-2 mt-4 text-xs font-semibold text-zinc-650">
              <h4 className="text-sm font-black text-zinc-900">{selectedJobForProof.property}</h4>
              <p className="text-xs text-zinc-500 font-bold">{selectedJobForProof.serviceName}</p>
              <div className="grid grid-cols-2 gap-3 pt-3 mt-1 border-t border-zinc-150 text-zinc-500">
                <div className="flex items-center gap-1.5">📅 {selectedJobForProof.date}</div>
                <div className="flex items-center gap-1.5 font-bold text-zinc-900">💵 ${selectedJobForProof.totalPrice || selectedJobForProof.price || 0}</div>
              </div>
            </div>

            {/* File drag selector */}
            {!proofVideoFile ? (
              <label className="border-2 border-dashed border-blue-200 rounded-2xl p-8 text-center bg-blue-50/10 hover:bg-blue-50/20 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer mt-6">
                <input type="file" accept="video/*" className="hidden" onChange={handleVideoFileChange} />
                <div className="p-3.5 rounded-full bg-blue-50 text-blue-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 10l-4 4m0 0l-4-4m4 4V3m-9 8h18" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-800">Select Video Proof</p>
                  <p className="text-xs text-zinc-400 mt-1">Select short video capture before starting job</p>
                </div>
              </label>
            ) : (
              <div className="mt-6 space-y-4">
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-video shadow-inner">
                  <video src={proofVideoPreview || undefined} controls className="w-full h-full object-contain" />
                </div>
                <div className="flex gap-3 justify-end">
                  <button 
                    onClick={handleRemoveVideo}
                    className="px-4 py-2 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-xl font-bold text-xs transition-all cursor-pointer"
                  >
                    Change Video
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button 
                onClick={closeProofModals}
                className="flex-1 py-3 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-xl font-bold text-sm transition-all text-center cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleStartProofSubmit}
                disabled={isUploadingProof || !proofVideoFile}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-bold text-sm shadow-md active:scale-[0.99] transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
              >
                {isUploadingProof && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Submit Proof
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- END PROOF UPLOAD MODAL ---- */}
      {showEndProofModal && selectedJobForProof && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-[500px] bg-white border border-zinc-200 rounded-3xl p-6 shadow-2xl relative animate-zoom-in flex flex-col text-left">
            <button 
              onClick={closeProofModals}
              className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-500 font-bold transition-colors cursor-pointer"
              aria-label="Close"
            >
              ✕
            </button>
            
            <h3 className="text-lg font-black text-zinc-900 tracking-tight">Ending Proof</h3>
            <p className="text-xs text-zinc-400 font-bold mt-1 uppercase tracking-wide">Upload work completion video proof</p>

            {/* Job details box */}
            <div className="border border-zinc-200 rounded-2xl p-4 bg-zinc-50/55 space-y-2 mt-4 text-xs font-semibold text-zinc-650">
              <h4 className="text-sm font-black text-zinc-900">{selectedJobForProof.property}</h4>
              <p className="text-xs text-zinc-500 font-bold">{selectedJobForProof.serviceName}</p>
              <div className="grid grid-cols-2 gap-3 pt-3 mt-1 border-t border-zinc-150 text-zinc-500">
                <div className="flex items-center gap-1.5">📅 {selectedJobForProof.date}</div>
                <div className="flex items-center gap-1.5 font-bold text-zinc-900">💵 ${selectedJobForProof.totalPrice || selectedJobForProof.price || 0}</div>
              </div>
            </div>

            {/* File drag selector */}
            {!proofVideoFile ? (
              <label className="border-2 border-dashed border-blue-200 rounded-2xl p-8 text-center bg-blue-50/10 hover:bg-blue-50/20 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer mt-6">
                <input type="file" accept="video/*" className="hidden" onChange={handleVideoFileChange} />
                <div className="p-3.5 rounded-full bg-blue-50 text-blue-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 10l-4 4m0 0l-4-4m4 4V3m-9 8h18" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-800">Select Video Proof</p>
                  <p className="text-xs text-zinc-400 mt-1">Select short video capture after job completion</p>
                </div>
              </label>
            ) : (
              <div className="mt-6 space-y-4">
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-video shadow-inner">
                  <video src={proofVideoPreview || undefined} controls className="w-full h-full object-contain" />
                </div>
                <div className="flex gap-3 justify-end">
                  <button 
                    onClick={handleRemoveVideo}
                    className="px-4 py-2 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-xl font-bold text-xs transition-all cursor-pointer"
                  >
                    Change Video
                  </button>
                </div>
              </div>
            )}

            {/* Remarks textarea */}
            <div className="space-y-2 mt-4">
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">Add Remarks (Optional)</label>
              <textarea 
                placeholder="Type details about the completed service here..." 
                value={proofRemarks}
                onChange={(e) => setProofRemarks(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-blue-500 bg-zinc-50 outline-none text-xs font-bold text-zinc-800 resize-none"
              />
            </div>

            <div className="mt-6 flex gap-3">
              <button 
                onClick={closeProofModals}
                className="flex-1 py-3 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-xl font-bold text-sm transition-all text-center cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleEndProofSubmit}
                disabled={isUploadingProof || !proofVideoFile}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-bold text-sm shadow-md active:scale-[0.99] transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
              >
                {isUploadingProof && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Submit Proof
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto text-xl font-bold">
              ⚠️
            </div>
            <div>
              <h3 className="text-base font-black text-zinc-950">{confirmModal.title}</h3>
              <p className="text-xs text-zinc-500 font-semibold mt-1.5">{confirmModal.message}</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-500/10 cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
