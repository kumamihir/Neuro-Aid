import { useEffect, useState } from "react";
import HeaderNav from "@/components/HeaderNav";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Mail, Phone, Calendar, Heart, Activity, Camera } from "lucide-react";

export default function Profile() {
  const API_URL = import.meta.env.DEV ? "http://localhost:10001" : "https://patient-backend-olyv.onrender.com";
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [uploadingImage, setUploadingImage] = useState(false);

  // Note: To use Cloudinary from frontend securely, you need a Cloud Name and an Unsigned Upload Preset.
  // Go to Cloudinary Settings > Upload > Add Upload Preset (Set "Signing Mode" to "Unsigned").
  const CLOUDINARY_CLOUD_NAME = "YOUR_CLOUD_NAME_HERE"; 
  const CLOUDINARY_UPLOAD_PRESET = "YOUR_UPLOAD_PRESET_HERE";

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.status === "ok") {
        setUser(data.user);
        setFormData({
          name: data.user.name || "",
          phone: data.user.phone || "",
          age: data.user.age || "",
          gender: data.user.gender || "",
          bloodGroup: data.user.bloodGroup || "",
          profileImage: data.user.profileImage || ""
        });
      }
    } catch (err) {
      console.error("Error fetching profile", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (CLOUDINARY_CLOUD_NAME === "YOUR_CLOUD_NAME_HERE") {
      alert("Please update your Cloudinary Cloud Name and Upload Preset in the code first!");
      return;
    }

    setUploadingImage(true);
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    data.append("cloud_name", CLOUDINARY_CLOUD_NAME);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: data,
      });
      const uploadResult = await res.json();
      if (uploadResult.secure_url) {
        setFormData({ ...formData, profileImage: uploadResult.secure_url });
        
        // Auto-save the profile picture update to DB
        const token = localStorage.getItem("token");
        await fetch(`${API_URL}/profile`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ profileImage: uploadResult.secure_url }),
        });
        
        // Refresh local user state so picture shows immediately even when not in edit mode
        setUser((prev: any) => ({ ...prev, profileImage: uploadResult.secure_url }));
        alert("Profile picture updated!");
      }
    } catch (err) {
      console.error("Cloudinary upload error", err);
      alert("Failed to upload image.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.status === "ok") {
        setUser(data.user);
        setIsEditing(false);
        alert("Profile updated successfully!");
      } else {
        alert(data.message || "Failed to update profile.");
      }
    } catch (err) {
      console.error("Error updating profile", err);
    }
  };

  if (loading) return <div className="text-center mt-20 text-lg">Loading Profile...</div>;
  if (!user) return <div className="text-center mt-20 text-lg">Please log in to view profile.</div>;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans pb-10">
      <HeaderNav />

      <main className="container mx-auto px-4 mt-8">
        <Card className="max-w-xl mx-auto shadow-2xl rounded-2xl border border-border overflow-hidden">
          
          <div className="bg-gradient-to-r from-primary to-blue-400 h-32 relative">
            <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
              <div className="relative group">
                <img 
                  src={formData.profileImage || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + user.name} 
                  alt="Profile" 
                  className="w-24 h-24 rounded-full border-4 border-background object-cover bg-white"
                />
                <label className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-white">
                  <Camera className="w-8 h-8"/>
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
                </label>
              </div>
            </div>
          </div>
          
          <CardContent className="pt-16 pb-8 px-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">{user.name}</h2>
              <p className="text-muted-foreground flex items-center justify-center gap-2 mt-1">
                <Mail className="w-4 h-4"/> {user.email}
              </p>
              {uploadingImage && <p className="text-sm text-primary mt-2 animate-pulse">Uploading photo...</p>}
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="text-primary w-5 h-5"/>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Full Name</p>
                  {isEditing ? <Input name="name" value={formData.name} onChange={handleInputChange} className="mt-1" /> : <p className="font-medium text-lg">{user.name}</p>}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Phone className="text-primary w-5 h-5"/>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Phone Number</p>
                  {isEditing ? <Input name="phone" value={formData.phone} onChange={handleInputChange} className="mt-1" /> : <p className="font-medium text-lg">{user.phone || "Not provided"}</p>}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="text-primary w-5 h-5"/>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Age</p>
                  {isEditing ? <Input name="age" type="number" value={formData.age} onChange={handleInputChange} className="mt-1" /> : <p className="font-medium text-lg">{user.age || "N/A"}</p>}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Heart className="text-primary w-5 h-5"/>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Gender</p>
                  {isEditing ? <Input name="gender" value={formData.gender} onChange={handleInputChange} className="mt-1" /> : <p className="font-medium text-lg capitalize">{user.gender || "Not specified"}</p>}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Activity className="text-primary w-5 h-5"/>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Blood Group</p>
                  {isEditing ? <Input name="bloodGroup" value={formData.bloodGroup} onChange={handleInputChange} placeholder="e.g. O+" className="mt-1" /> : <p className="font-medium text-lg">{user.bloodGroup || "Not recorded"}</p>}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-center gap-4">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={() => { setIsEditing(false); setFormData(user); }}>Cancel</Button>
                  <Button onClick={handleSaveProfile} className="bg-primary text-primary-foreground">Save Changes</Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)} className="w-full sm:w-auto px-8 shadow-sm">Edit Profile</Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}