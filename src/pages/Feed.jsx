import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { 
  Ghost, Search, PenSquare, Flame, Monitor, Heart, 
  Gamepad2, ThumbsUp, MessageSquare, Loader2, Send, CornerDownRight, ChevronDown, ChevronUp, Image, X, User, Bell, Hash, Tag, Layers, Trash2
} from 'lucide-react';
import api from '../api/axios';
import Swal from 'sweetalert2';

const CATEGORIES = [
  'ปัญหาชีวิต', 'ปัญหาความรัก', 'แอบชอบ', 'อกหัก', 'ครอบครัว', 
  'การเงิน', 'หนี้สิน', 'รีวิว', 'เรื่องผี', 'เกม', 
  'การเรียน', 'เพื่อน', 'สุขภาพจิต', 'ซึมเศร้า', 'ระบายอารมณ์',
  'หาทำ', 'เตือนภัย', 'อุทาหรณ์', '18+', 'ทั่วไป'
];

const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " ปีที่แล้ว";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " เดือนที่แล้ว";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " วันที่แล้ว";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " ชม.ที่แล้ว";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " นาทีที่แล้ว";
  return "เพิ่งโพสต์";
};

function Feed() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const fileInputRef = useRef(null);

  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('ทั่วไป');
  const [customTag, setCustomTag] = useState(''); 
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [comments, setComments] = useState({});
  const [commentInput, setCommentInput] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null); 
  const [expandedReplies, setExpandedReplies] = useState({});

  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const [trendingPosts, setTrendingPosts] = useState([]);
  const [activeFilter, setActiveFilter] = useState('ทั้งหมด');
  const [searchQuery, setSearchQuery] = useState('');

  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showMobilePost, setShowMobilePost] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState('feed'); // feed | trending | notif
  const tagDropdownRef = useRef(null);
  const notifDropdownRef = useRef(null);

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    fetchNotifications();
    fetchTrendingPosts(); 

    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const socket = io(socketUrl);

    socket.on('post_updated', (updatedPost) => {
      setPosts((currentPosts) => currentPosts.map(post => post._id === updatedPost._id ? { ...post, supportedBy: updatedPost.supportedBy } : post));
    });

    socket.on('comment_added', ({ postId, comment }) => {
      setComments((currentComments) => ({ ...currentComments, [postId]: [...(currentComments[postId] || []), comment] }));
      setPosts((currentPosts) => currentPosts.map(post => post._id === postId ? { ...post, commentCount: (post.commentCount || 0) + 1 } : post));
    });

    socket.on('new_notification', (notif) => {
      if (notif.recipientId === user.anonymousId) setNotifications(prev => [notif, ...prev]);
    });

    socket.on('post_deleted', (deletedPostId) => {
      setPosts((currentPosts) => currentPosts.filter(post => post._id !== deletedPostId));
    });

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [activeFilter]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target)) {
        setShowTagDropdown(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/posts', {
        params: { category: activeFilter, search: searchQuery }
      });
      setPosts(response.data.posts);
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  };

  const fetchTrendingPosts = async () => {
    try {
      const response = await api.get('/posts/trending');
      setTrendingPosts(response.data.posts);
    } catch (error) { console.error(error); }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setActiveFilter('ทั้งหมด'); 
    fetchPosts();
    setShowMobileSearch(false);
  };

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data.notifications);
    } catch (error) { console.error(error); }
  };

  const handleMarkAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      await api.put('/notifications/read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) { console.error(error); }
  };

  const handleNotificationClick = (notif) => {
    setShowNotifDropdown(false);
    setActiveMobileTab('feed');
    const postElement = document.getElementById(`post-${notif.postId}`);
    if (postElement) {
      postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      postElement.classList.add('ring-4', 'ring-blue-400', 'transition-all', 'duration-500');
      setTimeout(() => postElement.classList.remove('ring-4', 'ring-blue-400'), 2000);
      if (notif.type === 'comment' && activeCommentPostId !== notif.postId) toggleComments(notif.postId);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({ icon: 'error', title: 'ไฟล์ใหญ่เกินไป!', text: 'ไม่เกิน 5MB ครับ', confirmButtonColor: '#3b82f6' });
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null); setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!content.trim() && !imageFile) return;
    
    const finalCategory = category === 'custom' ? customTag.trim() || 'ไม่มีแท็ก' : category;

    setIsPosting(true);
    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('categoryTag', finalCategory);
      if (imageFile) formData.append('image', imageFile);

      const response = await api.post('/posts', formData);
      
      if (response.data.post.status === 'published') {
        fetchPosts();
        setContent(''); setCustomTag(''); setCategory('ทั่วไป'); removeImage(); setShowTagDropdown(false);
        setShowMobilePost(false);
        Swal.fire({ icon: 'success', title: 'โพสต์สำเร็จ!', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
      } else {
        Swal.fire({ icon: 'warning', title: 'โพสต์ถูกซ่อน', text: `เหตุผล: ${response.data.aiReason}`, confirmButtonColor: '#f59e0b' });
      }
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', confirmButtonColor: '#ef4444' });
    } finally { setIsPosting(false); }
  };

  const handleSupport = async (postId) => {
    try {
      const response = await api.put(`/posts/${postId}/support`);
      setPosts(posts.map(post => post._id === postId ? { ...post, supportedBy: response.data.post.supportedBy } : post));
    } catch (error) { console.error(error); }
  };

  const handleDeletePost = async (postId) => {
    const result = await Swal.fire({
      title: 'ลบโพสต์นี้?',
      text: "แน่นะ?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#9ca3af',
      confirmButtonText: 'เออ, ลบเลย!',
      cancelButtonText: 'ยกเลิก',
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/posts/${postId}`);
        setPosts(posts.filter(post => post._id !== postId));
        Swal.fire({ icon: 'success', title: 'ลบสำเร็จ!', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
      } catch (error) {
        Swal.fire({ icon: 'error', title: 'ลบไม่สำเร็จ', text: 'เกิดข้อผิดพลาดบางอย่าง' });
      }
    }
  };

  const toggleComments = async (postId) => {
    if (activeCommentPostId === postId) { setActiveCommentPostId(null); setReplyingTo(null); return; }
    setActiveCommentPostId(postId);
    try {
      const response = await api.get(`/comments/${postId}`);
      setComments(prev => ({ ...prev, [postId]: response.data.comments }));
    } catch (error) { console.error(error); }
  };

  const toggleReplies = (commentId) => setExpandedReplies(prev => ({ ...prev, [commentId]: !prev[commentId] }));

  const handleCreateComment = async (e, postId) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    setIsCommenting(true);
    try {
      await api.post(`/comments/${postId}`, { content: commentInput, parentCommentId: replyingTo });
      if (replyingTo) setExpandedReplies(prev => ({ ...prev, [replyingTo]: true }));
      setCommentInput(''); setReplyingTo(null);
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'คอมเมนต์ไม่สำเร็จ', confirmButtonColor: '#ef4444' });
    } finally { setIsCommenting(false); }
  };

  const renderPostForm = () => (
    <form onSubmit={handleCreatePost} className="glass p-4 md:p-5 flex flex-col gap-4 min-w-0 relative z-40">
      <div className="flex gap-3 items-start">
        <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-gradient-to-br from-purple-400 to-pink-300 flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-inner">
          {user?.avatar || '?'}
        </div>
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          <textarea 
            value={content} onChange={(e) => setContent(e.target.value)}
            placeholder="แชร์เรื่องราวของคุณ..." 
            className="w-full bg-white/50 border border-white/50 p-3 rounded-2xl outline-none resize-none h-24 focus:bg-white/80 transition text-sm md:text-base"
          />
          {imagePreview && (
            <div className="relative w-fit">
              <img src={imagePreview} alt="Preview" className="h-28 rounded-xl object-cover border border-white/50 shadow-sm" />
              <button type="button" onClick={removeImage} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition active:scale-95">
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center pt-2 border-t border-white/30 relative" ref={tagDropdownRef}>
        <div className="flex items-center gap-2">
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
          <button type="button" onClick={() => fileInputRef.current.click()} className="text-gray-500 hover:text-blue-500 transition p-2 rounded-full hover:bg-white/50 flex items-center gap-1.5 text-sm font-medium active:scale-95">
            <Image size={20} /> <span className="hidden sm:inline">รูปภาพ</span>
          </button>

          <button 
            type="button" 
            onClick={() => setShowTagDropdown(!showTagDropdown)}
            className={`transition px-3 py-1.5 rounded-full flex items-center gap-1.5 text-sm font-medium active:scale-95 ${showTagDropdown ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-white/50'}`}
          >
            <Tag size={18} /> 
            <span className="truncate max-w-[80px] md:max-w-[150px]">
              {category === 'custom' ? (customTag || 'ตั้งแท็กเอง') : category}
            </span>
            <ChevronDown size={14} className={`transition-transform ${showTagDropdown ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <button type="submit" disabled={isPosting || (!content.trim() && !imageFile)} className="bg-blue-500 text-white px-5 py-2 rounded-full font-bold shadow-md hover:bg-blue-600 transition disabled:opacity-50 flex items-center gap-2 text-sm active:scale-95">
          {isPosting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {isPosting ? 'กำลังโพสต์...' : 'โพสต์เลย'}
        </button>

        {showTagDropdown && (
          <div className="absolute bottom-full mb-2 md:bottom-auto md:top-full md:mt-2 left-0 w-[min(280px,90vw)] glass p-3 rounded-2xl shadow-2xl border border-white/50 z-[9999] animate-in fade-in">
            <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto custom-scrollbar p-1">
              {CATEGORIES.map(cat => (
                <button 
                  key={cat} type="button" 
                  onClick={() => { setCategory(cat); setShowTagDropdown(false); }} 
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all active:scale-95 ${category === cat ? 'bg-blue-500 text-white shadow-md' : 'bg-white/60 text-gray-600 hover:bg-white'}`}
                >
                  #{cat}
                </button>
              ))}
              <button 
                type="button" 
                onClick={() => setCategory('custom')} 
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all active:scale-95 ${category === 'custom' ? 'bg-purple-500 text-white shadow-md' : 'bg-white/60 text-gray-600 hover:bg-white'}`}
              >
                 ตั้งแท็กเอง
              </button>
            </div>
            
            {category === 'custom' && (
              <div className="mt-3 pt-3 border-t border-black/5 flex items-center gap-2">
                <Hash size={16} className="text-gray-400" />
                <input 
                  type="text" value={customTag} onChange={(e) => setCustomTag(e.target.value)}
                  placeholder="พิมพ์แท็กของคุณ..." maxLength={20}
                  className="flex-1 bg-white/50 border border-white/50 px-3 py-1.5 rounded-lg outline-none focus:bg-white/80 transition text-sm"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </form>
  );

  return (
    <>
      <div className="bg-shape shape-1"></div>
      <div className="bg-shape shape-2"></div>
      <div className="bg-shape shape-3"></div>

      <nav className="glass sticky top-0 z-50 px-3 md:px-6 py-3 flex justify-between items-center rounded-b-2xl mb-4 md:mb-6 mx-2 md:mx-8 backdrop-blur-xl">
        <div
          className="text-xl font-semibold flex items-center gap-2 text-gray-800 cursor-pointer"
          onClick={() => { setActiveFilter('ทั้งหมด'); setSearchQuery(''); setActiveMobileTab('feed'); }}
        >
          <Ghost className="text-blue-500" />
          <span className="hidden sm:block">GhostBoard</span>
        </div>

        <form onSubmit={handleSearch} className="hidden md:flex items-center bg-white/50 border border-white/50 px-4 py-2 rounded-full w-80 transition focus-within:bg-white/80">
          <Search size={18} className="text-gray-500 mr-2" />
          <input 
            type="text" value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาโพสต์, แท็ก..." 
            className="bg-transparent outline-none w-full text-sm" 
          />
        </form>
        
        <div className="flex items-center gap-2">
          
          <button
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="md:hidden bg-white/80 text-gray-600 p-2.5 rounded-full shadow-sm hover:bg-white transition active:scale-95"
          >
            <Search size={18} />
          </button>

          <div className="relative" ref={notifDropdownRef}>
            <button
              onClick={() => { setShowNotifDropdown(!showNotifDropdown); if (!showNotifDropdown) handleMarkAsRead(); }}
              className="bg-white/80 text-gray-600 p-2.5 rounded-full shadow-sm hover:bg-white transition relative active:scale-95"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotifDropdown && (
              <div className="absolute right-0 mt-2 w-[min(320px,90vw)] glass p-2 rounded-2xl shadow-2xl border border-white/50 z-50 animate-in fade-in slide-in-from-top-2">
                <h3 className="font-bold text-gray-800 px-3 py-2 border-b border-black/5">การแจ้งเตือน</h3>
                <div className="max-h-72 overflow-y-auto custom-scrollbar mt-2">
                  {notifications.length === 0 ? (
                    <div className="text-center text-gray-400 text-sm py-6">ไม่มีการแจ้งเตือนใหม่</div>
                  ) : notifications.map(notif => (
                    <div
                      key={notif._id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-3 rounded-xl mb-1 text-sm transition cursor-pointer active:scale-[0.98] ${notif.isRead ? 'hover:bg-white/40' : 'bg-blue-50/50 hover:bg-blue-50'}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full shrink-0 ${notif.type === 'support' ? 'bg-pink-100 text-pink-500' : 'bg-blue-100 text-blue-500'}`}>
                          {notif.type === 'support' ? <Heart size={14} /> : <MessageSquare size={14} />}
                        </div>
                        <div>
                          <p className="text-gray-700 leading-snug text-xs md:text-sm">
                            <span className="font-semibold">Anonymous #{notif.senderId.substring(0, 5).toUpperCase()}</span>
                            {notif.type === 'support' ? ' ได้กดไลค์โพสต์ของคุณ' : ' ได้คอมเมนต์ในโพสต์ของคุณ'}
                          </p>
                          <span className="text-[10px] text-gray-400">{timeAgo(notif.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button onClick={() => navigate('/vault')} className="bg-white/80 text-blue-600 p-2.5 md:px-4 md:py-2 rounded-full font-bold shadow-sm hover:bg-white transition flex items-center gap-2 text-sm active:scale-95">
            <User size={18} /> <span className="hidden md:inline">โปรไฟล์</span>
          </button>

          <button onClick={() => { localStorage.clear(); navigate('/'); }} className="bg-blue-500 text-white p-2.5 md:px-4 md:py-2 rounded-full font-medium shadow-lg shadow-blue-500/30 hover:bg-blue-600 transition flex items-center gap-2 text-sm active:scale-95">
            <PenSquare size={18} /> <span className="hidden md:inline">ออก</span>
          </button>
        </div>
      </nav>

      {showMobileSearch && (
        <div className="md:hidden mx-2 mb-3 animate-in fade-in slide-in-from-top-2">
          <form onSubmit={handleSearch} className="flex items-center bg-white/70 border border-white/50 px-4 py-2.5 rounded-full shadow-sm focus-within:bg-white/90 transition">
            <Search size={18} className="text-gray-500 mr-2 shrink-0" />
            <input 
              autoFocus
              type="search"
              inputMode="search"
              enterKeyHint="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาโพสต์, แท็ก..." 
              className="bg-transparent outline-none w-full text-sm" 
            />
            {searchQuery && (
              <button type="button" onClick={() => { setSearchQuery(''); }} className="text-gray-400 ml-1">
                <X size={16} />
              </button>
            )}
          </form>
        </div>
      )}
      
      <div className="max-w-[1400px] mx-auto px-2 md:px-8 grid grid-cols-1 lg:grid-cols-[250px_1fr_300px] xl:grid-cols-[280px_1fr_320px] gap-6 pb-24 md:pb-8">

        <aside className="hidden lg:block sticky top-[90px] h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar space-y-1 glass p-4">
          <div 
            onClick={() => setActiveFilter('ทั้งหมด')} 
            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition font-medium mb-2 ${activeFilter === 'ทั้งหมด' ? 'bg-white/80 text-blue-600 shadow-sm' : 'text-gray-700 hover:bg-white/60'}`}
          >
            <Layers className={activeFilter === 'ทั้งหมด' ? "text-blue-500" : "text-gray-500"} size={20} /> 
            โพสต์ทั้งหมด
          </div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-3 mb-2 mt-4">หมวดหมู่</div>
          {CATEGORIES.map(cat => (
            <div 
              key={cat} 
              onClick={() => setActiveFilter(cat)} 
              className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition text-sm font-medium ${activeFilter === cat ? 'bg-white/80 text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-white/60'}`}
            >
              <Hash className={activeFilter === cat ? "text-blue-500" : "text-gray-400"} size={18} />
              {cat}
            </div>
          ))}
        </aside>

        <main className="flex flex-col gap-4 min-w-0">

          <div className="lg:hidden flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
            <button 
              onClick={() => setActiveFilter('ทั้งหมด')} 
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all active:scale-95 shrink-0 ${activeFilter === 'ทั้งหมด' ? 'bg-blue-500 text-white shadow-md' : 'bg-white/60 text-gray-600'}`}
            >
              <Layers size={13} className="inline mr-1 mb-0.5"/> ทั้งหมด
            </button>
            {CATEGORIES.map(cat => (
              <button 
                key={cat} 
                onClick={() => setActiveFilter(cat)} 
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all active:scale-95 shrink-0 ${activeFilter === cat ? 'bg-blue-500 text-white shadow-md' : 'bg-white/60 text-gray-600'}`}
              >
                #{cat}
              </button>
            ))}
          </div>

          <div className="hidden md:block">
            {renderPostForm()}
          </div>

          {(activeFilter !== 'ทั้งหมด' || searchQuery) && (
            <div className="flex items-center justify-between glass px-4 py-2 rounded-xl">
              <span className="text-sm font-medium text-gray-700">
                {searchQuery ? `ผลการค้นหา: "${searchQuery}"` : `หมวดหมู่: #${activeFilter}`}
              </span>
              <button onClick={() => { setActiveFilter('ทั้งหมด'); setSearchQuery(''); }} className="text-xs text-blue-500 hover:underline">
                ล้าง
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-10 text-gray-500 flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-blue-500" size={32} />
              กำลังโหลดโพสต์...
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16 glass flex flex-col items-center gap-3">
              <Ghost size={48} className="text-gray-400" />
              <p className="text-gray-500 font-medium">ไม่พบโพสต์ที่คุณค้นหา</p>
            </div>
          ) : posts.map((post) => (
            <article
              id={`post-${post._id}`}
              key={post._id}
              className="glass p-4 md:p-6 transition hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(31,38,135,0.1)] relative z-10"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 md:w-11 md:h-11 rounded-full bg-gradient-to-br from-blue-400 to-cyan-300 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-inner">
                    {post.authorId === user?.anonymousId ? user.avatar : 'A'}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-gray-800">Anonymous #{post.authorId.substring(0, 5).toUpperCase()}</div>
                    <div className="text-[11px] text-gray-500">{timeAgo(post.createdAt)}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <span 
                    onClick={() => setActiveFilter(post.categoryTag)} 
                    className="bg-blue-500/10 text-blue-600 px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer hover:bg-blue-500/20 transition"
                  >
                    #{post.categoryTag}
                  </span>
                  {post.authorId === user?.anonymousId && (
                    <button 
                      onClick={() => handleDeletePost(post._id)}
                      className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition active:scale-95"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="text-sm md:text-[0.95rem] text-gray-700 leading-relaxed mb-3 whitespace-pre-wrap break-words">{post.content}</div>

              {post.imageUrl && (
                <div className="mb-4 rounded-xl overflow-hidden border border-white/30 shadow-sm">
                  <img src={post.imageUrl} alt="Post attachment" className="w-full max-h-[300px] md:max-h-[500px] object-cover" loading="lazy" />
                </div>
              )}

              <div className="flex gap-2 border-t border-black/5 pt-3">
                <button
                  onClick={() => handleSupport(post._id)}
                  className={`flex-1 flex justify-center items-center gap-1.5 py-2.5 rounded-xl transition text-xs font-medium active:scale-95 ${post.supportedBy?.includes(user?.anonymousId) ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-blue-600 hover:bg-white/60'}`}
                >
                  <ThumbsUp size={16} className={post.supportedBy?.includes(user?.anonymousId) ? "fill-blue-600" : ""} />
                  {post.supportedBy?.length || 0} ไลค์
                </button>

                <button
                  onClick={() => toggleComments(post._id)}
                  className={`flex-1 flex justify-center items-center gap-1.5 py-2.5 rounded-xl transition text-xs font-medium active:scale-95 ${activeCommentPostId === post._id ? 'text-gray-800 bg-white/60' : 'text-gray-500 hover:text-gray-800 hover:bg-white/60'}`}
                >
                  <MessageSquare size={16} />
                  {comments[post._id] ? comments[post._id].length : (post.commentCount || 0)} คอมเมนต์
                </button>
              </div>

              {activeCommentPostId === post._id && (
                <div className="mt-3 pt-3 border-t border-black/5 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="space-y-2 mb-3 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                    {(comments[post._id] || []).filter(c => !c.parentCommentId).map(comment => {
                      const replies = (comments[post._id] || []).filter(reply => reply.parentCommentId === comment._id);
                      const isExpanded = expandedReplies[comment._id];
                      const aliasIcon = comment.alias?.aliasIcon || "👤";
                      const aliasColor = comment.alias?.aliasColor || "#9ca3af";
                      const isOP = aliasIcon === "👑";

                      return (
                        <div key={comment._id} className="space-y-1">
                          <div className="bg-white/40 p-2.5 rounded-xl text-xs">
                            <div className="flex justify-between items-center mb-1">
                              <div className="font-semibold flex items-center gap-1.5" style={{ color: aliasColor }}>
                                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white shadow-sm" style={{ backgroundColor: aliasColor }}>{aliasIcon}</div>
                                {isOP ? "เจ้าของกระทู้" : `Anonymous ${aliasIcon}`}
                              </div>
                              <button onClick={() => setReplyingTo(comment._id)} className="text-[10px] text-blue-500 font-medium active:scale-95 px-2 py-1">ตอบกลับ</button>
                            </div>
                            <div className="text-gray-700 pl-6">{comment.content}</div>
                          </div>

                          {replies.length > 0 && (
                            <button onClick={() => toggleReplies(comment._id)} className="text-[10px] text-gray-500 ml-6 font-medium flex items-center gap-1 py-1 active:scale-95">
                              {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                              {isExpanded ? 'ซ่อนการตอบกลับ' : `ดูการตอบกลับ (${replies.length})`}
                            </button>
                          )}

                          {isExpanded && replies.map(reply => {
                            const rAliasIcon = reply.alias?.aliasIcon || "👤";
                            const rAliasColor = reply.alias?.aliasColor || "#9ca3af";
                            const rIsOP = rAliasIcon === "👑";
                            return (
                              <div key={reply._id} className="bg-white/30 p-2.5 rounded-xl text-xs ml-6 border-l-2 mb-1" style={{ borderColor: rAliasColor }}>
                                <div className="font-semibold mb-1 flex items-center gap-1.5" style={{ color: rAliasColor }}>
                                  <CornerDownRight size={10} className="text-gray-400" />
                                  <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] text-white shadow-sm" style={{ backgroundColor: rAliasColor }}>{rAliasIcon}</div>
                                  {rIsOP ? "เจ้าของโพสต์" : `Anonymous ${rAliasIcon}`}
                                </div>
                                <div className="text-gray-700 pl-5">{reply.content}</div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                    {(comments[post._id] || []).length === 0 && (
                      <div className="text-center text-gray-400 text-xs py-3">ยังไม่มีคอมเมนต์ เริ่มเป็นคนแรกเลย!</div>
                    )}
                  </div>

                  <form onSubmit={(e) => handleCreateComment(e, post._id)} className="flex flex-col gap-2">
                    {replyingTo && (
                      <div className="flex justify-between items-center bg-blue-50 text-blue-600 text-[10px] px-3 py-1.5 rounded-lg">
                        <span>กำลังตอบกลับคอมเมนต์...</span>
                        <button type="button" onClick={() => setReplyingTo(null)} className="font-bold hover:text-red-500">✕ ยกเลิก</button>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        inputMode="text"
                        enterKeyHint="send"
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        placeholder={replyingTo ? "พิมพ์ข้อความตอบกลับ..." : "แสดงความคิดเห็น..."}
                        className="flex-1 bg-white/50 border border-white/50 px-3 py-2.5 rounded-full outline-none focus:bg-white/80 transition text-xs"
                      />
                      <button
                        type="submit"
                        disabled={isCommenting || !commentInput.trim()}
                        className="bg-blue-500 text-white px-3 py-2.5 rounded-full font-medium shadow-md hover:bg-blue-600 transition disabled:opacity-50 flex items-center active:scale-95 min-w-[40px] justify-center"
                      >
                        <Send size={15} />
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </article>
          ))}
        </main>

        <aside className="hidden lg:block sticky top-[90px] h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar glass p-5">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Flame className="text-orange-500" size={18} /> กำลังมาแรง
          </h3>
          <div className="space-y-4">
            {trendingPosts.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-4">ยังไม่มีโพสต์มาแรง</div>
            ) : trendingPosts.map(post => (
              <div 
                key={post._id} 
                onClick={() => {
                  const el = document.getElementById(`post-${post._id}`);
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.classList.add('ring-4', 'ring-blue-400');
                    setTimeout(() => el.classList.remove('ring-4', 'ring-blue-400'), 2000);
                  } else {
                    setActiveFilter('ทั้งหมด');
                    setSearchQuery('');
                    setTimeout(() => {
                      const newEl = document.getElementById(`post-${post._id}`);
                      if (newEl) newEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 500);
                  }
                }} 
                className="border-b border-black/5 pb-3 cursor-pointer hover:opacity-70 transition"
              >
              <div className="text-sm font-medium text-gray-800 mb-1 leading-snug line-clamp-2">{post.content}</div>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <ThumbsUp size={12} className="text-blue-500" /> {post.supportCount || 0} ไลค์ • #{post.categoryTag}
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>

     <nav className="lg:hidden mobile-bottom-nav z-50 glass border-t border-white/40 flex items-center justify-around px-2 pt-2">
        <button
          onClick={() => setActiveMobileTab('feed')}
          className={`flex flex-col items-center gap-0.5 py-1.5 px-4 rounded-xl transition active:scale-95 ${activeMobileTab === 'feed' ? 'text-blue-600' : 'text-gray-500'}`}
        >
          <Layers size={22} />
          <span className="text-[10px] font-medium">ฟีด</span>
        </button>

        <button
          onClick={() => setShowMobilePost(true)}
          className="bg-blue-500 text-white w-14 h-14 rounded-full shadow-lg shadow-blue-500/40 flex items-center justify-center hover:bg-blue-600 transition active:scale-90 -mt-5"
        >
          <PenSquare size={24} />
        </button>

        <button
          onClick={() => setActiveMobileTab('trending')}
          className={`flex flex-col items-center gap-0.5 py-1.5 px-4 rounded-xl transition active:scale-95 ${activeMobileTab === 'trending' ? 'text-orange-500' : 'text-gray-500'}`}
        >
          <Flame size={22} />
          <span className="text-[10px] font-medium">มาแรง</span>
        </button>
      </nav>
      
      {activeMobileTab === 'trending' && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setActiveMobileTab('feed')}>
          <div
            className="absolute bottom-20 left-2 right-2 glass rounded-2xl p-5 shadow-2xl max-h-[60vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Flame className="text-orange-500" size={18} /> กำลังมาแรง
            </h3>
            <div className="space-y-4">
              {trendingPosts.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-4">ยังไม่มีโพสต์มาแรง</div>
              ) : trendingPosts.map(post => (
                <div
                  key={post._id}
                  onClick={() => {
                    setActiveMobileTab('feed');
                    setTimeout(() => {
                      const el = document.getElementById(`post-${post._id}`);
                      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
                    }, 100);
                  }}
                  className="border-b border-black/5 pb-3 cursor-pointer active:opacity-70"
                >
                  <div className="text-sm font-medium text-gray-800 mb-1 leading-snug line-clamp-2">{post.content}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <ThumbsUp size={12} className="text-blue-500" /> {post.supportCount || 0} ไลค์ • #{post.categoryTag}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showMobilePost && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-end">
          <div className="w-full animate-in slide-in-from-bottom-4 duration-300">
            <div className="mx-2 mb-2 glass rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex justify-between items-center px-4 pt-4 pb-2 border-b border-white/30">
                <span className="font-semibold text-gray-800">โพสต์ใหม่</span>
                <button onClick={() => setShowMobilePost(false)} className="text-gray-400 hover:text-gray-600 active:scale-95 p-1">
                  <X size={20} />
                </button>
              </div>
              {renderPostForm()}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Feed;
