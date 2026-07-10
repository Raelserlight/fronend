import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ghost, ArrowLeft, ShieldAlert, CheckCircle2, Clock, ThumbsUp, MessageSquare } from 'lucide-react';
import api from '../api/axios';

function Vault() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  
  const [myPosts, setMyPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) navigate('/');
    fetchMyPosts();
  }, []);

  const fetchMyPosts = async () => {
    try {
      const response = await api.get('/posts/vault');
      setMyPosts(response.data.posts);
    } catch (error) {
      console.error("Fetch vault error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="bg-shape shape-1"></div>
      <div className="bg-shape shape-2"></div>
      <div className="bg-shape shape-3"></div>

      <nav className="glass sticky top-0 z-50 px-6 py-3 flex justify-between items-center rounded-b-2xl mb-6 mx-4 md:mx-8">
        <div className="text-xl font-semibold flex items-center gap-2 text-gray-800">
          <Ghost className="text-blue-500" /> My Vault
        </div>
        <button 
          onClick={() => navigate('/feed')} 
          className="bg-white/50 text-gray-700 px-5 py-2 rounded-full font-medium hover:bg-white/80 transition flex items-center gap-2 text-sm"
        >
          <ArrowLeft size={16} /> กลับหน้าฟีด
        </button>
      </nav>

      <div className="max-w-3xl mx-auto px-4 md:px-8 pb-10 space-y-6">
        
        {/* Profile Header */}
        <div className="glass p-8 flex flex-col items-center text-center gap-4">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold text-5xl shadow-inner">
            {user?.avatar}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Anonymous #{user?.anonymousId.substring(0, 5).toUpperCase()}</h2>
            <p className="text-gray-500 mt-1">ไม่มีใครเห็นหน้านี้นอกจากคุณ</p>
          </div>
          <div className="flex gap-4 mt-2">
            <div className="bg-white/50 px-4 py-2 rounded-xl text-sm font-medium text-gray-700">
              โพสต์ทั้งหมด: {myPosts.length}
            </div>
          </div>
        </div>

        {/* My Posts List */}
        <div className="space-y-5">
          <h3 className="font-bold text-lg text-gray-800 pl-2">ประวัติการโพสต์</h3>
          
          {isLoading ? (
            <div className="text-center py-10 text-gray-500">กำลังโหลดข้อมูล...</div>
          ) : myPosts.length === 0 ? (
            <div className="text-center py-10 text-gray-500 glass">คุณยังไม่มีโพสต์ใด ๆ ลองโพสต์ดูสิ</div>
          ) : myPosts.map((post) => (
            <article key={post._id} className="glass p-6 transition hover:-translate-y-1">
              
              {/* Status Badge */}
              <div className="mb-4">
                {post.status === 'published' && (
                  <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                    <CheckCircle2 size={14} /> อนุมัติแล้ว
                  </span>
                )}
                {post.status === 'quarantined' && (
                  <div className="bg-red-50 border border-red-200 p-3 rounded-xl mb-3">
                    <span className="flex items-center gap-1.5 text-red-600 text-xs font-bold mb-1">
                      <ShieldAlert size={14} /> ถูกซ่อน
                    </span>
                    <p className="text-red-500 text-xs">เหตุผล: {post.aiReason || 'เนื้อหาไม่เหมาะสม'}</p>
                  </div>
                )}
                {post.status === 'pending' && (
                  <span className="inline-flex items-center gap-1.5 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold">
                    <Clock size={14} /> กำลังตรวจสอบ
                  </span>
                )}
              </div>

              <div className="flex justify-between items-start mb-3">
                <span className="bg-blue-500/10 text-blue-600 px-3 py-1 rounded-full text-xs font-semibold">
                  #{post.categoryTag}
                </span>
                <div className="text-xs text-gray-500">
                  {new Date(post.createdAt).toLocaleString('th-TH')}
                </div>
              </div>
              
              <div className="text-[0.95rem] text-gray-600 leading-relaxed mb-3 whitespace-pre-wrap">
                {post.content}
              </div>

              {post.imageUrl && (
                <div className="mb-4 rounded-xl overflow-hidden border border-white/30">
                  <img src={post.imageUrl} alt="Post attachment" className="w-full max-h-60 object-cover opacity-80" />
                </div>
              )}

              <div className="flex gap-5 border-t border-black/5 pt-4">
                <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
                  <ThumbsUp size={16} /> {post.supportedBy?.length || 0} กอด
                </div>
                <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
                  <MessageSquare size={16} /> คอมเมนต์
                </div>
              </div>

            </article>
          ))}
        </div>

      </div>
    </>
  );
}

export default Vault;