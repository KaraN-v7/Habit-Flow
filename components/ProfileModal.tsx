import React, { useState, useRef } from 'react';
import { User } from '../types';
import { X, Camera, Mail, Phone, Save } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpdateUser: (updatedUser: User) => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, user, onUpdateUser }) => {
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [avatar, setAvatar] = useState(user.avatar || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onUpdateUser({
      ...user,
      username,
      email,
      phone,
      avatar
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#202020] rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-[#E0E0E0] dark:border-[#333]">
        <div className="flex justify-between items-center p-6 border-b border-[#E0E0E0] dark:border-[#333]">
          <h3 className="font-bold text-xl text-[#37352F] dark:text-[#E0E0E0]">Student Profile</h3>
          <button onClick={onClose} className="text-[#9B9B9B] hover:text-[#37352F] dark:hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-col md:flex-row h-[500px]">
          {/* Left Side - Details */}
          <div className="flex-1 p-6 space-y-6 overflow-y-auto">
            <div className="flex flex-col items-center mb-6">
              <div 
                className="relative w-24 h-24 rounded-full bg-[#F0F0F0] dark:bg-[#333] mb-4 overflow-hidden border-2 border-[#E0E0E0] dark:border-[#444] group cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {avatar ? (
                  <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">🎓</div>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="text-white" size={20} />
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleImageUpload}
              />
              <div className="text-center">
                <h4 className="font-bold text-lg dark:text-white">{user.username}</h4>
                <div className="text-sm text-[#787774] dark:text-[#999]">JEE Aspirant</div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#787774] dark:text-[#999] uppercase mb-1">Display Name</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-[#E0E0E0] dark:border-[#444] bg-[#FAFAFA] dark:bg-[#2C2C2C] dark:text-white focus:outline-none focus:border-[#37352F] dark:focus:border-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#787774] dark:text-[#999] uppercase mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 text-[#9B9B9B]" size={16} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full pl-9 pr-3 py-2 rounded-md border border-[#E0E0E0] dark:border-[#444] bg-[#FAFAFA] dark:bg-[#2C2C2C] dark:text-white focus:outline-none focus:border-[#37352F] dark:focus:border-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#787774] dark:text-[#999] uppercase mb-1">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 text-[#9B9B9B]" size={16} />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2 rounded-md border border-[#E0E0E0] dark:border-[#444] bg-[#FAFAFA] dark:bg-[#2C2C2C] dark:text-white focus:outline-none focus:border-[#37352F] dark:focus:border-white"
                  />
                </div>
              </div>
            </div>
            
            <button 
              onClick={handleSave}
              className="w-full mt-4 bg-[#37352F] dark:bg-white dark:text-black text-white font-medium py-2 rounded-md flex items-center justify-center gap-2 hover:bg-black dark:hover:bg-[#E0E0E0] transition-colors"
            >
              <Save size={16} /> Save Profile
            </button>
          </div>

          {/* Right Side - Badges */}
          <div className="flex-1 bg-[#F7F7F5] dark:bg-[#191919] p-6 overflow-y-auto border-l border-[#E0E0E0] dark:border-[#333]">
            <h4 className="font-bold text-[#37352F] dark:text-[#E0E0E0] mb-4 flex items-center gap-2">
              <span>🏆</span> Badges Collection
            </h4>
            
            {user.badges.length === 0 ? (
              <div className="text-center text-[#9B9B9B] py-10">
                No badges earned yet. Start your streak!
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {user.badges.map(badge => (
                  <div key={badge.id} className="bg-white dark:bg-[#2C2C2C] p-3 rounded-lg border border-[#E0E0E0] dark:border-[#444] text-center shadow-sm">
                    <div className="text-3xl mb-2">{badge.icon}</div>
                    <div className="text-xs font-bold text-[#37352F] dark:text-white mb-1">{badge.name}</div>
                    <div className="text-[10px] text-[#787774] dark:text-[#999] leading-tight">{badge.description}</div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-8 p-4 bg-[#EFEFED] dark:bg-[#333] rounded-lg">
                <div className="text-xs font-bold text-[#787774] dark:text-[#AAA] uppercase mb-1">Total Streak Points</div>
                <div className="text-2xl font-bold text-[#D97706] flex items-center gap-2">
                    🔥 {user.totalStreakPoints || 0}
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;