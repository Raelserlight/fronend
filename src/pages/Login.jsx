import React, { useState } from 'react';
import { Ghost, Loader2, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Swal from 'sweetalert2';

function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [secretKey, setSecretKey] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();

    
    const keyRegex = /^[A-Za-z]\d{9}$/;
    if (!keyRegex.test(secretKey)) {
      Swal.fire({
        icon: 'warning',
        title: 'รูปแบบคีย์ไม่ถูกต้อง',
        text: 'กรุณากรอกตัวอักษร 1 ตัวตามด้วยเลข (เช่น A123456789)',
        confirmButtonColor: '#3b82f6',
        borderRadius: '1rem'
      });
      return;
    }

    setIsLoading(true);
    try {
      
      const response = await api.post('/auth/anonymous', { 
        secretKey: secretKey.toUpperCase() 
      });
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      
      Swal.fire({
        icon: 'success',
        title: response.data.isNewUser ? 'ล็อคอินสำเร็จ!' : 'เวลคัมเเบ็กครับ!',
        text: `อวาตาร์ของคุณคือ ${response.data.user.avatar}`,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });

      navigate('/feed');
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.response?.data?.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้!',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Background Shapes */}
      <div className="bg-shape shape-1"></div>
      <div className="bg-shape shape-2"></div>
      <div className="bg-shape shape-3"></div>

      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass p-8 max-w-md w-full text-center space-y-8">
          
          <div className="flex justify-center">
            <div className="bg-white/30 p-5 rounded-full shadow-lg border border-white/50">
              <Ghost size={56} className="text-blue-600" />
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-wider mb-2 text-gray-800">GhostBoard</h1>
            <p className="text-gray-600 text-sm">
              Welcome 2 GhostBoard! <br />
              กรุณาใส่ Key เพื่อเข้าสู่ระบบ
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="text-left">
              <label className="block text-sm font-medium text-gray-700 mb-1 ml-2">
                Secret Key (คีย์ของคุณ)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <KeyRound size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="เช่น A123456789"
                  maxLength={10}
                  className="w-full bg-white/50 border border-white/50 pl-11 pr-4 py-3 rounded-xl outline-none focus:bg-white/80 focus:ring-2 focus:ring-blue-400 transition text-gray-800 font-medium tracking-widest uppercase"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2 ml-2">
                * ตัวอักษร 1 ตัว + ตัวเลข 9 ตัว หากไม่มี สร้างไหม่เเละเข้าสู่ระบบได้เลย
              </p>
            </div>

            <button 
              type="submit"
              disabled={isLoading || secretKey.length !== 10}
              className="w-full bg-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-600 transition duration-300 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : "เข้าสู่ระบบ / สร้างเเอคไหม่"}
            </button>
          </form>

        </div>
      </div>
    </>
  );
}

export default Login;